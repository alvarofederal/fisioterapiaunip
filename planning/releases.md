# Courtesyfy — Histórico de Releases

## Versão Atual: 1.0.3

---

## v1.0.3 (Maio 2026)
**Branch:** main | **Status:** Em produção

### Correções e Melhorias
- **Admin impressões:** visualização do arquivo de impressão exatamente como o lojista vê
  (`/dashboard/admin/impressoes/[id]/imprimir`) — sem restrição de lojaId, acesso SUPER_ADMIN
- **Admin impressões:** histórico sempre visível na lista (antes só aparecia com itens)
- **Rate limiting com Upstash Redis:** `src/lib/rate-limit.ts` refatorado para usar Upstash
  sliding window quando configurado; fallback in-memory preservado para dev
- **Register 429:** `/api/register` agora retorna HTTP 429 quando rate limit excedido
  (antes ignorava o resultado de `checkRateLimit`)
- **Auditoria OWASP Top 10** realizada — relatório em `development/improvements.md`

---

## v1.0.2 (Maio 2026)
**Branch:** main | **Status:** Em produção

### Novas Funcionalidades
- **API pública `/api/chaves/validar`** — endpoint REST para PDV/totem externo
  - Autenticação Bearer HMAC-SHA256: `cfy.<lojaId>.<sig>` (sem campo no banco)
  - Ação `consultar`: leitura pura, retorna status + benefício
  - Ação `resgatar`: ATIVADA → RESGATADA em transação + LogEvento
  - Usa `timingSafeEqual` (timing-safe) para comparar assinaturas
- **API Key no dashboard:** lojista vê e copia sua API key em Configurações → API Key
- **Cron de expiração automática:** `GET /api/cron/expirar-chaves`
  - Protegido com `Authorization: Bearer CRON_SECRET`
  - Configurado no `vercel.json` para rodar às 03:00 UTC todos os dias
  - Expira chaves GERADA/ATIVADA de campanhas vencidas + encerra campanhas

### Correções
- **Fix "Zé da Manga":** nome do cliente agora sempre atualiza ao reativar
  (antes bloqueava com `!cliente.nome`)
- **Fix verify-email:** fundo dark + decode correto do e-mail na URL
  (`teste2%40` → `teste2@`)
- **Fix clientes:** seção expandida sem classe de largura limitada

### Infraestrutura
- `CRON_SECRET` e `API_KEY_SECRET` adicionados ao `.env`
- `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` preparados (vazios — aguardando config)

---

## v1.0.1 (Maio 2026)
**Branch:** main | **Status:** Em produção

### Funcionalidades
- **Suite de testes Vitest:** 77 testes (unitários + integração com banco real)
  - Isolamento por `TEST_PREFIX` único por run
  - `fileParallelism: false` para evitar contaminação entre workers
  - Cobertura: banco, geração de chaves, ativação, resgate, segurança, rate limit
- **Admin Stripe expandido:** MRR, renovações nos próximos 7 dias, lojas suspensas,
  lista completa de assinantes, histórico de 12 eventos
- **Admin Stripe produtos:** edição inline, arquivar, criar produtos e preços

### Correções
- Role enum `"ADMIN"` → `"LOJISTA"` nos testes (enum real: `SUPER_ADMIN | LOJISTA | CLIENTE`)
- Comparação BigInt → `Number()` no teste de índices MySQL

---

## v1.0.0-mvp (Maio 2026)
**Branch:** main | **Status:** Em produção — versão de lançamento

### Funcionalidades entregues

**Infraestrutura & Auth:**
- Autenticação completa (Google OAuth + Credentials + verificação de email)
- Schema Prisma: Loja, Campanha, Chave, LoteChave, Resgate, Cliente, LogEvento, Layout
- Design system com dark mode (tokens `dash-*`)
- Separação de layout admin vs lojista

**Loja & Planos:**
- Onboarding de loja (nome, logo, endereço)
- Planos: Essencial (free) / Profissional (R$ 99/mês) / Empresarial (R$ 199/mês)
- Stripe integrado: assinatura com trial de 14 dias
- Webhook Stripe: ativar/suspender ao pagar/cancelar/falhar

**Campanhas:**
- Criação com tipo de benefício, validade, quantidade de chaves e layout visual
- 6 tipos: desconto percentual, desconto fixo, brinde, sorteio, frete grátis, cashback
- Migração de chaves entre campanhas (campanhas vencidas → novas)
- Indicadores visuais de vigência; bloqueio de geração para campanhas expiradas

**Chaves:**
- Geração de lote único (`XXXX-XXXX-XXXX-XXXX`, 30 chars, sem chars ambíguos)
- QR Code por chave → `/c/[codigo]`
- Exportação para impressão A4 + exportação CSV
- Cancelamento individual de chaves

**Layouts de Impressão:**
- Designer visual de layout (cores, imagens, tamanho, estilo)
- 7 tamanhos: MINI, CARTÃO, PADRÃO, CUPOM, VOUCHER, MEIO_A4, MDF
- Múltiplos estilos: GRADIENTE, FLAT, GLASSMORPHISM, NEON, RETRO, ELEGANTE
- Preview em tempo real no editor
- Sistema de solicitação de impressão (lojista solicita → admin gerencia)
- Fluxo de status: PENDENTE → EM_ANALISE → AGUARDANDO_PAGAMENTO → APROVADA → IMPRESSA → ENTREGUE
- PIX configurável pelo admin para cobrança

**Landing page pública da chave:**
- Página `/c/[codigo]` com identidade visual da campanha/loja
- Formulário de ativação (coleta tel/email)
- Email de confirmação ao cliente via Resend

**Validação e Resgate:**
- Tela de validação rápida para operador (balcão)
- Ciclo completo: GERADA → CONSULTADA → ATIVADA → RESGATADA
- Modo totem para auto-atendimento
- Histórico de resgates com data, hora, canal e operador

**Clientes:**
- Listagem com busca por nome/email/telefone
- Detalhe: dados, stats, campanhas participadas, histórico de chaves

**Produtos físicos (kits de impressão):**
- 3 linhas: Papel Offset 240g, MDF Chaveiro 7×3,5cm, MDF Quadrado 9×9cm
- 6 price IDs Stripe; checkout público sem autenticação com allowlist
- Kits na landing page com botões de compra

**Super Admin:**
- Painel principal, lista de lojas, lista de usuários
- Painel Stripe com MRR, assinantes, eventos
- Gerenciamento de produtos/preços Stripe
- Gerenciamento de solicitações de impressão (lista + detalhe + status + preview do arquivo)

---

## Processo de Release

```bash
# Build local antes de qualquer push
npm run build
npm run test

# Push → Vercel faz deploy automático do branch main
git push origin main
```

---

*Atualizado em: 2026-05-20*
