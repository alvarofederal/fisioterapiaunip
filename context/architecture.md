# Courtesyfy — Arquitetura Técnica

## Visão Geral da Arquitetura

O Courtesyfy segue a arquitetura do Next.js App Router com separação clara entre camadas.

```
Cliente (Browser)
    ↓
Next.js App Router (React Server Components + Client Components)
    ↓
Server Actions / API Routes
    ↓
Data Access Layer (_data_access/)
    ↓
Prisma ORM
    ↓
MySQL Database
```

---

## Estrutura de Diretórios Alvo

```
src/
├── app/
│   ├── (auth)/               # Rotas de autenticação (login, register)
│   │   └── layout.tsx
│   │
│   ├── (panel)/              # Painel protegido (requer sessão)
│   │   ├── layout.tsx
│   │   ├── dashboard/        # Dashboard com métricas consolidadas
│   │   ├── campanhas/        # CRUD de campanhas
│   │   │   ├── nova/
│   │   │   └── [id]/
│   │   │       └── chaves/   # Chaves de uma campanha específica
│   │   ├── chaves/           # Lista global de chaves + validação rápida
│   │   │   └── validar/      # Tela de validação para operador
│   │   ├── resgates/         # Histórico de resgates
│   │   ├── loja/
│   │   │   └── configuracoes/
│   │   └── usuarios/         # Gestão de operadores
│   │
│   ├── (public)/             # Rotas públicas (sem auth)
│   │   └── c/
│   │       └── [codigo]/     # Landing page da chave
│   │           └── ativar/   # Ativação pelo cliente
│   │
│   ├── admin/                # Super admin da plataforma
│   │
│   └── api/
│       ├── webhook/          # Stripe webhook
│       ├── upload/           # Cloudinary upload
│       ├── chaves/
│       │   └── validar/      # Validação externa (QR, PDV)
│       └── cron/
│           └── expirar-chaves/
│
├── _actions/                 # Server Actions globais (por domínio)
│   ├── campanhas/
│   ├── chaves/
│   ├── clientes/
│   ├── loja/
│   └── usuarios/
│
├── _data_access/             # Queries ao banco (sem lógica de negócio)
│   ├── campanhas/
│   ├── chaves/
│   ├── clientes/
│   ├── loja/
│   ├── resgates/
│   └── logs/
│
├── components/
│   ├── ui/                   # Shadcn/UI components
│   ├── panel/                # Sidebar, header, cards do painel
│   ├── campanhas/            # Formulários e tabelas de campanhas
│   ├── chaves/               # Tabelas, badges de status, form de validação
│   └── public/               # Landing page e form de ativação
│
├── lib/
│   ├── auth.ts               # NextAuth.js 5 config
│   ├── prisma.ts             # Prisma singleton
│   ├── email.ts              # Resend config
│   ├── whatsapp.ts           # Twilio config
│   ├── stripe.ts             # Stripe config
│   └── qrcode.ts             # Gerador de QR Code
│
├── utils/
│   ├── chave-generator.ts    # Gera código único XXXX-XXXX-XXXX-XXXX
│   ├── permissions/          # check-plano.ts, limites-plano.ts
│   └── export/               # gerar-pdf-lote.ts, gerar-csv-lote.ts
│
└── types/
    ├── campanha.ts
    ├── chave.ts
    ├── cliente.ts
    └── next-auth.d.ts
```

---

## Padrões Arquiteturais

### 1. Data Access Layer (DAL)
Queries Prisma ficam em `_data_access/` organizadas por domínio. Sem lógica de negócio aqui — apenas SELECT, inclui relações necessárias.

### 2. Server Actions
Toda mutação interna usa Server Actions (`_actions/`). API Routes apenas para integrações externas (Stripe webhook, Cloudinary, validação QR por PDV externo).

### 3. Route Groups
- `(auth)` → login, register, sem sidebar
- `(panel)` → rotas protegidas com sidebar do painel
- `(public)` → landing page de chave, acessível sem login

### 4. Autenticação
- NextAuth.js 5 com Prisma Adapter
- Provedores: Google, GitHub, Credentials (email/senha)
- Middleware protege rotas via cookie (sem Prisma no middleware)
- `User` tem `lojaId` que vincula ao tenant (loja)

### 5. Sistema de Permissões por Plano
Em `src/utils/permissions/`:
- `check-plano.ts` — verifica plano ativo da loja
- `limites-plano.ts` — define limites por plano (campanhas, chaves/mês, etc.)

### 6. Pagamentos (Stripe)
- Webhook em `/api/webhook` sincroniza status de assinatura da loja
- `Loja` tem campos `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`
- Planos: ESSENCIAL, PROFISSIONAL, EMPRESARIAL

### 7. Geração de Chave Única
- Formato: `XXXX-XXXX-XXXX-XXXX` (16 chars alfanuméricos)
- Sem caracteres ambíguos: sem O, 0, I, 1, S, 5
- Entropia segura (`crypto.randomBytes`)
- Verifica duplicata no banco antes de persistir

---

## Banco de Dados - Grupos de Modelos

### Autenticação (manter do Basemedical)
`User`, `Account`, `Session`, `VerificationToken`

### Domínio Courtesyfy (novos)
`Loja`, `Campanha`, `LoteChave`, `Chave`, `Cliente`, `Resgate`, `LogEvento`

---

## Integrações Externas

| Serviço | Uso | Arquivo |
|---------|-----|---------|
| Stripe | Assinaturas da loja | `src/lib/stripe.ts` |
| Resend | Emails transacionais | `src/lib/email.ts` |
| Twilio | WhatsApp para chaves digitais | `src/lib/whatsapp.ts` |
| Cloudinary | Upload de logos | `/api/upload` |
| NextAuth | OAuth e sessões | `src/lib/auth.ts` |
| QR Code | Geração de QR por chave | `src/lib/qrcode.ts` |

---

## Middleware

`middleware.ts` protege rotas sem consultar banco:
- Verifica cookie de sessão NextAuth
- Rotas públicas: `/c/[codigo]`, `/c/[codigo]/ativar`, `/api/chaves/validar`
- Redireciona não-autenticados para `/login`

---

*Criado em: 2026-05-02 | Migrado de Basemedical para Courtesyfy*
