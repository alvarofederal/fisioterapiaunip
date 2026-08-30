# Contexto de Funcionalidades — Agente de IA
# Sistema de Agendamento para Profissionais da Saúde

> Lido por Claude em sessões futuras. Descreve cada funcionalidade de IA planejada,
> o que cada agente faz, quais dados consome do MySQL, e o que retorna.

---

## Mapa de funcionalidades por fase

```
FASE 1 — Implementação imediata (baixo risco)
  ├── Sugestão de Horário
  └── Lembrete Inteligente

FASE 2 — Médio prazo (requer histórico acumulado)
  ├── Briefing Diário do Profissional
  ├── Detecção de Paciente Ausente
  └── Slot Liberado → Notificação de Fila

FASE 3 — IA Proativa (dados suficientes acumulados)
  ├── Aprendizado de Padrões
  └── Chat de Triagem Pré-Consulta
```

---

## FASE 1

### 1.1 Sugestão de Horário

**O que faz:** paciente descreve em linguagem natural quando quer consultar.
O agente analisa a agenda disponível e o histórico do paciente e sugere o melhor slot.

**Endpoint:** `POST /api/ia/sugerir-horario`

**Dados que o NestJS passa ao agente:**
```typescript
{
  pedido: string,           // "quero semana que vem de manhã, não segunda"
  slots: Slot[],            // agenda disponível do profissional
  historico: Agendamento[], // últimos N agendamentos do paciente
  preferencias: {           // extraído do histórico
    periodo_preferido: string,
    dias_evitados: string[],
    taxa_cancelamento: number
  }
}
```

**O que o agente retorna:**
```typescript
{
  horario: string,   // "09h30"
  data: string,      // "2025-04-22"
  dia_semana: string,// "Terça-feira"
  motivo: string,    // "Você costuma agendar neste horário e tem boa taxa de comparecimento"
  alternativas: []   // outros 2 horários caso o paciente recuse
}
```

**Como salvar para aprendizado:**
```typescript
// após o paciente aceitar ou recusar
await iaMemoriaRepo.save({ tipo: 'sugestao_horario', entrada: pedido, saida: horario, aceito: true/false })
```

---

### 1.2 Confirmação Automática por Email

**O que faz:** após confirmar o agendamento, o agente gera e envia um email
personalizado — não um template genérico, mas com contexto do paciente.

**Trigger:** evento `agendamento.criado` no NestJS (event emitter ou hook do TypeORM)

**Dados que o NestJS passa ao agente:**
```typescript
{
  paciente: { nome, email, historico_resumido },
  agendamento: { data, horario, profissional, especialidade, tipo_consulta },
  preparo: string | null   // instruções específicas do profissional
}
```

**O que o agente retorna:** string de email completa, personalizada, em português.

**NestJS então chama:** `nodemailer` ou `@nestjs-modules/mailer` para enviar.

---

## FASE 2

### 2.1 Lembrete Inteligente

**O que faz:** envia lembrete antes da consulta. O timing é ajustado pelo histórico:
paciente que costuma cancelar em cima da hora recebe lembrete mais cedo.

**Como funciona:**
```typescript
// Cron job no NestJS — roda diariamente
@Cron('0 8 * * *')
async enviarLembretes() {
  const agendamentos = await this.agendaService.getProximosAgendamentos()

  for (const agendamento of agendamentos) {
    const historico = await this.pacienteService.getHistorico(agendamento.pacienteId)

    const decisao = await this.ia.perguntarJSON(
      'Você decide o timing ideal de lembrete com base no histórico do paciente.',
      `Consulta em: ${agendamento.data}\nHistórico de cancelamentos: ${JSON.stringify(historico)}`
    )
    // decisao = { enviar_agora: true, motivo: "paciente tem 3 cancelamentos recentes" }

    if (decisao.enviar_agora) {
      await this.emailService.enviarLembrete(agendamento)
    }
  }
}
```

---

### 2.2 Briefing Diário do Profissional

**O que faz:** ao fazer login, o profissional vê um parágrafo gerado por IA
com destaques do dia — não só a lista de pacientes, mas insights relevantes.

**Endpoint:** `GET /api/ia/briefing-dia/:profissionalId`

**Dados que o NestJS passa ao agente:**
```typescript
{
  agenda_hoje: Agendamento[],
  alertas: [
    { paciente: "Maria", motivo: "não consulta há 4 meses" },
    { paciente: "Carlos", motivo: "slot das 16h sem confirmação" }
  ],
  metricas: {
    total_hoje: number,
    confirmados: number,
    taxa_semana: number
  }
}
```

**O que o agente retorna:** string — parágrafo de 3-5 linhas, direto ao ponto.

---

### 2.3 Detecção de Paciente Ausente

**O que faz:** identifica pacientes que não consultam há X meses e sugere
ação ao profissional (envio de mensagem de reengajamento).

**Cron job semanal:**
```typescript
@Cron('0 9 * * 1') // toda segunda de manhã
async detectarAusentes() {
  const ausentes = await this.pacienteRepo
    .createQueryBuilder('p')
    .where('p.ultima_consulta < :data', { data: subMonths(new Date(), 3) })
    .getMany()

  const analise = await this.ia.perguntarJSON(
    'Analise os pacientes ausentes e priorize quem deve ser contatado primeiro.',
    `Pacientes sem consulta há mais de 3 meses: ${JSON.stringify(ausentes)}`
  )
  // Salva na tabela de alertas para o profissional ver no painel
  await this.alertaRepo.save(analise.prioridades)
}
```

---

### 2.4 Slot Liberado → Notificação de Fila

**O que faz:** quando um paciente cancela, o agente identifica quem está
em lista de espera e envia notificação para o mais adequado.

**Trigger:** evento `agendamento.cancelado`

**Dados passados ao agente:**
```typescript
{
  slot_liberado: { data, horario, profissional, especialidade },
  lista_espera: Paciente[],
  historico_cada_paciente: any[]
}
```

**O que o agente retorna:**
```typescript
{ paciente_id: number, motivo: string }
// NestJS envia email/WhatsApp apenas para esse paciente
```

---

## FASE 3

### 3.1 Aprendizado de Padrões

**O que faz:** o agente acessa a tabela `ia_memoria` e identifica padrões
que melhoram as sugestões futuras.

**Tabela de memória (MySQL):**
```sql
CREATE TABLE ia_memoria (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  tipo         VARCHAR(50),
  entrada      TEXT,
  saida        TEXT,
  aceito       BOOLEAN,
  paciente_id  INT,
  profissional_id INT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Como o agente usa a memória:**
```typescript
async sugerirComMemoria(pedido: string, pacienteId: string) {
  const memoria = await this.iaMemoriaRepo.find({
    where: { pacienteId, aceito: true, tipo: 'sugestao_horario' },
    take: 10,
    order: { created_at: 'DESC' }
  })
  // passa a memória como contexto adicional ao agente
  // agente aprende que este paciente prefere certas condições
}
```

---

### 3.2 Chat de Triagem Pré-Consulta

**O que faz:** antes da consulta, o paciente conversa com o agente que faz
perguntas de triagem. O profissional recebe um resumo ao iniciar a consulta.

**Endpoint:** `POST /api/ia/triagem` (conversa stateful)

**Estado da conversa salvo no MySQL:**
```typescript
// Cada mensagem é salva
await this.triagemRepo.save({
  agendamentoId,
  role: 'user' | 'assistant',
  content: mensagem,
  created_at: new Date()
})

// O agente recebe o histórico completo a cada mensagem
const historico = await this.triagemRepo.find({ where: { agendamentoId } })
```

**Resumo final para o profissional:**
```typescript
// Gerado quando o profissional abre o prontuário
const resumo = await this.ia.perguntar(
  'Você é um assistente médico. Resuma a triagem de forma concisa para o profissional.',
  `Histórico da triagem: ${JSON.stringify(historico)}`
)
```

---

## Tabelas MySQL necessárias para a IA

```sql
-- Memória de aprendizado
CREATE TABLE ia_memoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  entrada TEXT, saida TEXT,
  aceito BOOLEAN DEFAULT NULL,
  paciente_id INT, profissional_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alertas gerados pelo agente para o painel
CREATE TABLE ia_alertas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profissional_id INT NOT NULL,
  tipo VARCHAR(50),          -- 'paciente_ausente', 'slot_sem_confirmacao', etc
  descricao TEXT,
  paciente_id INT,
  resolvido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Histórico de triagem
CREATE TABLE ia_triagem (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agendamento_id INT NOT NULL,
  role ENUM('user','assistant') NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Prompt do sistema — guia de escrita

Ao escrever prompts para cada funcionalidade, seguir este padrão:
```
"Você é um assistente de [função específica] para [contexto].
[O que você faz].
[Como você responde — formato].
[Restrições importantes]."
```

Exemplo para sugestão de horário:
```
"Você é um assistente de agendamento médico especializado.
Analise a agenda disponível e o histórico do paciente para sugerir o melhor horário.
Responda sempre em JSON com os campos: horario, data, dia_semana, motivo, alternativas.
Priorize horários que o paciente historicamente confirmou e compareceu."
```