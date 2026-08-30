# Courtesyfy — Melhorias Técnicas Planejadas

## O que é este arquivo?

Diferente de features (novas funcionalidades) e bugs (correções), este arquivo lista melhorias
técnicas — refactorings, otimizações de performance, segurança, DX e qualidade de código.

---

## 🔴 Críticas (fazer logo)

### Headers de Segurança HTTP
**Tipo:** Segurança (OWASP A05)
**Status:** Identificado na auditoria OWASP — 2026-05-20
**Descrição:** O `next.config.ts` não define nenhum header de segurança. Sem CSP, XSS pode
executar scripts. Sem X-Frame-Options, a aplicação pode ser embutida em iframe (clickjacking).

```typescript
// next.config.ts
async headers() {
  return [{
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options",           value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options",    value: "nosniff" },
      { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy",   value: "default-src 'self'; ..." },
    ]
  }]
}
```

### Rate Limit no Login
**Tipo:** Segurança (OWASP A07)
**Status:** Pendente
**Descrição:** `POST /api/auth/login-and-redirect` permite brute-force sem limitação.
**Ação:** Adicionar `checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)`.

---

## 🟠 Alta Prioridade

### Cache de Páginas Públicas (ISR)
**Tipo:** Performance
**Descrição:** `/c/[codigo]` é pública e muito acessada. Cada acesso bate no banco.
ISR com revalidação curta reduziria latência e carga.

```typescript
// page.tsx da chave pública
export const revalidate = 60 // revalida a cada 60s
```

**Atenção:** Chaves mudam de status (GERADA → ATIVADA → RESGATADA). Revalidação curta
(30-60s) é aceitável — o risco de servir status desatualizado por 1 minuto é baixo.

### Validação de Variáveis de Ambiente no Startup
**Tipo:** Segurança / DX
**Descrição:** Falha silenciosa quando env var ausente. Zod pode validar no startup.

```typescript
// src/lib/env.ts
import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL:            z.string().url(),
  AUTH_SECRET:             z.string().min(32),
  API_KEY_SECRET:          z.string().min(32),
  CRON_SECRET:             z.string().min(32),
  STRIPE_SECRET_KEY:       z.string().startsWith("sk_"),
  STRIPE_SECRET_WEBHOOK_KEY: z.string().startsWith("whsec_"),
  RESEND_API_KEY:          z.string().startsWith("re_"),
})

export const env = envSchema.parse(process.env)
```

### Paginação Real nas Listagens
**Tipo:** Performance / UX
**Descrição:** Resgates tem `take: 50` hardcoded. Com crescimento, listagens de chaves e
clientes podem ficar lentas. Implementar paginação cursor-based.

### Logging Estruturado de Eventos de Segurança
**Tipo:** Segurança (OWASP A09) / Observabilidade
**Descrição:** Não há registro de: logins com falha, tentativas de acesso negado, uso
inválido de API keys. Fundamental para detectar ataques.
**Sugestão:** Logar em `LogEvento` com `tipoEvento: "AUTH_FAILED"` | `"ACCESS_DENIED"` | `"API_KEY_INVALID"`.

---

## 🟡 Média Prioridade

### Queries Prisma com `select` explícito
**Tipo:** Performance
**Descrição:** Algumas queries buscam o objeto inteiro quando precisam de poucos campos.
**Padrão:** Sempre usar `select: { campo1: true }` ou `include` com `select` aninhado.

### Tratamento de Erros Padronizado
**Tipo:** DX / Qualidade
**Descrição:** Server Actions retornam objetos diferentes (`{ error }`, `{ fieldErrors }`, `{ ok }`).
Padronizar melhora previsibilidade.

```typescript
type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
```

### LGPD — Export e Delete de Dados do Cliente
**Tipo:** Legal / Segurança
**Descrição:** Clientes têm direito de solicitar exportação e exclusão de seus dados.
Implementar endpoints ou fluxo admin para atender solicitações LGPD.

### 2FA para Lojistas (TOTP)
**Tipo:** Segurança
**Descrição:** Segundo fator de autenticação via app autenticador (Google Authenticator, Authy).
Biblioteca: `otplib`.

### Upstash Redis configurado em produção
**Tipo:** Infraestrutura / Segurança
**Descrição:** Rate limiting atual usa fallback in-memory — não persiste entre instâncias serverless.
Em produção com múltiplas instâncias, o limite pode ser contornado.
**Ação:** Criar banco Redis no Upstash e configurar `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` na Vercel.

---

## 🟢 Baixa Prioridade

### Documentação OpenAPI da API pública
**Tipo:** DX
**Descrição:** Documentar `/api/chaves/validar` com swagger/OpenAPI para facilitar integração
por lojistas técnicos e parceiros.

### Testes E2E (Playwright)
**Tipo:** Qualidade
**Descrição:** Testes unitários e de integração existem (77 testes). Adicionar E2E cobrindo:
fluxo de ativação de chave pelo cliente, login + criar campanha + gerar lote.

### Otimização de Queries N+1
**Tipo:** Performance
**Descrição:** Listagem de chaves com clientes pode gerar N+1. Monitorar com Prisma query log
em dev e adicionar `include` otimizados conforme necessário.

---

## Auditoria de Segurança OWASP (2026-05-20)

Resultado completo da auditoria contra OWASP Top 10 2021 + ASVS v4 + CWE/SANS Top 25:

| Categoria | Status | Observação |
|-----------|--------|-----------|
| A01 Broken Access Control | ✅ Bom | Tenant isolation correto em todas as actions |
| A02 Cryptographic Failures | ✅ Bom | bcrypt custo 12, HMAC-SHA256, timingSafeEqual |
| A03 Injection | ✅ Excelente | Prisma ORM, Zod em todos os inputs, sem SQL raw |
| A04 Insecure Design | ⚠️ Atenção | Enumeração de e-mail em verify/resend |
| A05 Security Misconfiguration | ⚠️ Médio | Faltam headers HTTP; console.log de debug |
| A06 Vulnerable Components | ✅ OK | Dependências atuais; rodar `npm audit` periodicamente |
| A07 Auth Failures | ⚠️ Atenção | **Sem rate limit no login** |
| A08 Data Integrity | ✅ Bom | Webhook Stripe assinado; allowlist de priceId |
| A09 Logging & Monitoring | ⚠️ Atenção | Sem log de eventos de segurança |
| A10 SSRF | ✅ OK | fetch externo apenas em PDF (URLs do banco) |

---

*Atualizado em: 2026-05-20*
