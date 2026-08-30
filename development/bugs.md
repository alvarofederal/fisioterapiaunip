# Courtesyfy — Bugs e Issues

## Como usar este arquivo

Registre bugs conhecidos aqui com contexto suficiente para reproduzir e corrigir.
Severidade: 🔴 Crítico (quebra funcionalidade) | 🟠 Alto (impacta UX/segurança) | 🟡 Médio | 🟢 Baixo

---

## Bugs Ativos

### [SEC-01] Código OTP logado em texto puro nos logs
**Severidade:** 🟠 Alto (segurança)
**Status:** Identificado
**Data:** 2026-05-20

**Descrição:**
`src/app/api/resend-verification/route.ts:89` contém:
```
console.log("✅ Código reenviado para:", email, "Novo código:", verificationCode)
```
Qualquer pessoa com acesso aos logs do Vercel vê os códigos OTP de verificação em texto puro.

**Correção:** Remover a linha ou substituir por `console.log("✅ Código reenviado para:", email)`.

---

### [SEC-02] Sem rate limit no endpoint de login
**Severidade:** 🟠 Alto (segurança)
**Status:** Identificado
**Data:** 2026-05-20

**Descrição:**
`POST /api/auth/login-and-redirect` não tem rate limiting. Permite brute-force de senhas
sem limitação. O provider Credentials do NextAuth também não tem proteção por tentativa.

**Correção:** Adicionar `checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)` no início do handler.

---

### [SEC-03] console.log de debug em produção
**Severidade:** 🟡 Médio (info leakage)
**Status:** Identificado
**Data:** 2026-05-20

**Descrição:**
`src/app/(panel)/dashboard/campanhas/_actions/criar-campanha.ts` tem 12 `console.log`
de debug que ficam visíveis nos logs do Vercel em produção, incluindo:
- `session.user.id` e `session.user.lojaId`
- Conteúdo completo do formData

**Correção:** Remover todos os `console.log` de debug. Manter apenas `console.error` no catch.

---

### [SEC-04] allowDangerousEmailAccountLinking habilitado
**Severidade:** 🟡 Médio (segurança)
**Status:** Identificado — avaliar risco
**Data:** 2026-05-20

**Descrição:**
`src/lib/auth.ts` tem `allowDangerousEmailAccountLinking: true` para Google e GitHub.
Permite que um atacante com conta Google/GitHub do mesmo e-mail assuma a conta de um lojista.

**Localização:** `src/lib/auth.ts:142-143`

**Decisão necessária:** Remover flag e exigir que usuário já esteja logado antes de vincular
conta OAuth, ou aceitar o risco dado que e-mail verificado é exigido.

---

### [DOM-01] Domínio produção redirecionando para vercel.app
**Severidade:** 🟠 Alto (credibilidade)
**Status:** Identificado — correção manual no painel Vercel
**Data:** 2026-05-20

**Descrição:**
`courtesyfy.com.br` está redirecionando para `courtesyfy.vercel.app`.
O problema é de configuração de domínio na Vercel, não no código.

**Correção:**
1. Vercel → projeto → Settings → Domains → definir `courtesyfy.com.br` como Primary Domain
2. Vercel → Settings → Environment Variables → garantir que `NEXTAUTH_URL=https://courtesyfy.com.br`
3. Redeploy após salvar as variáveis

---

## Issues de Performance Conhecidas

- Potencial N+1 em queries de listagem de chaves (monitorar com crescimento)
- Falta de cache (ISR) nas páginas públicas `/c/[codigo]`
- Resgates com `take: 50` hardcoded — falta paginação real

---

## Issues de UX Conhecidas

- Mobile: algumas telas do dashboard ainda não estão totalmente otimizadas
- Formulários longos sem auto-save (dados perdidos se página fechar)

---

## Bugs Resolvidos

### Domínio produção (cortesias) redirecionando
**Severidade:** 🟠
**Resolvido em:** (aguardando ação manual na Vercel)

### Fix: email codificado na URL de verificação
**Severidade:** 🟠
**Resolvido em:** Maio 2026
**Descrição:** Página `/verify-email` exibia `teste2%40courtesyfy.com` em vez de `teste2@courtesyfy.com`.
Corrigido com `decodeURIComponent` e fundo dark.

### Fix: nome do cliente não atualizava (bug "Zé da Manga")
**Severidade:** 🟠
**Resolvido em:** Maio 2026
**Descrição:** `ativar-chave.ts` usava `else if (nome && !cliente.nome)` — só atualizava o nome
se o campo estivesse vazio. Corrigido para sempre atualizar quando fornecido.
**Arquivo:** `src/app/c/[codigo]/_actions/ativar-chave.ts`

### Register não retornava 429
**Severidade:** 🟡
**Resolvido em:** Maio 2026
**Descrição:** `checkRateLimit` era chamado mas o retorno `allowed` era ignorado.
Corrigido para retornar 429 quando `allowed === false`.
**Arquivo:** `src/app/api/register/route.ts`

### Role SUPER_ADMIN na tela de produtos Stripe
**Severidade:** 🔴
**Resolvido em:** Maio 2026
**Descrição:** Página `/dashboard/admin/stripe/produtos` usava `"ADMIN"` em vez de `"SUPER_ADMIN"`.

### Testes: contaminação entre workers paralelos
**Severidade:** 🟠
**Resolvido em:** Maio 2026
**Descrição:** `limparDadosTeste` usava prefixo fixo `"TEST_"`, apagando dados de outros workers.
Corrigido com `TEST_PREFIX` único por run + `fileParallelism: false` no Vitest.

---

*Atualizado em: 2026-05-20*
