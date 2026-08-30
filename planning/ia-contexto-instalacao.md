
# Contexto Técnico — Instalação e Uso do Agente de IA
# Stack: React + NestJS + MySQL + Groq

> Lido por Claude em sessões futuras. Contém o estado técnico da implementação
> do agente de IA no sistema de agendamento para profissionais da saúde.

---

## Stack do sistema

| Camada | Tecnologia | Deploy |
|---|---|---|
| Frontend | React | Vercel |
| Backend/API | NestJS (Node.js) | Railway ou Render |
| Banco de dados | MySQL | PlanetScale ou Railway |
| LLM (cérebro do agente) | Groq API — `llama-3.3-70b-versatile` | Externo |
| Chaves de ambiente | `.env` no NestJS | Variáveis do Railway/Render |

---

## Princípio arquitetural do agente

O agente **não fica no React**. O React só exibe resultados.
O agente vive **dentro do NestJS** como um `IaService` injetável.

```
React → POST /api/ia/[endpoint] → NestJS → IaService → Groq
                                       ↕
                                     MySQL
```

O NestJS busca os dados no MySQL, passa para o agente com contexto,
o agente pensa e retorna — NestJS devolve ao React.

---

## Instalação no NestJS

```bash
npm install groq-sdk
npm install @anthropic-ai/sdk   # alternativa, se preferir Claude
```

```env
# .env do NestJS
GROQ_API_KEY=gsk_...
DATABASE_URL=mysql://user:pass@host:3306/dbname
```

---

## Padrão que funciona — Python ensinado, adaptado para JS

O mesmo padrão validado em Python: **NestJS executa ferramentas, LLM só raciocina**.
Não usar tool_calls do Groq diretamente — instável com modelos menores.

```typescript
// ✅ Padrão correto
const agenda    = await this.agendaRepo.findSlots()   // NestJS busca no MySQL
const historico = await this.pacienteRepo.findById(id) // NestJS busca no MySQL
const sugestao  = await this.groq.chat.completions.create({
  // LLM recebe contexto pronto e só raciocina
  messages: [{ role: 'user', content: `Agenda: ${agenda} | Histórico: ${historico}` }]
})

// ❌ Evitar
// Deixar o LLM chamar ferramentas via tool_calls — gera erros de formato
```

---

## IaService — estrutura base

```typescript
// src/ia/ia.service.ts
import { Injectable } from '@nestjs/common'
import Groq from 'groq-sdk'

@Injectable()
export class IaService {
  private groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  private model = 'llama-3.3-70b-versatile'

  async perguntar(sistema: string, mensagem: string): Promise<string> {
    const r = await this.groq.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: sistema },
        { role: 'user',   content: mensagem }
      ]
    })
    return r.choices[0].message.content
  }

  async perguntarJSON(sistema: string, mensagem: string): Promise<any> {
    const texto = await this.perguntar(sistema, mensagem)
    try {
      // Extrai JSON mesmo se vier com texto ao redor
      const match = texto.match(/\{[\s\S]*\}/)
      return match ? JSON.parse(match[0]) : { resposta: texto }
    } catch {
      return { resposta: texto }
    }
  }
}
```

---

## IaModule — registro no NestJS

```typescript
// src/ia/ia.module.ts
import { Module } from '@nestjs/common'
import { IaService } from './ia.service'
import { IaController } from './ia.controller'

@Module({
  providers: [IaService],
  controllers: [IaController],
  exports: [IaService],   // exporta para outros módulos usarem
})
export class IaModule {}
```

```typescript
// src/app.module.ts — adicionar IaModule
imports: [IaModule, AgendaModule, PacienteModule, ...]
```

---

## IaController — endpoints base

```typescript
// src/ia/ia.controller.ts
import { Controller, Post, Body } from '@nestjs/common'
import { IaService } from './ia.service'

@Controller('ia')
export class IaController {

  constructor(
    private ia: IaService,
    private agendaService: AgendaService,
    private pacienteService: PacienteService,
  ) {}

  @Post('sugerir-horario')
  async sugerirHorario(@Body() body: { pedido: string; pacienteId: string }) {
    const slots    = await this.agendaService.getSlotsDisponiveis()
    const historico = await this.pacienteService.getHistorico(body.pacienteId)

    return this.ia.perguntarJSON(
      'Você é um assistente de agendamento médico. Responda sempre em JSON: { horario, data, motivo }',
      `Pedido do paciente: "${body.pedido}"\nSlots disponíveis: ${JSON.stringify(slots)}\nHistórico: ${JSON.stringify(historico)}`
    )
  }

  @Post('briefing-dia')
  async briefingDia(@Body() body: { profissionalId: string }) {
    const agenda = await this.agendaService.getAgendaDia(body.profissionalId)

    return this.ia.perguntar(
      'Você é um assistente médico. Gere um briefing diário curto e direto para o profissional de saúde.',
      `Agenda de hoje: ${JSON.stringify(agenda)}`
    )
  }
}
```

---

## React — como consumir os endpoints

```typescript
// hooks/useIa.ts
export function useIa() {

  async function sugerirHorario(pedido: string, pacienteId: string) {
    const res = await fetch('/api/ia/sugerir-horario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedido, pacienteId })
    })
    return res.json()
  }

  async function briefingDia(profissionalId: string) {
    const res = await fetch('/api/ia/briefing-dia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profissionalId })
    })
    return res.json()
  }

  return { sugerirHorario, briefingDia }
}
```

```tsx
// Uso no componente React
const { sugerirHorario } = useIa()
const [sugestao, setSugestao] = useState(null)

async function buscar() {
  const resultado = await sugerirHorario(pedido, user.id)
  setSugestao(resultado)
}
```

---

## Memória do agente no MySQL

Para o agente aprender com o tempo, salvar interações em tabela dedicada:

```sql
CREATE TABLE ia_memoria (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tipo        VARCHAR(50),      -- 'sugestao_horario', 'lembrete', etc
  entrada     TEXT,             -- o que foi pedido
  saida       TEXT,             -- o que o agente respondeu
  aceito      BOOLEAN,          -- o usuário aceitou a sugestão?
  paciente_id INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Nas próximas chamadas, incluir histórico de acertos no contexto:
```typescript
const memoria = await this.iaMemoriaRepo.find({ where: { pacienteId, aceito: true } })
// passa para o agente junto com o pedido atual
```

---

## Deploy

- **NestJS**: Railway.app (simples, $5/mês) ou Render.com (free tier)
- **MySQL**: PlanetScale (free tier generoso) ou Railway MySQL
- **Variáveis de ambiente**: configurar no painel do Railway/Render
- **Vercel** (React): só consome a API do NestJS via URL do Railway

---

## Ordem de implementação recomendada

1. Criar `IaModule`, `IaService`, `IaController` no NestJS
2. Implementar `sugerirHorario` — primeiro endpoint
3. Consumir no React com um `fetch` simples
4. Ver funcionando — depois adicionar os demais endpoints
5. Adicionar tabela `ia_memoria` para aprendizado