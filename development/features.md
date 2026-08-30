# Courtesyfy — Features em Desenvolvimento

## Como usar este arquivo

Liste aqui as features que estão **ativamente em desenvolvimento**.
Quando concluir, mova o item para `releases.md`.

---

## 🔴 Em Andamento

### Headers de segurança HTTP
**Prioridade:** Alta
**Contexto:**
Auditoria OWASP identificou ausência de CSP, X-Frame-Options, X-Content-Type-Options, etc.
Adicionar no `next.config.ts` via função `headers()`.

**Progresso:**
- [ ] `Content-Security-Policy`
- [ ] `X-Frame-Options: SAMEORIGIN`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy`

### Rate limit no login
**Prioridade:** Alta
**Contexto:**
`POST /api/auth/login-and-redirect` não tem rate limiting — vulnerável a brute-force.
**Progresso:**
- [ ] Adicionar `checkRateLimit` em `login-and-redirect/route.ts`
- [ ] Limite sugerido: 10 tentativas / 15 min por IP

### Remover log de código de verificação
**Prioridade:** Alta
**Contexto:**
`resend-verification/route.ts:89` loga o código OTP em texto puro nos logs do Vercel.
- [ ] Remover `console.log("Novo código:", verificationCode)`

### Limpar console.log de debug em produção
**Prioridade:** Média
**Contexto:**
`criar-campanha.ts` tem 12 console.log de debug com IDs de sessão e dados do formulário.
- [ ] Remover todos os logs de debug ou trocar por `console.error` apenas no catch

---

## ✅ Concluídas Recentemente

### Rate limiting com Upstash Redis
**Concluído:** Maio 2026
**Descrição:** Refatorado `src/lib/rate-limit.ts` para usar Upstash Redis sliding window quando
`UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` estão configurados. Fallback in-memory
preservado para dev/testes. Register retorna 429 corretamente.
**Arquivos:** `src/lib/rate-limit.ts`, `src/lib/upstash.ts`, `src/app/api/register/route.ts`

### Admin — visualização do arquivo de impressão
**Concluído:** Maio 2026
**Descrição:** Admin pode ver exatamente o arquivo de impressão do lojista (cards + QR codes)
em `/dashboard/admin/impressoes/[id]/imprimir` sem restrição de lojaId. Botão "Ver arquivo
de impressão" no detalhe da solicitação. Histórico sempre visível na lista admin.
**Arquivos:** `src/app/(panel)/dashboard/admin/impressoes/[id]/imprimir/page.tsx`

### API pública `/api/chaves/validar`
**Concluído:** Maio 2026
**Descrição:** Endpoint REST para PDV/totem externo validar e resgatar chaves sem usar o dashboard.
Autenticação via Bearer HMAC-SHA256 (`cfy.<lojaId>.<sig>`). Ações: `consultar` (leitura pura)
e `resgatar` (ATIVADA → RESGATADA em transação). API key visível em Configurações.
**Arquivos:** `src/app/api/chaves/validar/route.ts`, `src/lib/api-key.ts`,
`src/app/(panel)/dashboard/configuracoes/_components/api-key-card.tsx`

### Cron de expiração automática
**Concluído:** Maio 2026
**Descrição:** `GET /api/cron/expirar-chaves` protegido com `CRON_SECRET`. Roda todos os dias
às 03:00 UTC via Vercel Cron (configurado em `vercel.json`). Expira chaves e encerra campanhas vencidas.
**Arquivos:** `src/app/api/cron/expirar-chaves/route.ts`, `vercel.json`

### Suite de testes de integração (Vitest)
**Concluído:** Maio 2026
**Descrição:** 77 testes cobrindo banco de dados, geração de chaves, ativação, segurança e rate limit.
Testes isolados por `TEST_PREFIX` único por run. `fileParallelism: false` para evitar contaminação.
**Arquivos:** `tests/`, `vitest.config.ts`

### Fix: nome do cliente não atualizava (bug "Zé da Manga")
**Concluído:** Maio 2026
**Descrição:** `ativar-chave.ts` só atualizava o nome se `!cliente.nome`. Corrigido para sempre
atualizar nome quando fornecido, preservando telefone/email como chaves de busca.
**Arquivo:** `src/app/c/[codigo]/_actions/ativar-chave.ts`

### Gerenciamento de produtos Stripe no dashboard
**Concluído:** Maio 2026
**Descrição:** Tela `/dashboard/admin/stripe/produtos` com edição inline de nome/descrição,
nickname de preços, arquivar e criar produtos/preços.
**Arquivos:** `src/app/(panel)/dashboard/admin/stripe/produtos/`

### Tela de Clientes
**Concluído:** Maio 2026
**Descrição:** Lista de clientes com busca por nome/email/telefone e detalhe por cliente
com histórico completo de chaves, stats e campanhas participadas.
**Arquivos:** `src/app/(panel)/dashboard/clientes/`

---

## ⏸️ Pausadas / Em Espera

*Nenhuma no momento.*

---

*Atualizado em: 2026-05-20*
