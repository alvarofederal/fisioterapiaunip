# Courtesyfy — Visão Geral do Sistema

## O que é o Courtesyfy?

**Courtesyfy** é um SaaS B2B para gestão de campanhas promocionais com chaves únicas (cortesias).
Permite que lojistas criem campanhas, gerem lotes de chaves únicas com QR Code, distribuam para
clientes (físico ou digital) e validem resgates de forma segura e rastreável.

**Modelo de negócio:** Assinatura mensal por plano (Essencial / Profissional / Empresarial via Stripe)
+ venda avulsa de kits de impressão física (Offset, Chaveiro MDF, Quadrado MDF)
**Público-alvo:** Lojistas, marcas e empresas que fazem promoções físicas ou digitais no Brasil
**Status:** MVP em produção — **[courtesyfy.com.br](https://courtesyfy.com.br)**
**Versão atual:** 1.0.3

---

## Conceito Central

O sistema gira em torno do ciclo de vida de uma **chave única**:

```
GERADA → CONSULTADA → ATIVADA → RESGATADA  (estado final, imutável)
           ↘ EXPIRADA  (automático via cron diário às 03:00 UTC)
           ↘ CANCELADA (manual pelo lojista)
```

**Fluxo resumido:**
1. Lojista cria campanha → gera lote de chaves com QR Code → distribui (física ou digitalmente)
2. Cliente recebe chave → escaneia QR ou acessa URL → ativa com telefone/e-mail
3. Operador valida a chave no balcão → registra resgate → benefício entregue

---

## Atores do Sistema

| Ator | Role | O que faz |
|------|------|-----------|
| **Lojista** | `LOJISTA` | Cria campanhas, gera chaves, exporta para impressão, vê métricas |
| **Operador** | `LOJISTA` | Valida chaves no balcão, registra resgates (mesma role, mesma loja) |
| **Cliente (Portador)** | — | Consulta benefício via landing pública, ativa chave com tel/email |
| **Super Admin** | `SUPER_ADMIN` | Gerencia lojas, planos, Stripe, impressões e logs globais |

> ⚠️ **Role de Super Admin é `SUPER_ADMIN`** — nunca usar `"ADMIN"` para verificar permissão.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript 5+ (strict mode) |
| Runtime | React 19 |
| Banco de Dados | MySQL + Prisma ORM 5 |
| Autenticação | NextAuth.js 5 (OAuth Google + Credentials) |
| Pagamentos | Stripe (assinaturas + pagamentos únicos de produtos físicos) |
| Email | Resend |
| WhatsApp | Twilio (configurado, não ativo em produção) |
| Upload | Cloudinary |
| QR Code | qrcode + qrcode.react |
| Rate Limiting | @upstash/ratelimit + @upstash/redis (fallback in-memory) |
| UI Base | Shadcn/UI + Radix UI |
| Styling | Tailwind CSS 4 |
| Formulários | React Hook Form 7 + Zod 3 |
| Estado | TanStack React Query 5 |
| Gráficos | Recharts (instalado, não em uso) |
| Testes | Vitest 4 (77 testes: unitários + integração) |
| Build | Turbopack |
| Deploy | Vercel (branch main → produção automática) |

---

## Planos de Assinatura

| Plano | Preço | Stripe Price ID |
|-------|-------|----------------|
| **ESSENCIAL** | Grátis | — |
| **PROFISSIONAL** | R$ 99/mês | `STRIPE_PLAN_PROFESSIONAL` |
| **EMPRESARIAL** | R$ 199/mês | `STRIPE_PLAN_EMPRESARIAL` |

Trial: 14 dias grátis ao assinar qualquer plano pago.

## Produtos Físicos (Kits de Impressão)

| Produto | Variantes | Env vars |
|---------|-----------|---------|
| Papel Offset 240g | Kit 50 / Kit 100 | `STRIPE_PRICE_IMPRESSAO_KIT50/100` |
| MDF Chaveiro 7×3,5cm | Kit 10 / Kit 100 | `STRIPE_PRICE_CHAVEIRO_KIT10/100` |
| MDF Quadrado 9×9cm | Kit 10 / Kit 50 | `STRIPE_PRICE_MDF_QUADRADO_KIT10/50` |

---

## Tipos de Benefício em Campanhas

- `DESCONTO_PERCENTUAL` — ex: 15% de desconto
- `DESCONTO_FIXO` — ex: R$ 30,00 de desconto
- `BRINDE` — produto/item gratuito
- `SORTEIO` — participação em sorteio
- `FRETE_GRATIS` — frete isento
- `CASHBACK` — devolução de valor

---

## URLs Públicas Importantes

| Rota | Finalidade |
|------|-----------|
| `/` | Landing page (planos + kits de impressão) |
| `/c/[codigo]` | Landing page da chave (consulta pública pelo cliente) |
| `/c/[codigo]/ativar` | Ativação da chave (coleta tel/email do cliente) |
| `/resgatar` | Scanner / digitação de código pelo cliente |
| `/api/checkout-produto` | Checkout público de kits físicos (allowlist de price IDs) |
| `/api/chaves/validar` | **API externa** para PDV/totem (Bearer HMAC-SHA256) — **ativo** |
| `/api/cron/expirar-chaves` | Expiração automática (Vercel Cron, 03:00 UTC) — **ativo** |
| `/api/webhook` | Stripe webhook (sincroniza assinaturas) |
| `/api/upload` | Cloudinary upload (logos) |

---

## Variáveis de Ambiente

```bash
# Banco
DATABASE_URL                        # MySQL connection string

# Auth
AUTH_SECRET                         # NextAuth secret (32+ chars)
AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
NEXTAUTH_URL                        # https://courtesyfy.com.br (produção)
NEXTAUTH_SECRET                     # Gerar valor real; não usar "your-secret-key-here"

# Stripe (conta acct_1TWPs2ADOPgqdFsc — modo Test)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY
STRIPE_SECRET_KEY
STRIPE_SECRET_WEBHOOK_KEY
STRIPE_PLAN_PROFESSIONAL
STRIPE_PLAN_EMPRESARIAL
STRIPE_PRICE_IMPRESSAO_KIT50 / KIT100
STRIPE_PRICE_CHAVEIRO_KIT10 / KIT100
STRIPE_PRICE_MDF_QUADRADO_KIT10 / KIT50
STRIPE_SUCCESS_URL                  # https://courtesyfy.com.br/dashboard/planos
STRIPE_CANCEL_URL                   # https://courtesyfy.com.br/dashboard/planos

# Serviços
RESEND_API_KEY
CLOUDINARY_NAME / CLOUDINARY_KEY / CLOUDINARY_SECRET
TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_NUMBER

# Segredos de automação
CRON_SECRET                         # Protege /api/cron/expirar-chaves
API_KEY_SECRET                      # Deriva HMAC API keys das lojas

# Rate limiting distribuído (opcional — fallback in-memory sem estes)
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

# URLs da aplicação
NEXT_PUBLIC_URL                     # https://courtesyfy.com.br (produção)
```

> ⚠️ **Vercel:** verificar que `NEXTAUTH_URL` e `NEXT_PUBLIC_URL` são `https://courtesyfy.com.br`.
> Se apontarem para `courtesyfy.vercel.app`, o site vai redirecionar para o domínio errado.

---

## Comandos Principais

```bash
npm run dev           # Desenvolvimento com Turbopack
npm run build         # Build completo
npm run test          # Vitest (todos os testes)
npm run test:unit     # Apenas testes unitários
npm run db:push       # Aplicar schema ao banco (dev)

# Webhook Stripe local
stripe listen --api-key sk_test_51TWPs2... --forward-to localhost:3000/api/webhook

# Testar cron manualmente
curl http://localhost:3000/api/cron/expirar-chaves  # dev sem auth
curl https://courtesyfy.com.br/api/cron/expirar-chaves \
  -H "Authorization: Bearer $CRON_SECRET"           # produção
```

---

*Criado em: 2026-05-02 | Atualizado em: 2026-05-20*
