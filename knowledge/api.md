# Courtesyfy — Conhecimento das APIs

## Arquitetura de API

O Courtesyfy usa dois padrões de comunicação servidor-cliente:

1. **Server Actions** → para mutações internas (formulários, CRUD do dashboard)
2. **API Routes** (`/api/*`) → para integrações externas, webhooks e endpoints públicos

---

## API Routes Disponíveis

### Autenticação
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/auth/[...nextauth]` | GET/POST | Handlers NextAuth (OAuth Google, signin, signout) |
| `/api/register` | POST | Registro de novo lojista |
| `/api/verify-email` | POST | Verificação de email com token |

### Chaves e Validação
| Endpoint | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `/api/chaves/validar` | POST | Bearer API Key | Validação pública via QR/código (consultar ou resgatar) |
| `/api/cron/expirar-chaves` | GET | CRON_SECRET | Expiração automática de chaves — rodando diariamente às 03h UTC |

#### `/api/chaves/validar`
Permite que sistemas externos (PDVs, apps) consultem e resgatem chaves.

**Autenticação:** Bearer token no formato `cfy.<lojaId>.<HMAC-sig>`
O token é gerado deterministicamente via `computeApiKey(lojaId)` usando `API_KEY_SECRET`.
O lojista visualiza sua API key em **Configurações > API Key**.

```typescript
// Body
{
  codigo:     string,                           // "XXXX-XXXX-XXXX-XXXX"
  acao?:      "consultar" | "resgatar",        // default: "consultar"
  observacao?: string                           // opcional, apenas para acao=resgatar
}

// Resposta sucesso — consultar
{
  ok: true, acao: "consultar",
  chave: { codigo, status, campanha, beneficio, expiraEm, clienteNome,
           clienteTelefone, clienteEmail, ativadaEm }
}

// Resposta sucesso — resgatar
{
  ok: true, acao: "resgatar",
  chave: { codigo, status: "RESGATADA", campanha, beneficio, resgatadaEm,
           clienteNome, clienteTelefone, clienteEmail }
}

// Resposta erro
{ ok: false, error: string, status?: string }  // status HTTP: 400/401/403/404/409/410/422
```

**Regras:**
- `consultar`: leitura pura — não grava nada no banco
- `resgatar`: só funciona se status for `ATIVADA`; marca `RESGATADA` + cria `Resgate` + `LogEvento`
- A chave deve pertencer à loja da API key (isolamento por `lojaId`)

#### `/api/cron/expirar-chaves`
Executado automaticamente pelo Vercel Cron todos os dias às 03:00 UTC.
Configurado em `vercel.json`. Autenticado via `Authorization: Bearer <CRON_SECRET>`.

```bash
# Teste manual (dev sem auth, produção com header)
curl https://courtesyfy.com.br/api/cron/expirar-chaves \
  -H "Authorization: Bearer $CRON_SECRET"

# Resposta
{ ok: true, chavesExpiradas: 42, campanhasEncerradas: 3, executadoEm: "2026-05-20T03:00:00.000Z" }
```

### Stripe e Pagamentos
| Endpoint | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `/api/checkout-produto` | POST | Nenhuma (allowlist) | Checkout público de kits físicos |
| `/api/webhook` | POST | Stripe signature | Sincroniza assinaturas após eventos Stripe |

#### `/api/checkout-produto`
Permite que qualquer visitante da landing page compre kits de impressão sem estar logado.
Valida o `priceId` contra uma allowlist de IDs configurados no `.env` antes de criar a sessão.

```typescript
// Body
{ priceId: string }

// Resposta sucesso
{ url: string }  // URL do Stripe Checkout

// Resposta erro
{ error: string }
```

**Price IDs permitidos:** todos os 6 kits definidos em `STRIPE_PRICE_*` no `.env`.

### Upload
| Endpoint | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `/api/upload` | POST | Sessão | Upload de imagem para Cloudinary (logos de loja) |

---

## Server Actions — Padrão

```typescript
"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const Schema = z.object({ campo: z.string().min(1) })

export async function minhaAction(data: unknown) {
  const session = await auth()
  if (!session?.user?.lojaId) return { error: "Não autorizado" }

  const parsed = Schema.safeParse(data)
  if (!parsed.success) return { error: "Dados inválidos" }

  // verificar permissão de plano se necessário
  // await verificarLimitePlano(session.user.lojaId, "campanhas")

  await db.model.create({
    data: { ...parsed.data, lojaId: session.user.lojaId },
  })

  revalidatePath("/dashboard/feature")
  return { ok: true }
}
```

### Server Actions admin (Super Admin)

```typescript
"use server"

import { auth } from "@/lib/auth"

async function assertAdmin() {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") throw new Error("Não autorizado")
}

export async function acaoAdmin(...) {
  await assertAdmin()
  // ...
}
```

---

## Stripe — Actions de Admin

Localizadas em `src/app/(panel)/dashboard/admin/stripe/produtos/_actions.ts`:

| Action | O que faz |
|--------|-----------|
| `atualizarProduto(id, { nome, descricao })` | Atualiza nome/descrição no Stripe |
| `arquivarProduto(id)` | Define `active: false` no produto |
| `atualizarNicknamePreco(priceId, nickname)` | Atualiza nickname do preço |
| `arquivarPreco(priceId)` | Define `active: false` no preço |
| `criarPreco(produtoId, { amount, currency, recurring, interval, nickname })` | Cria novo preço (retorna `priceId`) |
| `criarProduto({ nome, descricao })` | Cria novo produto (retorna `produtoId`) |

> ⚠️ **Preços Stripe são imutáveis para valor** — só nickname pode ser editado.
> Para mudar valor: arquivar o preço antigo e criar um novo.

---

## Webhook Stripe

**Rota:** `POST /api/webhook`
**Segurança:** Verifica assinatura com `STRIPE_SECRET_WEBHOOK_KEY`

Eventos tratados:
| Evento | Ação |
|--------|------|
| `checkout.session.completed` | Ativa plano após pagamento de assinatura ou produto |
| `customer.subscription.updated` | Atualiza plano da loja |
| `customer.subscription.deleted` | Suspende loja (plano → ESSENCIAL ou `status: SUSPENSO`) |
| `invoice.payment_succeeded` | Renova assinatura ativa |
| `invoice.payment_failed` | Marca pagamento pendente |

**Teste local:**
```bash
stripe listen --api-key sk_test_51TWPs2... --forward-to localhost:3000/api/webhook
```

---

## Padrão de Resposta das API Routes

```typescript
// Sucesso
return NextResponse.json({ data: result }, { status: 200 })

// Erro de validação
return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })

// Não autenticado
return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

// Não encontrado
return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

// Erro interno
return NextResponse.json({ error: "Erro interno" }, { status: 500 })
```

---

## Integrações Externas

### Stripe
**Config:** `src/lib/stripe.ts`

```typescript
import { stripe } from "@/lib/stripe"

// Exemplos
await stripe.products.list({ active: true, limit: 50 })
await stripe.prices.list({ product: prodId, active: true })
await stripe.checkout.sessions.create({ mode: "payment", ... })
```

### Resend (Email)
**Config:** `src/lib/email.ts` (ou similar)

```typescript
import { Resend } from "resend"
const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: "noreply@courtesyfy.com",
  to: cliente.email,
  subject: "Sua cortesia foi ativada!",
  react: <EmailTemplate ... />,
})
```

### Cloudinary (Upload)
```typescript
// Enviar FormData para /api/upload
const formData = new FormData()
formData.append("file", file)
const { url } = await fetch("/api/upload", { method: "POST", body: formData }).then(r => r.json())
```

### Twilio (WhatsApp)
```typescript
import { sendWhatsApp } from "@/lib/whatsapp"

await sendWhatsApp({
  to: "+5511999999999",
  message: "Sua cortesia foi ativada com sucesso!",
})
```

---

*Atualizado em: 2026-05-13*
