# Achei no Jardim Botânico — Especificação Completa do Projeto

> Documento mestre de especificação combinando **Lean Inception** (descoberta), **Jobs to Be Done** (análise de demanda), **Spec-Driven Development** (execução com IA) e **arquitetura técnica**. Este é o contrato que vai guiar o desenvolvimento do início ao fim. Os artefatos aqui são vivos — evoluem com o projeto, não são entregáveis de planejamento que ficam esquecidos numa gaveta.

---

## Parte 0 — Como vamos trabalhar (o método)

Antes de qualquer feature, alinhamos sobre o **como**. Este projeto vai combinar três práticas complementares:

### 0.1 Lean Inception (Caroli) — para descoberta

Workshop tradicional de 1 semana que produz uma visão compartilhada do produto antes de qualquer linha de código. Foi criado por Paulo Caroli e é usado por empresas como Thoughtworks, Caelum, Globo. Os artefatos chave que produziremos:

1. **Visão do Produto** (formato Geoffrey Moore)
2. **Produto É / Não É / Faz / Não Faz**
3. **Personas**
4. **Jornadas de Usuário**
5. **Brainstorm de Features** + revisão técnica/UX/negócio
6. **Feature Canvas** (uma por feature crítica)
7. **MVP Canvas**
8. **Sequencer** (sequenciamento de releases)

Diferente do workshop original que demanda múltiplos stakeholders presenciais, vamos rodar uma versão adaptada para projeto solo + IA, onde cada artefato é um documento de spec versionado.

### 0.2 Jobs to Be Done (Christensen / Ulwick) — para entender demanda

Em vez de perguntar "que features o cliente quer?", JTBD pergunta "que progresso o cliente está tentando fazer na vida quando contrata um produto?". A pergunta certa não é *quem é o cliente*, é *qual job ele está tentando completar*. Vamos usar especificamente:

- **Job Statements** no formato canônico: *"Quando [situação], eu quero [motivação], para que [resultado esperado]"*
- **Dimensões do job**: funcional, emocional, social
- **Forces of Progress**: o que puxa o cliente para a solução, o que segura ele na situação atual

### 0.3 Spec-Driven Development (GitHub Spec-Kit) — para execução com Claude Code

O Spec-Kit do GitHub formalizou em set/2025 um workflow de 6 comandos para desenvolvimento com agentes de IA. A filosofia: **a spec é o source of truth, código é output regenerável**. Os comandos:

```
/speckit.constitution  → define princípios invioláveis do projeto
/speckit.specify       → cria a spec da feature (o "o quê")
/speckit.plan          → cria o plano técnico de implementação (o "como")
/speckit.tasks         → quebra o plano em tarefas executáveis
/speckit.taskstoissues → converte em issues do GitHub (opcional)
/speckit.implement     → executa as tarefas
```

Vamos instalar o Spec-Kit no projeto base e usar esse fluxo. Cada feature passa por *constitution → specify → plan → tasks → implement* antes de virar PR.

### 0.4 Como os três se conectam neste projeto

```
LEAN INCEPTION (descoberta)
        ↓
  Personas + Jornadas + Features brainstorm
        ↓
JTBD (validação de demanda)
        ↓
  Job Statements + Forces of Progress
        ↓
MVP Canvas + Sequencer (priorização)
        ↓
SPEC-DRIVEN DEV (execução com Claude Code)
        ↓
  /constitution → /specify → /plan → /tasks → /implement
        ↓
       Código
```

A Lean Inception responde *o que vamos construir e por quê*. JTBD afirma *para qual progresso real isso serve*. Spec-Driven Dev é *como construir cada peça com a IA sem cair em vibe-coding*.

---

## Parte 1 — Lean Inception

### 1.1 Visão do Produto (Geoffrey Moore Template)

> **PARA** moradores e visitantes do Jardim Botânico (DF) e bairros adjacentes
> **QUE** precisam encontrar negócios, serviços e estabelecimentos próximos com informações confiáveis e atualizadas,
> **O Achei no Jardim Botânico** é um **guia comercial digital hiperlocal**
> **QUE** centraliza os negócios da região com fotos, horários, contato direto via WhatsApp e avaliações reais,
> **DIFERENTE DE** Google Maps (genérico, sem curadoria local), Instagram (precisa saber o nome do negócio antes), grupos de WhatsApp (informação solta e perdida),
> **NOSSO PRODUTO** entrega curadoria local profissional, fotografia própria dos estabelecimentos parceiros e um painel onde o dono do negócio gerencia sua presença digital sem precisar contratar agência.

### 1.2 Produto É / Não É / Faz / Não Faz

| **É** | **NÃO É** |
|---|---|
| Um guia comercial digital hiperlocal | Um marketplace de produtos (não vendemos transação) |
| Um catálogo curado de negócios da região | Um portal de notícias |
| Uma plataforma de presença digital paga | Um serviço de delivery |
| Uma ponte entre comerciante e cliente local | Uma rede social |
| Um espaço de credibilidade (avaliações, fotos profissionais) | Um classificado de usados (tipo OLX) |

| **FAZ** | **NÃO FAZ** |
|---|---|
| Lista negócios por categoria e proximidade | Processa pagamentos entre cliente e estabelecimento |
| Importa dados iniciais via Google Places API | Faz reservas/agendamentos (v1) |
| Permite ao dono reivindicar e gerenciar perfil | Modera reviews (v1 — usa só as do Google) |
| Cobra mensalidade do anunciante por destaque | Vende anúncios via leilão tipo Google Ads |
| Tira fotos profissionais para planos pagos | Cria conteúdo editorial diário |

### 1.3 Personas

#### Persona 1 — Marina, 34, moradora do Jardim Botânico

**Demografia:** Casada, 2 filhos pequenos, trabalha em órgão público, renda familiar R$15-25k/mês, mora há 4 anos no JBT.

**Comportamento:** Usa muito Google Maps para encontrar lugares, mas se frustra com resultados desatualizados ou genéricos vindos de Brasília inteira. Faz parte de grupos de WhatsApp do condomínio onde pede indicação de "pediatra bom", "marido pra consertar torneira", "padaria com pão de queijo decente". Compra online o que pode, mas valoriza ir a lugares físicos perto de casa.

**Dores:**
- Não conhece a maioria dos comércios novos que abriram nos últimos 2 anos
- Não tem tempo de procurar — quer resposta rápida no celular
- Não confia em avaliação genérica do Google (acha que tem muito review falso)

**Ganhos buscados:**
- Encontrar opções perto de casa em menos de 1 minuto
- Saber se o lugar está aberto AGORA antes de sair
- Ter prova social de outros moradores da própria região

**Como ela chega ao produto:** Indicação no grupo de WhatsApp do condomínio, busca no Google por "[serviço] jardim botânico df", ou tropeça no Instagram da nossa marca.

#### Persona 2 — Roberto, 47, dono de pet shop no JK

**Demografia:** Pet shop pequeno (3 funcionários), abriu há 5 anos, faturamento R$30-50k/mês, não tem formação em marketing, posta esporadicamente no Instagram da loja (consegue 200-400 seguidores locais).

**Comportamento:** Trabalha de balcão e gestão. Não tem tempo nem dinheiro para agência. Já contratou "menino que faz site" 2 vezes e nunca ficou pronto. Usa muito WhatsApp para receber pedidos. Acredita que a maior parte dos clientes vem por indicação ou por passar em frente.

**Dores:**
- Sente que está "invisível" no digital comparado a redes maiores
- Não sabe medir o que funciona
- Já gastou dinheiro em "tráfego pago" que não trouxe cliente
- Não tem certeza se vale a pena ter site, perfil no Google Meu Negócio bem feito, etc.

**Ganhos buscados:**
- Aparecer quando o vizinho buscar "pet shop perto de mim"
- Pagar pouco e ter resultado mensurável (visitas, contatos via WhatsApp)
- Não ter que mexer em tecnologia complicada
- Ter alguém local para conversar quando der problema

**Como ele chega ao produto:** Você bate na porta dele com um tablet mostrando o perfil dele já pronto no Achei (importado via Places API), e oferece reivindicar e fazer upgrade.

#### Persona 3 — Beatriz, 28, estudante e moradora recém-chegada

**Demografia:** Solteira, mora em apartamento alugado, estudante de pós-graduação UnB, mudou-se para o JBT há 3 meses, renda própria R$4k/mês.

**Comportamento:** Está descobrindo o bairro. Usa muito TikTok e Instagram para descobrir lugares. Não tem rede de contatos locais ainda. Mais nativa digital — espera UI moderna, foto bem feita, informação clara.

**Dores:**
- Não conhece ninguém ainda no bairro para pedir indicação
- Quer descobrir cafeterias, restaurantes, lugares para trabalhar com notebook
- Não confia em estabelecimento que não tem presença digital decente

**Ganhos buscados:**
- Sentir-se "em casa" descobrindo o bairro
- Encontrar lugares que combinam com seu estilo (vegano, café especial, ambiente de trabalho)
- Compartilhar achados nas redes (potencial criadora de UGC)

**Como ela chega ao produto:** SEO orgânico — "melhores cafés jardim botânico brasília", Instagram da marca, indicação de outro recém-chegado.

#### Persona 4 — Você (Álvaro), admin/curador

> Persona crítica e geralmente esquecida em produtos solo: o operador.

**Necessidades como operador:**
- Painel administrativo para aprovar reivindicações
- Importação em massa via Places API com 1 clique
- Visão financeira (assinaturas ativas, MRR, churn)
- Capacidade de criar/editar negócios manualmente quando a API falha
- Logs de auditoria (quem mexeu em quê)

### 1.4 Jornadas de Usuário

#### Jornada Marina (descoberta espontânea)

```
1. Precisa de cabeleireiro infantil para filho
2. Pesquisa no Google "cabeleireiro infantil jardim botanico df"
3. Encontra link do Achei no top 3 (SEO local otimizado)
4. Acessa página da categoria "Salão / Cabeleireiro"
5. Filtra por "atende crianças" + ordena por distância
6. Vê 3 opções com foto, avaliação, horário de hoje, link WhatsApp
7. Clica em "Abrir WhatsApp" → conversa com o salão
8. Agenda
9. Eventualmente avalia/recomenda dentro do Achei
```

#### Jornada Roberto (de descoberto a anunciante)

```
1. Você bate na porta do pet shop com o tablet
2. Mostra: "Olha, seu pet shop já tá listado aqui no Achei do Jardim Botânico"
3. Roberto vê o perfil dele (importado via Places API: nome, endereço, foto antiga do Google)
4. Você: "Sem custo nenhum hoje. Quer reivindicar para personalizar?"
5. Roberto reivindica (cria conta com email + CNPJ + telefone)
6. Você ajuda ele a colocar uma foto melhor, descrição, WhatsApp direto
7. 2 semanas depois você volta: "Olha o relatório de visualizações do seu perfil"
8. Mostra que ele teve 47 visualizações, 8 cliques no WhatsApp
9. Oferta: "Por R$79/mês, você fica em destaque na categoria, aparece primeiro, e eu tiro foto profissional do seu pet shop"
10. Roberto fecha
11. Cliente pago e ativo
```

#### Jornada Beatriz (descoberta de lifestyle)

```
1. Acabou de se mudar, quer descobrir cafeterias
2. Vê post no Instagram do @acheinojardimbotanico ("Top 5 cafés do bairro")
3. Clica no link da bio → página de cafeterias do Achei
4. Lê descrição editorial curta de cada uma
5. Salva 3 que parecem interessantes
6. Vai conhecer
7. Volta no app e curte / avalia
8. Compartilha o achado no story dela
9. Vira eventual evangelista
```

---

## Parte 2 — Jobs to Be Done

### 2.1 Job Statements

#### Para Marina (consumidor estabelecido)
> **Quando** preciso de um produto ou serviço próximo de casa, **eu quero** encontrar opções confiáveis em menos de 1 minuto sem peneirar resultados genéricos, **para que** eu economize tempo, não erre a escolha e me sinta segura comprando local.

#### Para Roberto (comerciante local)
> **Quando** percebo que estou ficando invisível no digital enquanto os concorrentes maiores aparecem, **eu quero** ter presença online profissional sem ter que aprender marketing nem contratar agência cara, **para que** novos moradores do bairro me encontrem e eu aumente meu faturamento sem mudar o que sei fazer.

#### Para Beatriz (consumidor recém-chegado)
> **Quando** estou em um bairro novo sem rede de contatos, **eu quero** descobrir lugares que combinam com meu estilo de vida, **para que** eu me sinta pertencente à região e construa minha rotina sem depender de tentativa e erro.

### 2.2 Dimensões do Job (Marina como exemplo aprofundado)

**Job Funcional:** Encontrar negócio adequado próximo, rapidamente.

**Job Emocional:** Sentir-se *no controle* (não desperdiçando tempo nem dinheiro), sentir-se *parte da comunidade* (apoiando comércio local), sentir-se *competente* (sabendo onde ir).

**Job Social:** Ser percebida pela rede dela como alguém que "conhece o bairro", que "sabe dos lugares bons", e poder indicar para vizinhos com confiança.

> Observação crítica: marketing comum só fala do funcional. O diferencial real do Achei é tocar nos jobs emocional e social — por isso curadoria humana e identidade visual hiperlocal são features estratégicas, não estéticas.

### 2.3 Forces of Progress (modelo Bob Moesta)

Quatro forças decidem se Marina contrata ou rejeita o produto:

| Força | Direção | Como aparece |
|---|---|---|
| **Push** (do problema) | A favor | Frustração com Google Maps mostrar negócios fechados / longe / sem foto |
| **Pull** (da solução) | A favor | Achei tem foto bonita, info atual, WhatsApp direto |
| **Anxiety** (medo da nova solução) | Contra | "Será que essas avaliações são reais?" "Vou ter que criar mais uma conta?" |
| **Habit** (apego ao antigo) | Contra | Já é viciada em digitar no Google Maps |

**Implicação para o produto:**
- **Reforçar push:** Não tentamos competir com Google Maps em volume. Mostramos onde ele falha (info desatualizada, sem filtro local).
- **Reforçar pull:** Investir em foto e curadoria visível desde a primeira tela.
- **Reduzir anxiety:** Usar reviews do Google integrados (familiares) + selo de "verificado pessoalmente pela equipe".
- **Quebrar habit:** SEO forte para que a busca natural dela ("cafeteria jardim botânico") já caia no Achei, não exija mudar comportamento.

### 2.4 Job statement para o produto (orientador maior)

> Para o **morador** do Jardim Botânico, quando ele precisa **resolver uma necessidade local**, o Achei é a primeira parada porque **economiza tempo, fortalece a comunidade e dá segurança na escolha**.
>
> Para o **comerciante** do Jardim Botânico, quando ele quer **crescer sem aprender marketing**, o Achei é a opção mais simples porque **ele só paga, a gente entrega presença digital com foto, descrição e visibilidade real para vizinhos**.

---

## Parte 3 — Análise estratégica

### 3.1 Lean Canvas

| Bloco | Conteúdo |
|---|---|
| **Problema** | (1) Moradores não encontram negócios locais com info confiável. (2) Comerciantes não têm presença digital boa nem dinheiro/tempo para agência. (3) Indicações ficam perdidas em grupos de WhatsApp. |
| **Segmentos** | Primário: moradores Jardim Botânico/Lago Sul/São Sebastião. Secundário: comerciantes locais com 1-10 funcionários. |
| **Proposta Única** | Guia comercial hiperlocal curado, com foto profissional e contato direto. |
| **Solução** | Plataforma web mobile-first com listagem por categoria/distância, perfil rico, integração WhatsApp, painel do anunciante. |
| **Canais** | SEO local, Instagram (@acheinojardimbotanico), QR code físico em estabelecimentos parceiros, boca a boca de moradores. |
| **Receita** | Assinatura de anunciantes em 3 planos (Free / Visibilidade R$79 / Premium R$197). Sem comissão por transação. |
| **Custos** | Domínio + hospedagem Vercel (~R$50/mês), Google Places API (~R$0 dentro do free tier), MySQL (~R$30/mês), tempo do operador. |
| **Métricas-Chave** | (1) Negócios listados, (2) Negócios reivindicados, (3) Anunciantes pagos, (4) MRR, (5) Sessões orgânicas/mês, (6) Cliques no WhatsApp. |
| **Vantagem injusta** | Curadoria local manual + foto profissional + você é morador (e dev) — combinação rara. |

### 3.2 Análise competitiva

| Concorrente | Força | Fraqueza | Como nos diferenciamos |
|---|---|---|---|
| **Google Maps** | Onipresente, gratuito, confiável | Genérico (todo Brasil), sem curadoria, sem identidade de bairro | Hiperlocal, identidade visual de bairro, curadoria editorial |
| **Instagram dos comércios** | Visual, social | Cliente precisa saber o nome antes | Descoberta por categoria + proximidade |
| **Grupos de WhatsApp** | Confiança alta (indicação de vizinho) | Informação perdida, não pesquisável | Persistência + busca + organização |
| **acheisantamaria.com.br** | Modelo provado | UX dos anos 2010, sem foto profissional, plano único | UI moderna, plano premium com foto, painel do anunciante decente |
| **Sympla / Eventbrite** | Eventos | Não cobre comércio | Sem competição direta |
| **iFood / Rappi** | Delivery de comida | Cobra comissão alta, só restaurantes | Não cobramos comissão, cobre todas categorias |

### 3.3 Modelo de monetização

**Plano Free** (gratuito)
- Listagem básica importada via Places API
- Aparece nas buscas, mas ordenado após pagos
- Sem foto profissional, sem destaque visual

**Plano Visibilidade — R$79/mês**
- Destaque na categoria (aparece antes dos free)
- Descrição personalizada
- Link direto para WhatsApp
- Galeria com até 6 fotos
- Relatório mensal de visualizações

**Plano Premium — R$197/mês**
- Tudo do Visibilidade
- **Foto profissional** tirada pelo operador (você tem câmera)
- Banner rotativo na home da região
- Aparece em destaque na categoria com selo "Premium"
- Galeria com até 20 fotos
- Posto no Instagram mensal feito por você

**Projeção realista de 12 meses:**

```
Mês 1-2:  0 anunciantes pagos (importação + reivindicações grátis)
Mês 3:    3 anunciantes pagos (~R$237 MRR)
Mês 6:    10 anunciantes pagos (~R$790 MRR)
Mês 12:   25 anunciantes pagos (~R$2.500 MRR)
Mês 18:   50 anunciantes pagos (~R$5.000 MRR)
```

Esse é o teto realista para uma região. Para escalar além, replicar o modelo em outras regiões (Lago Sul, Sudoeste, Águas Claras) — cada uma é um vertical próprio.

---

## Parte 4 — Feature Canvas + MVP

### 4.1 Brainstorm de features (sem filtro)

```
[ Descoberta pública ]
- Listagem por categoria
- Listagem por proximidade (geolocalização)
- Busca textual
- Filtros (aberto agora, aceita pet, tem estacionamento, etc)
- Mapa interativo
- Página de detalhe do negócio
- Galeria de fotos
- Botão WhatsApp direto
- Botão ligar
- Botão "como chegar"
- Avaliações do Google integradas
- Avaliações próprias do Achei
- Posts de destaque editorial
- Página de "novidades do bairro"

[ Painel do anunciante ]
- Cadastro / Login
- Reivindicação de perfil existente
- Edição de descrição
- Upload de fotos
- Configuração de horário
- Configuração de WhatsApp
- Relatório de métricas
- Página de plano e pagamento
- Histórico de cobranças

[ Importação e admin ]
- Importação via Google Places API
- Sincronização periódica
- Painel administrativo
- Aprovação de reivindicações
- Moderação de avaliações
- Criação manual de negócio
- Logs de auditoria

[ Marketing e SEO ]
- Páginas otimizadas para SEO local
- Schema.org markup
- Sitemap
- Compartilhamento social com Open Graph
- Newsletter mensal

[ Pagamento ]
- Checkout assinatura
- Integração Stripe ou Asaas (Brasil)
- Faturas
- Cancelamento

[ Comunidade ]
- Sistema de avaliações próprio
- Comentários
- Salvos / favoritos
- Compartilhar lista personalizada
- Sugerir novo negócio
```

### 4.2 Revisão Técnica × UX × Negócio (cada feature)

> Cada feature recebe três notas (1-5): viabilidade técnica, valor para usuário, valor para negócio. Features com nota < 3 em qualquer dimensão saem do MVP.

| Feature | Téc | UX | Neg | No MVP? |
|---|---|---|---|---|
| Listagem por categoria | 5 | 5 | 5 | ✅ |
| Listagem por proximidade | 4 | 5 | 4 | ✅ |
| Busca textual | 4 | 4 | 4 | ✅ |
| Filtros básicos (aberto agora) | 4 | 4 | 3 | ✅ |
| Mapa interativo | 3 | 4 | 3 | ⚠️ v2 |
| Página de detalhe | 5 | 5 | 5 | ✅ |
| Galeria de fotos | 5 | 5 | 4 | ✅ |
| Botão WhatsApp direto | 5 | 5 | 5 | ✅ |
| Avaliações Google integradas | 4 | 5 | 4 | ✅ |
| Avaliações próprias | 3 | 3 | 3 | ❌ v2 |
| Reivindicação de perfil | 4 | 5 | 5 | ✅ |
| Painel anunciante (CRUD) | 4 | 4 | 5 | ✅ |
| Importação Places API | 5 | - | 5 | ✅ |
| Painel admin | 4 | 3 | 5 | ✅ |
| Checkout assinatura | 3 | 4 | 5 | ✅ |
| Métricas para anunciante | 3 | 4 | 4 | ✅ |
| Posts editoriais | 3 | 3 | 3 | ❌ v2 |
| Newsletter | 4 | 3 | 3 | ❌ v2 |
| Sistema próprio de avaliações | 3 | 3 | 2 | ❌ v3 |
| Comentários | 3 | 2 | 2 | ❌ v3 |
| Favoritos | 4 | 3 | 2 | ❌ v2 |

### 4.3 MVP Canvas

**Nome do MVP:** Achei Botânico — Release 1.0

**Objetivo do MVP:** Validar se moradores usam o guia para descoberta local **E** se comerciantes pagam por destaque. Métrica de sucesso em 90 dias: 5 anunciantes pagos OU 1.000 sessões orgânicas/mês.

**Segmento de cliente:** Inicial — moradores Jardim Botânico (Marina + Beatriz). Comerciantes locais (Roberto).

**Jornada principal a validar:** Marina pesquisa no Google → encontra Achei → clica em WhatsApp do estabelecimento → estabelecimento reconhece o lead.

**Features do MVP** (saída do filtro acima):
1. Listagem por categoria
2. Listagem por proximidade (geolocalização opcional)
3. Busca textual
4. Filtro "aberto agora"
5. Página de detalhe com galeria + WhatsApp
6. Importação via Places API (1ª carga)
7. Cadastro/login
8. Reivindicação de perfil
9. Painel do anunciante básico (editar descrição, foto, WhatsApp)
10. Painel admin (aprovar, importar, criar manual)
11. Checkout assinatura (1 plano só no MVP — Visibilidade R$79)
12. Métricas básicas para anunciante

**Resultado esperado:** Conseguir vender 5 assinaturas em 90 dias com tráfego inicial de boca a boca + SEO inicial.

**Custo estimado de construção:** 8-12 semanas no ritmo de 1h/dia + sábados.

### 4.4 Sequencer (sequenciamento em releases)

**Release 0 — Project Base (semana 0-1)**
Limpeza do Courtesyfy + setup Spec-Kit + auth básico + estrutura genérica.

**Release 1 — Public Read-only (semana 2-3)**
Importação Places API + listagem pública + página de detalhe + WhatsApp.
*Saída: site público funcional com 200+ negócios listados, mesmo sem nenhum anunciante.*

**Release 2 — Claim & Manage (semana 4-5)**
Cadastro/login + reivindicação + painel do anunciante (free) + painel admin.
*Saída: comerciante pode reivindicar e editar perfil free.*

**Release 3 — Monetize (semana 6-8)**
Checkout assinatura + plano Visibilidade + métricas.
*Saída: aceita pagamento de R$79/mês.*

**Release 4 — Polish & Scale (semana 9-12)**
SEO técnico avançado + Open Graph + sitemap + filtros adicionais + Premium tier.
*Saída: 1.000+ sessões/mês orgânicas.*

**Pós-MVP (v2):** Mapa interativo, avaliações próprias, posts editoriais, favoritos, newsletter, Instagram automation.

---

## Parte 5 — Spec-Driven Development setup

### 5.1 Estrutura de pastas (no repositório)

```
/
├── .specify/                           # config do Spec-Kit
│   └── memory/
│       └── constitution.md             # princípios invioláveis
├── specs/                              # specs ativas
│   ├── 000-project-base/
│   │   ├── spec.md                     # /speckit.specify output
│   │   ├── plan.md                     # /speckit.plan output
│   │   └── tasks.md                    # /speckit.tasks output
│   ├── 001-places-import/
│   ├── 002-public-listing/
│   ├── 003-business-detail/
│   ├── 004-auth/
│   ├── 005-claim-business/
│   ├── 006-advertiser-panel/
│   ├── 007-admin-panel/
│   └── 008-checkout-visibility/
├── docs/
│   ├── adr/                            # Architecture Decision Records
│   │   ├── 0001-stack-choice.md
│   │   ├── 0002-database-choice.md
│   │   ├── 0003-auth-strategy.md
│   │   └── 0004-places-api-vs-scraping.md
│   ├── discovery/
│   │   ├── lean-inception.md           # este documento
│   │   ├── personas.md
│   │   └── jobs-to-be-done.md
│   └── runbooks/                       # operação
│       └── places-api-import.md
├── src/                                # código (Next.js)
├── prisma/                             # schema
└── README.md
```

### 5.2 Template de spec (vamos usar em cada feature)

```markdown
# Spec NNN — [Nome da Feature]

## Contexto
Por que essa feature existe? Qual job ela atende? Qual persona se beneficia?

## Critérios de aceite
- [ ] Lista funcional clara, testável, sem ambiguidade
- [ ] Cada item deve ser verdadeiro ou falso, não "mais ou menos"

## Não-objetivos
O que essa feature EXPLICITAMENTE não faz, para evitar scope creep.

## Fluxos
### Fluxo principal (happy path)
Passo a passo, do clique inicial ao estado final.

### Fluxos de exceção
O que acontece se a API falhar? Se o usuário desistir no meio?

## Modelo de dados afetado
Tabelas criadas, alteradas, relações.

## Contratos de API
Endpoints, payloads, status codes.

## Dependências
Outras specs, serviços externos, libs.

## Métricas de sucesso
Como saber que a feature está cumprindo seu papel?

## Riscos
O que pode dar errado tecnicamente ou de produto.
```

### 5.3 Workflow no Claude Code

A cada feature nova, no Claude Code:

```bash
# 1. Constitution (1x no início do projeto)
/speckit.constitution

# 2. Para cada feature
/speckit.specify "Importar negócios do Google Places API para o banco
                  na região do Jardim Botânico"
# → gera specs/001-places-import/spec.md

/speckit.plan
# → gera specs/001-places-import/plan.md com decisões técnicas

/speckit.tasks
# → gera specs/001-places-import/tasks.md com tarefas atômicas

/speckit.implement
# → executa as tarefas, abrindo PRs
```

A spec é commitada *antes* do código. Se a implementação divergir, atualiza-se a spec.

### 5.4 ADRs — Architecture Decision Records

Cada decisão arquitetural importante vira um arquivo curto em `docs/adr/`. Template:

```markdown
# ADR-NNNN: [Decisão]

## Status
Proposto | Aceito | Substituído por ADR-XXXX

## Contexto
Por que essa decisão precisa ser tomada?

## Decisão
O que foi decidido?

## Consequências
Trade-offs: o que ganhamos e o que perdemos com essa escolha?

## Alternativas consideradas
Quais opções foram avaliadas e por que foram descartadas?
```

ADRs iniciais que vamos escrever no Release 0:

- ADR-0001: Stack escolhido (Next.js + TypeScript + Prisma + MySQL)
- ADR-0002: Banco MySQL vs PostgreSQL
- ADR-0003: Estratégia de autenticação (NextAuth + email/senha + Google)
- ADR-0004: Places API vs Web Scraping
- ADR-0005: Estratégia de cache (ISR + DB cache)
- ADR-0006: Provedor de pagamento (Asaas vs Stripe vs MercadoPago)
- ADR-0007: Hospedagem de imagens (Vercel Blob vs S3 vs Cloudinary)
- ADR-0008: Estrutura multi-tenant (single-tenant por região)

---

## Parte 6 — Arquitetura técnica

### 6.1 Stack

```
Frontend:     Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
Backend:      Next.js API Routes (route handlers) + tRPC opcional
ORM:          Prisma
Database:     MySQL (compatível com PlanetScale ou MySQL gerenciado)
Auth:         NextAuth.js v5 (email/senha + Google OAuth)
Pagamento:    Asaas (PIX, cartão, boleto — focado no Brasil)
Imagens:      Vercel Blob (simples, baixo custo até escala)
Email:        Resend
Observabilidade: Vercel Analytics + Sentry
Hospedagem:   Vercel
```

**Justificativa essencial:**
- **Next.js**: você já domina + bom SEO via SSR/ISR
- **MySQL** sobre Postgres: você já usa, ecossistema maduro, sem motivo para mudar
- **NextAuth v5**: padrão para Next.js, suporta os provedores que precisamos
- **Asaas** sobre Stripe: melhor preço no Brasil, PIX nativo, boleto, sem complicação de câmbio
- **Vercel Blob** sobre Cloudinary: simples, integrado, suficiente para volume inicial

### 6.2 Modelo de dados (Prisma schema)

```prisma
// schema.prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "mysql"; url = env("DATABASE_URL") }

// ===================================================
// AUTH (NextAuth tables)
// ===================================================
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  emailVerified DateTime?
  name          String?
  passwordHash  String?
  role          UserRole @default(VISITOR)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  ownedBusinesses Business[]
  accounts        Account[]
  sessions        Session[]
  claimRequests   ClaimRequest[]
}

enum UserRole {
  VISITOR
  ADVERTISER
  ADMIN
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ===================================================
// BUSINESS
// ===================================================
model Business {
  id              String    @id @default(cuid())
  placeId         String?   @unique          // ID Google Places
  slug            String    @unique          // SEO friendly
  name            String
  category        Category  @relation(fields: [categoryId], references: [id])
  categoryId      String
  description     String?   @db.Text         // editorial / personalizada
  address         String
  neighborhood    String                     // ex: "Jardim Botânico"
  city            String    @default("Brasília")
  state           String    @default("DF")
  latitude        Float
  longitude       Float
  phone           String?
  whatsapp        String?                    // formato E.164
  website         String?
  instagram       String?
  googleRating    Float?
  googleRatingCount Int?
  openingHours    Json?                      // estrutura do Google
  status          BusinessStatus @default(IMPORTED)
  plan            Plan      @default(FREE)
  planExpiresAt   DateTime?

  owner           User?     @relation(fields: [ownerId], references: [id])
  ownerId         String?

  photos          Photo[]
  views           BusinessView[]
  whatsappClicks  WhatsappClick[]
  claimRequests   ClaimRequest[]

  importedAt      DateTime  @default(now())
  lastSyncedAt    DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([categoryId])
  @@index([neighborhood])
  @@index([plan])
  @@index([status])
}

enum BusinessStatus {
  IMPORTED       // importado mas não reivindicado
  CLAIMED        // reivindicado e ativo
  PENDING_REVIEW // reivindicação em análise
  SUSPENDED      // suspenso por moderação
}

enum Plan {
  FREE
  VISIBILITY      // R$79
  PREMIUM         // R$197
}

model Category {
  id          String     @id @default(cuid())
  slug        String     @unique
  name        String
  iconName    String?
  description String?
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  parentId    String?
  children    Category[] @relation("CategoryHierarchy")
  businesses  Business[]
  order       Int        @default(0)
}

model Photo {
  id          String   @id @default(cuid())
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  businessId  String
  url         String
  width       Int?
  height      Int?
  source      PhotoSource
  order       Int      @default(0)
  createdAt   DateTime @default(now())

  @@index([businessId])
}

enum PhotoSource {
  GOOGLE_PLACES
  OWNER_UPLOAD
  OPERATOR_UPLOAD
}

// ===================================================
// CLAIMS
// ===================================================
model ClaimRequest {
  id          String   @id @default(cuid())
  business    Business @relation(fields: [businessId], references: [id])
  businessId  String
  user        User     @relation(fields: [userId], references: [id])
  userId      String
  status      ClaimStatus @default(PENDING)
  message     String?  @db.Text
  documentUrl String?
  createdAt   DateTime @default(now())
  reviewedAt  DateTime?
  reviewerId  String?

  @@index([status])
}

enum ClaimStatus {
  PENDING
  APPROVED
  REJECTED
}

// ===================================================
// METRICS
// ===================================================
model BusinessView {
  id          String   @id @default(cuid())
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  businessId  String
  date        DateTime @default(now()) @db.Date
  count       Int      @default(1)

  @@unique([businessId, date])
  @@index([date])
}

model WhatsappClick {
  id          String   @id @default(cuid())
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  businessId  String
  date        DateTime @default(now()) @db.Date
  count       Int      @default(1)

  @@unique([businessId, date])
}

// ===================================================
// BILLING
// ===================================================
model Subscription {
  id              String   @id @default(cuid())
  businessId      String   @unique
  plan            Plan
  status          SubStatus
  asaasCustomerId String
  asaasSubId      String?
  startedAt       DateTime @default(now())
  expiresAt       DateTime?
  canceledAt      DateTime?
}

enum SubStatus {
  ACTIVE
  PAST_DUE
  CANCELED
}

// ===================================================
// AUDIT LOG
// ===================================================
model AuditLog {
  id        String   @id @default(cuid())
  actorId   String?
  action    String   // "business.created", "claim.approved", etc
  entity    String   // "Business", "ClaimRequest"
  entityId  String
  metadata  Json?
  createdAt DateTime @default(now())

  @@index([entity, entityId])
  @@index([createdAt])
}
```

### 6.3 Google Places API — spec de integração

**Endpoints usados:**

1. **Nearby Search (New)** — `POST /v1/places:searchNearby`
   - Quando: importação inicial + sincronização periódica
   - Frequência: 1x na importação, depois mensal por categoria
   - Field mask mínimo: `places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.regularOpeningHours,places.websiteUri,places.primaryType,places.rating,places.userRatingCount`

2. **Place Details (New)** — `GET /v1/places/{placeId}`
   - Quando: na primeira importação de cada negócio + sincronização periódica
   - Field mask adicional: `photos,editorialSummary,internationalPhoneNumber`

3. **Place Photo (New)** — `GET /v1/{photo}/media`
   - Quando: ao exibir foto do negócio (com cache local)
   - Estratégia: baixar uma vez para Vercel Blob, não chamar Google a cada view

**Tabela de tipos importantes para o JBT (categorias):**

```typescript
const PLACE_TYPES_TO_IMPORT = [
  // Comida e bebida
  'restaurant', 'cafe', 'bakery', 'bar', 'meal_takeaway', 'meal_delivery',
  'ice_cream_shop', 'pizza_restaurant', 'sushi_restaurant',

  // Saúde e beleza
  'beauty_salon', 'hair_care', 'barber_shop', 'nail_salon', 'spa',
  'gym', 'pharmacy', 'dentist', 'doctor', 'physiotherapist',

  // Compras
  'supermarket', 'convenience_store', 'pet_store', 'clothing_store',
  'shoe_store', 'book_store', 'florist', 'jewelry_store',

  // Serviços
  'car_repair', 'car_wash', 'laundry', 'locksmith', 'electrician', 'plumber',

  // Educação
  'school', 'university', 'library', 'training_center',
] as const
```

**Cuidados:**
- Field mask é obrigatório (sem ele a API retorna erro)
- Place IDs podem mudar — armazenar mas não confiar como chave eterna
- Fotos não podem ser reservidas indefinidamente sem permissão; baixar para Blob é prática comum
- Atribuição obrigatória: exibir "Powered by Google" e link de origem quando usar dados deles

### 6.4 Segurança e LGPD

**Princípios:**

1. **Dados pessoais mínimos**: coletamos só email + nome do anunciante. Não pedimos CPF (uso CNPJ no checkout via Asaas).
2. **Consentimento explícito**: ao reivindicar negócio, checkbox para Termos + Política de Privacidade.
3. **Direito ao esquecimento**: rota `/api/lgpd/delete-my-data` para usuário solicitar exclusão.
4. **Logs de auditoria**: toda ação administrativa logada (quem aprovou, quem editou).
5. **Senha**: bcrypt com cost 12 mínimo. Nunca log de senha.
6. **Rate limiting**: nas rotas de busca e de login (proteção contra abuso).
7. **CSP headers**: configurar via `next.config.js`.
8. **Secrets**: nunca no código, sempre `.env`, nunca commitar.

**Negócios importados sem reivindicação:** são *dados públicos* do Google Places (não dados pessoais), portanto fora do escopo LGPD para titular. Mas se o dono pedir exclusão, atendemos.

### 6.5 Performance e cache

- **ISR (Incremental Static Regeneration)** para páginas públicas — revalidar a cada 1h.
- **Cache de Places API** no banco — não consultar Google a cada page view.
- **Imagens otimizadas** via `next/image` + Vercel Blob.
- **Lazy loading** de listas longas com `Intersection Observer`.
- **Edge caching** Vercel para assets estáticos.

### 6.6 Observabilidade

- **Sentry** para erros runtime
- **Vercel Analytics** para métricas de página
- **Custom events** para cliques no WhatsApp (incrementar contador no DB)
- **Painel admin** com dashboard de métricas-chave: MRR, anunciantes ativos, importações pendentes, claims pendentes

---

## Parte 7 — Projeto Base (limpeza do Courtesyfy)

### 7.1 O que mantém

- Estrutura `src/app/` com App Router
- Configuração Tailwind + shadcn/ui
- NextAuth setup (apenas providers, sem lógica de negócio do Courtesyfy)
- Prisma config (resetar schema)
- Padrão de rotas API
- Middleware de autenticação
- Componentes UI genéricos (Button, Input, Card, Dialog, Form)
- Layout root + tema (adaptar paleta)
- Configuração de variáveis ambiente (`.env.example`)
- Setup de Sentry, se houver
- CI/CD do GitHub Actions, se houver

### 7.2 O que remove

- Toda lógica de cortesias, cupons, fidelidade, QR code do Courtesyfy
- Tabelas Prisma específicas do Courtesyfy
- Páginas específicas do Courtesyfy
- Seeds antigos
- Variáveis de ambiente específicas

### 7.3 Estrutura final do projeto base genérico

```
projeto-base/
├── .specify/                    # Spec-Kit instalado
├── .github/workflows/
│   └── ci.yml
├── .env.example
├── prisma/
│   └── schema.prisma            # vazio, só com User/Account/Session/AuditLog
├── public/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   └── layout.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── health/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── ui/                  # shadcn primitives
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   ├── utils.ts
│   │   └── env.ts               # validação tipada de env vars
│   └── middleware.ts
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
├── package.json
└── README.md
```

### 7.4 Setup checklist (Release 0)

```
[ ] Clonar Courtesyfy em pasta nova: projeto-base
[ ] Remover todo código específico do Courtesyfy
[ ] Resetar schema Prisma para o mínimo (User + auth)
[ ] Adaptar paleta visual (remover cor específica do Courtesyfy)
[ ] Atualizar README com setup genérico
[ ] Commitar como template
[ ] Criar repo separado "achei-jardim-botanico" a partir do template
[ ] Instalar Spec-Kit: `uv tool install specify-cli` e `specify init . --integration claude --integration-options="--skills"`
[ ] Rodar /speckit.constitution com os princípios deste documento
[ ] Adicionar schema completo do Achei
[ ] Criar primeiro ADR (stack choice)
[ ] Criar Specs 001 a 008 (vazios, só com título e contexto)
[ ] Configurar .env.local com chaves Google Places + Asaas (test)
[ ] Configurar deploy Vercel com domínio acheinojardimbotanico.com.br
[ ] Configurar GA4 + Vercel Analytics
[ ] Smoke test: deploy de "Hello, Jardim Botânico"
```

---

## Parte 8 — Specs iniciais (esqueleto)

### Spec 001 — Importação via Google Places API

**Contexto:** Para o produto ter valor de descoberta desde o primeiro dia, precisa estar populado. Importação automatizada via Places API resolve o cold start, evita cadastro manual e cria a base para o pitch "seu negócio já está aqui".

**Critérios de aceite:**
- [ ] Rota admin `/admin/import` aceita parâmetros: centro (lat/lng), raio, lista de tipos
- [ ] Cada negócio retornado é persistido em `Business` com status `IMPORTED`
- [ ] Fotos são baixadas para Vercel Blob, max 5 por negócio
- [ ] Tipo Google é mapeado para `Category` do nosso domínio
- [ ] Re-importação de um placeId já existente atualiza dados, não duplica
- [ ] Log de auditoria registrado para cada importação em massa
- [ ] Falhas individuais não derrubam o lote (try/catch por item)

**Não-objetivos:** Sincronização contínua em tempo real (fica para v2). Importação de reviews (usar só rating agregado).

**Fluxo principal:**
1. Admin acessa `/admin/import`
2. Preenche: centro `(-15.8762, -47.9292)`, raio 3000m, tipos `[restaurant, cafe, beauty_salon, ...]`
3. Submete
4. Backend itera tipos, faz Nearby Search para cada
5. Para cada placeId retornado, faz Place Details
6. Baixa fotos, persiste tudo
7. Retorna relatório: importados / atualizados / erros

**Modelo de dados afetado:** `Business`, `Category`, `Photo`, `AuditLog`.

**Riscos:** Cota da Places API estourar (mitigação: contador antes de cada batch); fotos pesadas (mitigação: limite 5 por negócio); dados imprecisos do Google (mitigação: campo `lastSyncedAt` para auditar quando puxou).

---

### Spec 002 — Listagem pública por categoria

**Contexto:** Persona Marina chega via SEO. Precisa de listagem rápida, mobile-first, com info essencial visível sem clicar.

**Critérios de aceite:**
- [ ] Rota `/[bairro]/[categoria]` (ex: `/jardim-botanico/cafeterias`)
- [ ] Lista todos os `Business` da categoria, ordenados: Premium > Visibilidade > Free, depois por rating decrescente
- [ ] Cada card mostra: nome, foto principal, rating, distância (se geolocalização permitida), horário status ("aberto"/"fecha em X min"), botão WhatsApp
- [ ] Filtro: "aberto agora" (toggle)
- [ ] Busca textual local na categoria
- [ ] Página renderizada via ISR, revalidação 1h
- [ ] Schema.org `LocalBusiness` em cada card (JSON-LD)
- [ ] Open Graph + título SEO por categoria

**Fluxos de exceção:** Categoria sem negócios → mensagem "Em breve estamos com novos negócios aqui — conhece algum? Sugira!" com formulário.

**Métricas de sucesso:** CTR para página de detalhe > 30%. Tempo de carregamento < 1.5s mobile.

---

### Spec 003 — Página de detalhe do negócio

**Critérios de aceite:**
- [ ] Rota `/[bairro]/[categoria]/[slug]`
- [ ] Header com nome, rating Google, categoria, badge se Premium
- [ ] Galeria com lazy loading
- [ ] Bloco de info: endereço, telefone, horário completo da semana, status atual
- [ ] CTAs proeminentes: "Abrir no WhatsApp", "Ligar", "Como chegar" (link Google Maps), "Site"
- [ ] Descrição editorial (se Visibilidade+) ou só nome (se Free)
- [ ] Reviews do Google integradas (top 3 melhores)
- [ ] JSON-LD `LocalBusiness` completo
- [ ] Click no WhatsApp dispara evento `WhatsappClick` (incrementa contador do dia)
- [ ] View na página dispara evento `BusinessView`
- [ ] Se status = `SUSPENDED`, mostra 410 Gone

**Não-objetivos v1:** comentários, salvos, sistema de avaliação próprio.

---

### Spec 004 — Autenticação

**Critérios:**
- [ ] Email/senha + Google OAuth via NextAuth v5
- [ ] Verificação de email obrigatória antes de reivindicar negócio
- [ ] Reset de senha funcional
- [ ] Sessão JWT de 30 dias
- [ ] Middleware protege rotas `/dashboard/*` e `/admin/*`
- [ ] `/admin/*` requer role = ADMIN

---

### Spec 005 — Reivindicação de negócio

**Critérios:**
- [ ] Botão "Este negócio é meu?" em todo perfil sem dono
- [ ] Fluxo de reivindicação: login → preencher dados de comprovação (CNPJ, telefone, upload de documento opcional)
- [ ] Cria `ClaimRequest` com status PENDING
- [ ] Email para admin notificando
- [ ] Admin aprova/rejeita via `/admin/claims`
- [ ] Ao aprovar: `Business.ownerId = userId`, status `CLAIMED`
- [ ] Email para usuário notificando aprovação/rejeição
- [ ] Negócio com 0 reviews ou rating < 3.5 entra em fila de revisão extra

---

### Spec 006 — Painel do anunciante (free)

**Critérios:**
- [ ] `/dashboard` lista negócios reivindicados pelo usuário
- [ ] Editar: descrição, WhatsApp, horários customizados (sobrepõem Google), site, Instagram
- [ ] Upload de até 3 fotos no plano Free, 6 em Visibilidade, 20 em Premium
- [ ] Preview de como o perfil aparece publicamente
- [ ] Página de plano atual + upgrade CTA
- [ ] Métricas básicas (free): apenas visualizações últimos 7 dias

---

### Spec 007 — Painel administrativo

**Critérios:**
- [ ] `/admin/dashboard` com KPIs: total de negócios, reivindicados, anunciantes pagos, MRR
- [ ] `/admin/businesses` CRUD completo
- [ ] `/admin/claims` lista de reivindicações pendentes
- [ ] `/admin/import` interface da Spec 001
- [ ] `/admin/audit` log de auditoria pesquisável
- [ ] Apenas role ADMIN acessa

---

### Spec 008 — Checkout assinatura Visibilidade

**Critérios:**
- [ ] Integração Asaas (criação de cliente + assinatura recorrente)
- [ ] Métodos: PIX, cartão, boleto
- [ ] Webhook Asaas atualiza `Subscription.status`
- [ ] Quando ativa: `Business.plan = VISIBILITY`, `planExpiresAt = +30d`
- [ ] Quando past_due: degrada para Free após 7 dias de tolerância
- [ ] Página de cobranças no painel
- [ ] Email de confirmação + 3 dias antes do vencimento

---

## Parte 9 — Roadmap de execução (12 semanas, 1h/dia + sábados)

| Semana | Foco | Saída concreta |
|---|---|---|
| 1 | Project base + Spec-Kit + ADRs iniciais | Repo base genérico + repo do Achei vazio + 8 ADRs |
| 2 | Spec 001 — Import + dados populados | 200+ negócios no banco, página /admin/import funcional |
| 3 | Spec 002 — Listagem pública | Site público em produção, com SEO básico |
| 4 | Spec 003 — Detalhe + métricas tracking | Página de detalhe + contadores funcionando |
| 5 | Spec 004 — Auth completa | Login/registro/Google OAuth + email verify |
| 6 | Spec 005 — Claim flow | Fluxo de reivindicação ponta a ponta |
| 7 | Spec 006 — Painel anunciante | CRUD + upload de foto + preview |
| 8 | Spec 007 — Admin completo | Dashboard, claims review, audit log |
| 9 | Spec 008 — Asaas + Visibilidade | Pagamento end-to-end com webhook |
| 10 | SEO técnico + sitemap + Open Graph | Páginas indexáveis, schema.org completo |
| 11 | Polish + bugfix + UX review | Lista de melhorias do beta interno |
| 12 | Launch preparation + primeiros prospects | Material de venda + 20 visitas presenciais |

---

## Parte 10 — Constituição do projeto (princípios invioláveis)

Estes vão para `.specify/memory/constitution.md` e o Spec-Kit os lê em toda execução.

1. **Mobile-first**, sempre. Se quebrar em mobile, não está pronto.
2. **SEO local é vantagem competitiva**, não nice-to-have. Toda página pública tem JSON-LD, sitemap entry, Open Graph.
3. **Privacidade por padrão**: LGPD compliance é não-negociável. Dados pessoais ao mínimo.
4. **Performance importa**: meta de < 2s LCP em 3G; sem isto, descoberta espontânea morre.
5. **Reversibilidade**: nada de migrações destrutivas sem backup. Toda ação admin é logada.
6. **Acessibilidade**: WCAG 2.1 AA como meta. Não é caridade, é mercado (idosos compram local).
7. **Single source of truth**: Spec antes do código. Se a spec não está clara, não codifica.
8. **Dependência mínima**: cada lib adicionada precisa de justificativa registrada (ADR ou comentário no PR).
9. **Tests onde matter**: lógica de billing e integração Places API têm testes obrigatórios. UI pode pular.
10. **Curadoria humana é feature**: o operador editar manualmente um negócio é fluxo de primeira classe, não exceção.

---

## Apêndice A — Glossário rápido

- **ICP** (Ideal Customer Profile): perfil do cliente ideal
- **MRR** (Monthly Recurring Revenue): receita recorrente mensal
- **JTBD** (Jobs to Be Done): framework de análise de demanda
- **ADR** (Architecture Decision Record): registro de decisão arquitetural
- **ISR** (Incremental Static Regeneration): geração estática incremental do Next.js
- **CSP** (Content Security Policy): cabeçalho de segurança contra XSS
- **PRD** (Product Requirements Document): documento de requisitos
- **LCP** (Largest Contentful Paint): métrica core web vital de performance
- **UGC** (User-Generated Content): conteúdo gerado por usuário

---

## Apêndice B — Como evoluir este documento

Este arquivo é o **discricionário mestre**. Evolução:

1. Mudanças de visão / personas / monetização → editam este documento diretamente
2. Mudanças de feature individual → editam a spec específica em `/specs/NNN-feature/spec.md`
3. Decisões técnicas novas → criam ADR em `/docs/adr/`
4. Aprendizados de operação → vão para `/docs/runbooks/`

Nada de "v2 do documento". O git é o histórico.

---

**Próximo passo concreto:** Iniciar Release 0 — clonar Courtesyfy, limpar, instalar Spec-Kit, escrever a constitution.md baseada na Parte 10 deste documento, criar ADRs 0001 a 0008.

*Documento elaborado por Claude (Anthropic) a partir de discovery realizada com Álvaro — Technology Web. Mai/2026.*
