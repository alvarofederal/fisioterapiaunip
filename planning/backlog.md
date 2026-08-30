# Courtesyfy — Backlog de Funcionalidades

## Como usar este arquivo

Adicione itens aqui quando surgir nova ideia ou necessidade.
Mova para `features.md` quando iniciar o desenvolvimento.
Prioridades: 🔴 Crítico | 🟠 Alta | 🟡 Média | 🟢 Baixa

---

## Em Andamento Agora

→ ver `development/features.md`

---

## Próximos a Iniciar (P1 — Segurança)

### 🔴 Rate limit no endpoint de login
**Descrição:** `POST /api/auth/login-and-redirect` sem proteção contra brute-force.
Adicionar `checkRateLimit` com limite de 10 tentativas/15 min por IP.
**Arquivo:** `src/app/api/auth/login-and-redirect/route.ts`

### 🔴 Remover log de código OTP em texto puro
**Descrição:** `resend-verification/route.ts:89` loga o código de verificação nos logs do Vercel.
**Arquivo:** `src/app/api/resend-verification/route.ts`

### 🟠 Headers de segurança HTTP
**Descrição:** Adicionar CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy no `next.config.ts`.

### 🟠 Upstash Redis em produção
**Descrição:** Configurar `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` na Vercel para
rate limit distribuído funcionar entre instâncias serverless.

### 🟠 Limpar console.log de debug em produção
**Descrição:** `criar-campanha.ts` tem 12 logs com dados de sessão e formulário visíveis nos logs da Vercel.

---

## Backlog Geral

### UX/UI
- 🟡 Onboarding interativo com tour guiado para novos lojistas
- 🟡 Melhorar responsividade mobile do dashboard
- 🟡 Notificação ao lojista quando chave é resgatada (email/push)
- 🟡 Email de boas-vindas pós-onboarding com links rápidos
- 🟢 Animações de transição entre páginas

### Campanhas e Chaves
- 🟡 Cancelamento em lote de chaves pelo lojista
- 🟡 Duplicar campanha (clonar configurações)
- 🟡 Filtros avançados: por status, campanha, período, lote
- 🟡 Paginação real cursor-based (resgates, chaves, clientes)
- 🟡 Múltiplos layouts por campanha (A/B)
- 🟡 Importação de lotes via CSV
- 🟢 QR Code customizado com logo da loja

### Relatórios e Métricas
- 🟡 Gráficos: taxa de ativação, conversão, resgates por período (Recharts já instalado)
- 🟡 Filtros por período nos relatórios
- 🟡 Export CSV dos relatórios
- 🟡 Gráfico de resgates por hora do dia

### Clientes
- 🟡 Re-envio de email com código para o cliente
- 🟡 Área do cliente com histórico de chaves (portal público)
- 🟢 Integração WhatsApp Business API (envio de código por mensagem)

### Faturamento
- 🟡 Portal Stripe do lojista — upgrade/downgrade/cancelar assinatura sem sair do dashboard

### Administrativo
- 🟡 Logs de auditoria de segurança (falhas de auth, API key inválida)
- 🟡 Sistema de suporte/tickets integrado
- 🟢 Métricas de uso por plano (para calibrar pricing)

### Performance
- 🟡 Cache ISR em `/c/[codigo]` (`revalidate: 60`)
- 🟡 Paginação cursor-based nas listagens longas
- 🟢 Otimização de queries N+1 monitoradas

### Segurança
- 🟠 Validação de env vars no startup (Zod em `src/lib/env.ts`)
- 🟠 LGPD — exportação e exclusão de dados de clientes
- 🟡 2FA para lojistas (TOTP — `otplib`)
- 🟡 Padronizar respostas de verify/resend (evitar enumeração de e-mail)
- 🟡 Avaliar remoção de `allowDangerousEmailAccountLinking`

### Documentação e Qualidade
- 🟡 Documentação OpenAPI da API pública `/api/chaves/validar`
- 🟡 Testes E2E com Playwright (fluxo ativação + login + criar campanha)

---

## Ideias Futuras (não priorizadas)

- White-label por loja (domínio customizado: cortesias.minhaloja.com.br)
- Multi-unidade e franquias (uma conta, várias lojas)
- API de integração com ecommerce (WooCommerce, Shopify)
- Sorteio automatizado no fechamento da campanha
- Programa de indicação entre lojistas
- App mobile para operadores (validação offline — PWA ou React Native)
- Relatórios avançados com BI embutido

---

*Atualizado em: 2026-05-20*
