# Courtesyfy — Guia para Claude Code

> Este arquivo é carregado automaticamente pelo Claude Code em toda sessão.
> Leia-o completamente antes de fazer qualquer alteração no projeto.

---

## O que é este projeto?

**Courtesyfy** é um SaaS B2B para gestão de campanhas promocionais com chaves únicas (cortesias).
Lojistas criam campanhas, geram chaves com QR Code, distribuem para clientes e validam resgates.
Stack: Next.js 15 (App Router) + TypeScript + MySQL (Prisma) + Stripe + Vercel.
**Versão atual:** 1.0.2 | **Branch ativo:** main | **Status:** MVP em produção — **[courtesyfy.com.br](https://courtesyfy.com.br)**

---

## Arquivos de Contexto - LEIA ANTES DE CODAR

Consulte estes arquivos para entender o projeto em profundidade:

| Arquivo | Quando ler |
|---------|-----------|
| `context/system.md` | Visão geral, atores, stack, planos, integrações |
| `context/architecture.md` | Estrutura de pastas, padrões de código |
| `context/rules.md` | Convenções, checklist, o que nunca fazer |
| `planning/roadmap.md` | MVP, P0, P1, P2 — o que foi feito e o que está planejado |
| `planning/backlog.md` | Funcionalidades priorizadas |
| `planning/releases.md` | Histórico de versões |
| `development/features.md` | Features em andamento agora |
| `development/bugs.md` | Bugs conhecidos |
| `development/improvements.md` | Melhorias técnicas planejadas |
| `knowledge/database.md` | Schema Prisma completo, enums, queries comuns |
| `knowledge/api.md` | Endpoints, padrões de Server Actions |
| `knowledge/domain.md` | Vocabulário, regras de negócio, fluxos, estados da chave |

---

## Regras Críticas - NUNCA ignore

1. **Não alterar schema Prisma** sem confirmar com o usuário — `db push --accept-data-loss` pode apagar dados
2. **Não mudar sistema de autenticação** (NextAuth) sem discussão
3. **Não mexer em lógica de cobrança/Stripe** sem entender o impacto
4. **Sempre usar** `import { db } from "@/lib/prisma"` para Prisma
5. **Sempre usar** `import { auth } from "@/lib/auth"` para sessão
6. **Sempre validar** inputs com Zod nas Server Actions e API Routes
7. **Sempre verificar permissões** por plano da loja antes de criar recursos
8. **Chave resgatada é imutável** — nunca alterar status de RESGATADA para outro
9. **Código da chave é único global** — sempre verificar duplicata antes de persistir
10. **Role de super admin é `SUPER_ADMIN`** — nunca usar `"ADMIN"` para verificar permissão de super admin

---

## Padrões Obrigatórios

### Server Action
```typescript
"use server"
const session = await auth()
if (!session?.user) return { error: "Não autorizado" }
// valida com Zod → verifica permissão de plano → executa → revalidatePath
```

### Componente com dados
```typescript
// Server Component (padrão) → busca dados direto
// Client Component → usa React Query ou Server Action
"use client" // só quando necessário (hooks, eventos, formulários)
```

### Importações
```typescript
import { db } from "@/lib/prisma"       // sempre assim
import { auth } from "@/lib/auth"       // sempre assim
import { cn } from "@/lib/utils"        // para classnames
import { stripe } from "@/lib/stripe"   // para Stripe
```

### Verificação de permissão admin (Super Admin)
```typescript
const session = await auth()
if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard")
```

---

## Stripe — Conta Courtesyfy

**Conta:** `acct_1TWPs2ADOPgqdFsc` | **Modo atual:** Test (`pk_test_` / `sk_test_`)

### Price IDs configurados no `.env`
| Variável de ambiente | Produto |
|---------------------|---------|
| `STRIPE_PLAN_PROFESSIONAL` | Plano Profissional — R$ 99/mês (recorrente) |
| `STRIPE_PLAN_EMPRESARIAL` | Plano Empresarial — R$ 199/mês (recorrente) |
| `STRIPE_PRICE_IMPRESSAO_KIT50` | Papel Offset 240g — Kit 50 cards (único) |
| `STRIPE_PRICE_IMPRESSAO_KIT100` | Papel Offset 240g — Kit 100 cards (único) |
| `STRIPE_PRICE_CHAVEIRO_KIT10` | MDF Chaveiro 7×3,5cm — Kit 10 peças (único) |
| `STRIPE_PRICE_CHAVEIRO_KIT100` | MDF Chaveiro 7×3,5cm — Kit 100 peças (único) |
| `STRIPE_PRICE_MDF_QUADRADO_KIT10` | MDF Quadrado 9×9cm — Kit 10 peças (único) |
| `STRIPE_PRICE_MDF_QUADRADO_KIT50` | MDF Quadrado 9×9cm — Kit 50 peças (único) |

### Webhook
- **Produção:** `https://courtesyfy.com.br/api/webhook`
- **Local (desenvolvimento):**
```bash
stripe listen --api-key sk_test_51TWPs2... --forward-to localhost:3000/api/webhook
# ou: npm run stripe:listen:local
```

---

## Mapa de Telas (Rotas)

### Públicas
| Rota | Descrição |
|------|-----------|
| `/` | Landing page com planos de assinatura e kits de impressão (CTAs conectados ao Stripe) |
| `/c/[codigo]` | Página pública da chave — cliente consulta benefício |
| `/c/[codigo]/ativar` | Ativação da chave — coleta tel/email do cliente |
| `/resgatar` | Scanner / digitação de código pelo cliente |
| `/register` | Cadastro de novo lojista (aceita `?plano=PROFISSIONAL` / `?plano=EMPRESARIAL`) |
| `/login` | Login |

### Dashboard — Lojista (`/dashboard/*`)
| Rota | Descrição |
|------|-----------|
| `/dashboard` | Home com métricas da loja |
| `/dashboard/campanhas` | Listagem de campanhas |
| `/dashboard/campanhas/[id]` | Detalhe + lote de chaves da campanha |
| `/dashboard/chaves` | Listagem de chaves com filtros |
| `/dashboard/resgates` | Histórico de resgates |
| `/dashboard/clientes` | Lista de clientes com busca |
| `/dashboard/clientes/[id]` | Detalhe do cliente com histórico de chaves |
| `/dashboard/validar` | Validação rápida de chaves (operador no balcão) |
| `/dashboard/totem` | Modo totem para auto-atendimento |
| `/dashboard/impressao` | Exportação de chaves para impressão |
| `/dashboard/planos` | Gerenciar assinatura (upgrade/downgrade) |

### Dashboard — Super Admin (`/dashboard/admin/*`)
| Rota | Descrição |
|------|-----------|
| `/dashboard/admin` | Painel geral admin |
| `/dashboard/admin/stripe` | Métricas Stripe: MRR, assinantes, renovações, lojas suspensas, eventos |
| `/dashboard/admin/stripe/produtos` | Gerenciar produtos e preços no Stripe (edição inline) |

---

## API Routes Principais

| Rota | Método | Autenticação | Descrição |
|------|--------|-------------|-----------|
| `/api/checkout-produto` | POST | Nenhuma (allowlist de priceIds) | Checkout público de kits físicos |
| `/api/webhook` | POST | Stripe signature | Sincroniza assinaturas após pagamento |
| `/api/upload` | POST | Sessão | Upload de imagem para Cloudinary |
| `/api/auth/[...nextauth]` | GET/POST | — | Handlers NextAuth |
| `/api/chaves/validar` | POST | API Key | Validação externa via QR — **a implementar** |
| `/api/cron/expirar-chaves` | GET | CRON_SECRET | Expiração automática de chaves — **a implementar** |

---

## Branch e Workflow

```bash
# Branch principal (deploy automático no Vercel)
main

# Nova feature
git checkout -b feature/nome-da-feature
git commit -m "descrição clara do que foi feito"
git push origin feature/nome-da-feature

# Verificar build antes de merge
npm run build
```

---

## O que está sendo desenvolvido AGORA

Ver `development/features.md` para o status atual.

**Resumo rápido (atualizado 2026-05-13):**
- MVP completo e em produção no Vercel
- Stripe integrado: planos + produtos físicos (kits de impressão) com checkout público
- Tela de Clientes implementada (lista + detalhe)
- Admin Stripe expandido com MRR, renovações, eventos e gerenciamento de produtos
- **Próximas prioridades:** API pública `/api/chaves/validar` + cron de expiração automática

---

## ⚡ Comando rápido para iniciar contexto

Em uma nova sessão, para carregar todo o contexto do projeto, rode:

```
/iniciar-contexto
```

---

## Como atualizar os arquivos de contexto

Quando houver mudanças significativas, atualize os arquivos relevantes:
- Nova feature concluída → `planning/releases.md` + `development/features.md`
- Bug encontrado → `development/bugs.md`
- Decisão arquitetural → `context/architecture.md`
- Nova regra de negócio → `knowledge/domain.md`
- Novo endpoint → `knowledge/api.md`
- Mudança no banco → `knowledge/database.md`

---

*Criado em: 2026-05-02 | Atualizado em: 2026-05-13*
