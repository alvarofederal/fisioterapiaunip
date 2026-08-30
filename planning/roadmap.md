# Courtesyfy — Roadmap do Produto

## Visão de Longo Prazo

Tornar o Courtesyfy a plataforma de referência para gestão de campanhas promocionais com
chaves únicas no Brasil — do pequeno lojista ao grande varejista com múltiplas unidades.

---

## MVP + P0 (v1.0.x — Concluído, Maio 2026) ✅

### Infraestrutura
- [x] Autenticação (email + Google OAuth + verificação)
- [x] Schema Prisma completo para o domínio
- [x] Design system dark mode
- [x] Suite de testes Vitest (77 testes)

### Loja & Planos
- [x] Onboarding de loja com logo
- [x] Planos: Essencial / Profissional / Empresarial
- [x] Stripe: assinatura com trial 14 dias + webhook
- [x] Landing page com CTAs para planos e kits físicos

### Campanhas & Chaves
- [x] Criação de campanha (6 tipos de benefício)
- [x] Geração de lote de chaves únicas com QR Code
- [x] Exportação impressão A4 + CSV
- [x] Designer visual de layout (cores, imagens, estilos, tamanhos)
- [x] Migração de chaves entre campanhas

### Fluxo do Cliente
- [x] Landing pública `/c/[codigo]` com identidade da campanha
- [x] Ativação com tel/email + email de confirmação (Resend)
- [x] Validação no balcão + modo totem
- [x] Histórico de resgates

### Clientes
- [x] Listagem com busca + detalhe com histórico

### Produtos Físicos
- [x] 3 linhas de kits; checkout público com allowlist

### Super Admin
- [x] Painel Stripe completo (MRR, assinantes, eventos, produtos)
- [x] Gerenciamento de solicitações de impressão (lista + preview do arquivo)

### API & Automação
- [x] `POST /api/chaves/validar` — API pública para PDV/totem (HMAC-SHA256)
- [x] `GET /api/cron/expirar-chaves` — expiração automática via Vercel Cron (03:00 UTC)
- [x] Rate limiting com Upstash Redis (fallback in-memory)

---

## P1 — Segurança & Estabilidade (v1.1.0 — Próximo)

- [ ] **Headers de segurança HTTP** — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- [ ] **Rate limit no login** — brute-force protection em `/api/auth/login-and-redirect`
- [ ] **Remover logs de debug** — `criar-campanha.ts` e código OTP em `resend-verification`
- [ ] **Upstash Redis em produção** — configurar nas vars da Vercel para rate limit distribuído
- [ ] **Validação de env vars no startup** — Zod schema em `src/lib/env.ts`
- [ ] **Enumeração de e-mail** — padronizar respostas de verify/resend para não vazar existência

---

## P2 — Crescimento de Produto (v1.2.0 — Q3 2026)

- [ ] **Gráficos no dashboard** — taxa de ativação, conversão, resgates por período (Recharts)
- [ ] **Filtros avançados** — por status, campanha, período, lote nas listagens de chaves
- [ ] **Portal Stripe do lojista** — autogestão de assinatura (upgrade/downgrade/cancelar)
- [ ] **Cache ISR nas páginas públicas** — `/c/[codigo]` com `revalidate: 60`
- [ ] **Paginação cursor-based** — resgates, chaves, clientes
- [ ] **Email de boas-vindas** ao novo lojista pós-onboarding
- [ ] **Notificação ao lojista** quando chave é resgatada (email ou push)
- [ ] **Cancelamento em lote** de chaves pelo lojista

---

## P3 — Expansão (Q4 2026+)

- [ ] **LGPD** — exportação e exclusão de dados do cliente
- [ ] **2FA TOTP** para lojistas (Google Authenticator / Authy)
- [ ] **Logging estruturado de segurança** — falhas de auth, API key inválida, acesso negado
- [ ] **Documentação OpenAPI** da API pública
- [ ] **Testes E2E** com Playwright
- [ ] **Duplicar campanha** (clonar configurações)
- [ ] **Importação de lotes via CSV**
- [ ] **QR Code customizado** com logo da loja

---

## P4 — Escala & White-label (2027+)

- [ ] White-label por loja (domínio customizado)
- [ ] Multi-unidade e franquias (uma conta, várias lojas)
- [ ] API de integração com ecommerce (WooCommerce, Shopify)
- [ ] Sorteio automatizado no fechamento da campanha
- [ ] App mobile para operadores (PWA ou React Native)
- [ ] Relatórios com BI embutido

---

## KPIs a Monitorar

- Lojas cadastradas e ativas (assinatura paga)
- MRR (receita recorrente mensal)
- Campanhas ativas no período
- Taxa de ativação: chaves ativadas / geradas
- Taxa de conversão: chaves resgatadas / ativadas
- Churn de assinaturas
- Volume de kits físicos vendidos

---

*Atualizado em: 2026-05-20*
