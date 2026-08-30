import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import {
  CheckCircle2, XCircle, AlertTriangle, ExternalLink,
  Zap, CreditCard, Webhook, Users, ChevronRight, Copy,
  TrendingUp, Clock, Ban, Activity, RefreshCw, Printer,
} from "lucide-react"

// ─── Helpers ──────────────────────────────────────────────────────

function fmt(amount: number | null, currency: string) {
  if (amount === null) return "—"
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("pt-BR")
}

function fmtDateTime(ts: number) {
  return new Date(ts * 1000).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  })
}

function diasRestantes(d: Date) {
  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000)
  if (diff <= 0) return "Hoje"
  if (diff === 1) return "Amanhã"
  return `${diff} dias`
}

function maskKey(key: string | undefined): string {
  if (!key) return "Não configurada"
  if (key.length <= 12) return "***"
  return `${key.slice(0, 8)}...${key.slice(-4)}`
}

const PLANO_LABELS: Record<string, string> = {
  ESSENCIAL:    "Essencial",
  PROFISSIONAL: "Profissional",
  EMPRESARIAL:  "Empresarial",
}

const EVENT_META: Record<string, { label: string; color: "emerald" | "red" | "amber" | "blue" | "gray" }> = {
  "checkout.session.completed":           { label: "Checkout concluído",     color: "emerald" },
  "invoice.payment_succeeded":            { label: "Pagamento recebido",     color: "emerald" },
  "invoice.payment_failed":               { label: "Pagamento falhou",       color: "red"     },
  "customer.subscription.deleted":        { label: "Assinatura cancelada",   color: "red"     },
  "customer.subscription.trial_will_end": { label: "Trial encerrando",       color: "amber"   },
  "customer.subscription.updated":        { label: "Assinatura atualizada",  color: "blue"    },
  "customer.created":                     { label: "Cliente criado",         color: "blue"    },
}

const COLOR_CLS = {
  emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30",
  red:     "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30",
  amber:   "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30",
  blue:    "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30",
  gray:    "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/50 border border-gray-200 dark:border-white/[0.08]",
}

// ─── Componentes visuais ──────────────────────────────────────────

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
      ok ? COLOR_CLS.emerald : COLOR_CLS.red
    }`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </span>
  )
}

function EventBadge({ type }: { type: string }) {
  const meta = EVENT_META[type]
  const color = meta?.color ?? "gray"
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${COLOR_CLS[color]}`}>
      {meta?.label ?? type}
    </span>
  )
}

// ─── Page ────────────────────────────────────────────────────────

export default async function AdminStripePage() {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard")

  const appUrl    = process.env.NEXTAUTH_URL ?? "https://courtesyfy.com.br"
  const webhookUrl = `${appUrl}/api/webhook`
  const agora     = new Date()
  const setesDias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000)

  // ── 1. Testar conexão com Stripe ─────────────────────────────
  let stripeAccount: { mode: string } | null = null
  let stripeError: string | null = null
  try {
    await stripe.customers.list({ limit: 1 })
    const isLive = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_")
    stripeAccount = { mode: isLive ? "Produção (Live)" : "Teste (Test)" }
  } catch (err) {
    stripeError = err instanceof Error ? err.message : "Erro desconhecido"
  }

  // ── 2. Detalhes dos planos no Stripe ─────────────────────────
  const planConfig = [
    { plano: "ESSENCIAL",    priceId: null,                                 label: "Essencial",    cor: "gray"    as const },
    { plano: "PROFISSIONAL", priceId: process.env.STRIPE_PLAN_PROFESSIONAL, label: "Profissional", cor: "emerald" as const },
    { plano: "EMPRESARIAL",  priceId: process.env.STRIPE_PLAN_EMPRESARIAL,  label: "Empresarial",  cor: "violet"  as const },
  ]

  const planosComDetalhes = await Promise.all(
    planConfig.map(async (p) => {
      if (!p.priceId || !stripeAccount) return { ...p, price: null as null | Awaited<ReturnType<typeof stripe.prices.retrieve>>, product: null as null | { name: string; description: string | null } }
      try {
        const price   = await stripe.prices.retrieve(p.priceId, { expand: ["product"] })
        const product = price.product as { name: string; description: string | null }
        return { ...p, price, product }
      } catch {
        return { ...p, price: null, product: null }
      }
    })
  )

  // ── 3. Produtos de impressão ─────────────────────────────────
  const impressaoGrupos = [
    {
      grupo: "Papel Offset 240g",
      cor: "emerald" as const,
      kits: [
        { key: "IMPRESSAO_KIT50",  label: "Kit 50 cards",  priceId: process.env.STRIPE_PRICE_IMPRESSAO_KIT50  },
        { key: "IMPRESSAO_KIT100", label: "Kit 100 cards", priceId: process.env.STRIPE_PRICE_IMPRESSAO_KIT100 },
      ],
    },
    {
      grupo: "MDF Chaveiro 7×3,5cm",
      cor: "amber" as const,
      kits: [
        { key: "CHAVEIRO_KIT10",  label: "Kit 10 peças",  priceId: process.env.STRIPE_PRICE_CHAVEIRO_KIT10  },
        { key: "CHAVEIRO_KIT100", label: "Kit 100 peças", priceId: process.env.STRIPE_PRICE_CHAVEIRO_KIT100 },
      ],
    },
    {
      grupo: "MDF Quadrado 9×9cm",
      cor: "blue" as const,
      kits: [
        { key: "MDF_QUAD_KIT10", label: "Kit 10 peças", priceId: process.env.STRIPE_PRICE_MDF_QUADRADO_KIT10 },
        { key: "MDF_QUAD_KIT50", label: "Kit 50 peças", priceId: process.env.STRIPE_PRICE_MDF_QUADRADO_KIT50 },
      ],
    },
  ]

  const kitsComDetalhes = await Promise.all(
    impressaoGrupos.map(async (g) => ({
      ...g,
      kits: await Promise.all(
        g.kits.map(async (k) => {
          if (!k.priceId || !stripeAccount) return { ...k, price: null as null | Awaited<ReturnType<typeof stripe.prices.retrieve>>, product: null as null | { name: string; description: string | null } }
          try {
            const price   = await stripe.prices.retrieve(k.priceId, { expand: ["product"] })
            const product = price.product as { name: string; description: string | null }
            return { ...k, price, product }
          } catch {
            return { ...k, price: null, product: null }
          }
        })
      ),
    }))
  )

  // ── 4. Stats do banco ────────────────────────────────────────
  const [
    totalLojas,
    lojasAtivas,
    lojasSuspensas,
    lojasAtivasProf,
    lojasAtivasEmp,
    todasComAssinatura,
    renovacoesProximas,
    lojasSuspensasLista,
    lojasFreeTier,
  ] = await Promise.all([
    db.loja.count(),
    db.loja.count({ where: { status: "ATIVA", stripeCurrentPeriodEnd: { gt: agora } } }),
    db.loja.count({ where: { status: "SUSPENSA" } }),

    // pagantes reais (para cálculo de MRR)
    db.loja.count({ where: { plano: "PROFISSIONAL", status: "ATIVA", stripeCurrentPeriodEnd: { gt: agora } } }),
    db.loja.count({ where: { plano: "EMPRESARIAL",  status: "ATIVA", stripeCurrentPeriodEnd: { gt: agora } } }),

    // todas com assinatura Stripe (para tabela completa)
    db.loja.findMany({
      where: { stripeSubscriptionId: { not: null } },
      orderBy: { stripeCurrentPeriodEnd: "asc" },
      take: 100,
      select: {
        id: true, nome: true, email: true, plano: true,
        status: true, stripeCurrentPeriodEnd: true,
        stripeSubscriptionId: true, stripeCustomerId: true,
      },
    }),

    // renovações nos próximos 7 dias
    db.loja.findMany({
      where: {
        stripeSubscriptionId: { not: null },
        stripeCurrentPeriodEnd: { gte: agora, lte: setesDias },
        status: "ATIVA",
      },
      orderBy: { stripeCurrentPeriodEnd: "asc" },
      select: { id: true, nome: true, email: true, plano: true, stripeCurrentPeriodEnd: true, stripeSubscriptionId: true },
    }),

    // lojas suspensas com assinatura
    db.loja.findMany({
      where: { status: "SUSPENSA", stripeSubscriptionId: { not: null } },
      orderBy: { atualizadoEm: "desc" },
      take: 10,
      select: { id: true, nome: true, email: true, plano: true, atualizadoEm: true, stripeSubscriptionId: true },
    }),

    // lojas no plano gratuito (sem assinatura)
    db.loja.count({ where: { stripeSubscriptionId: null } }),
  ])

  // ── 4. MRR estimado ──────────────────────────────────────────
  const profData = planosComDetalhes.find(p => p.plano === "PROFISSIONAL")
  const empData  = planosComDetalhes.find(p => p.plano === "EMPRESARIAL")
  const profCents = profData?.price?.unit_amount ?? 0
  const empCents  = empData?.price?.unit_amount  ?? 0
  const mrrCents  = lojasAtivasProf * profCents + lojasAtivasEmp * empCents
  const mrrCurrency = profData?.price?.currency ?? "brl"
  const mrrStr    = mrrCents > 0 ? fmt(mrrCents, mrrCurrency) : "—"

  // ── 5. Eventos recentes do Stripe ────────────────────────────
  let recentEvents: Array<{ id: string; type: string; created: number }> = []
  if (stripeAccount) {
    try {
      const evts = await stripe.events.list({ limit: 12 })
      recentEvents = evts.data.map(e => ({ id: e.id, type: e.type, created: e.created }))
    } catch { /* ignora */ }
  }

  // ── 6. Webhook config ────────────────────────────────────────
  const webhookSecretOk = !!process.env.STRIPE_SECRET_WEBHOOK_KEY
  const isLive = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_")

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="w-full">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-5 h-5 text-emerald-500" />
          <h1 className="text-2xl font-bold dash-title">Stripe — Cobrança</h1>
          {stripeAccount && (
            <span className={`ml-2 text-xs font-bold px-2.5 py-0.5 rounded-full ${
              isLive
                ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400"
            }`}>
              {stripeAccount.mode}
            </span>
          )}
        </div>
        <p className="dash-muted text-sm">Gerencie a integração com o Stripe, planos e assinaturas das lojas.</p>
      </div>

      <div className="space-y-6">

        {/* ── MRR + KPIs ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

          {/* MRR — destaque */}
          <div className="col-span-2 sm:col-span-1 dash-card p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-semibold dash-muted uppercase tracking-wide">MRR Estimado</span>
            </div>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{mrrStr}</p>
            <p className="text-xs dash-muted mt-1.5">
              {lojasAtivasProf + lojasAtivasEmp} loja{lojasAtivasProf + lojasAtivasEmp !== 1 ? "s" : ""} pagante{lojasAtivasProf + lojasAtivasEmp !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Ativos */}
          <div className="dash-card p-5">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-semibold dash-muted uppercase tracking-wide">Ativos</span>
            </div>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{lojasAtivas}</p>
            <p className="text-xs dash-muted mt-1.5">com assinatura válida</p>
          </div>

          {/* Suspensas */}
          <div className="dash-card p-5">
            <div className="flex items-center gap-1.5 mb-2">
              <Ban className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-semibold dash-muted uppercase tracking-wide">Suspensas</span>
            </div>
            <p className={`text-3xl font-black ${lojasSuspensas > 0 ? "text-red-500 dark:text-red-400" : "dash-title"}`}>{lojasSuspensas}</p>
            <p className="text-xs dash-muted mt-1.5">pagamento falhou</p>
          </div>

          {/* Gratuitas */}
          <div className="dash-card p-5">
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="w-3.5 h-3.5 text-gray-400 dark:text-white/30" />
              <span className="text-xs font-semibold dash-muted uppercase tracking-wide">Essencial</span>
            </div>
            <p className="text-3xl font-black dash-title">{lojasFreeTier}</p>
            <p className="text-xs dash-muted mt-1.5">de {totalLojas} lojas cadastradas</p>
          </div>
        </div>

        {/* ── ALERTAS: RENOVAÇÕES PRÓXIMAS ───────────────────────── */}
        {renovacoesProximas.length > 0 && (
          <div className="dash-card p-5 border-amber-200 dark:border-amber-500/30">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold dash-title">Renovações nos próximos 7 dias</h2>
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                {renovacoesProximas.length} loja{renovacoesProximas.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-2">
              {renovacoesProximas.map((loja) => (
                <div key={loja.id} className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/[0.06] border border-amber-100 dark:border-amber-500/20">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium dash-subtitle truncate">{loja.nome}</p>
                    <p className="text-xs dash-muted truncate">{loja.email}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      {loja.stripeCurrentPeriodEnd ? diasRestantes(loja.stripeCurrentPeriodEnd) : "—"}
                    </span>
                    <span className="text-xs dash-muted hidden sm:block">
                      {loja.stripeCurrentPeriodEnd ? fmtDate(loja.stripeCurrentPeriodEnd) : "—"}
                    </span>
                    <span className="text-xs font-semibold dash-muted">{PLANO_LABELS[loja.plano]}</span>
                    {loja.stripeSubscriptionId && (
                      <a
                        href={`https://dashboard.stripe.com/${isLive ? "" : "test/"}subscriptions/${loja.stripeSubscriptionId}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-amber-500 hover:text-amber-600 transition-colors"
                        title="Ver no Stripe"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ALERTAS: LOJAS SUSPENSAS ────────────────────────────── */}
        {lojasSuspensasLista.length > 0 && (
          <div className="dash-card p-5 border-red-200 dark:border-red-500/30">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h2 className="font-semibold dash-title">Lojas suspensas por inadimplência</h2>
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                {lojasSuspensasLista.length}
              </span>
            </div>
            <div className="space-y-2">
              {lojasSuspensasLista.map((loja) => (
                <div key={loja.id} className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/[0.06] border border-red-100 dark:border-red-500/20">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium dash-subtitle truncate">{loja.nome}</p>
                    <p className="text-xs dash-muted truncate">{loja.email}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-semibold dash-muted">{PLANO_LABELS[loja.plano]}</span>
                    {loja.stripeSubscriptionId && (
                      <a
                        href={`https://dashboard.stripe.com/${isLive ? "" : "test/"}subscriptions/${loja.stripeSubscriptionId}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-red-400 hover:text-red-500 transition-colors"
                        title="Ver no Stripe"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <Link href={`/dashboard/lojas/${loja.id}`} className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline">
                      Ver loja
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PLANOS CONFIGURADOS ─────────────────────────────────── */}
        <div className="dash-card p-5">
          <h2 className="font-semibold dash-title flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-emerald-500" />
            Planos configurados
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {planosComDetalhes.map((p) => {
              const borderMap = { emerald: "border-emerald-200 dark:border-emerald-500/30", violet: "border-violet-200 dark:border-violet-500/30", gray: "border-gray-200 dark:border-white/[0.08]" } as const
              const badgeMap  = { emerald: COLOR_CLS.emerald, violet: "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30", gray: COLOR_CLS.gray } as const
              const cor = p.cor === "violet" ? "violet" : p.cor === "emerald" ? "emerald" : "gray"
              const activeCount = p.plano === "PROFISSIONAL" ? lojasAtivasProf : p.plano === "EMPRESARIAL" ? lojasAtivasEmp : lojasFreeTier

              return (
                <div key={p.plano} className={`rounded-xl p-4 border ${borderMap[cor]} bg-gray-50 dark:bg-white/[0.02]`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeMap[cor]}`}>{p.label}</span>
                    {p.price ? <StatusPill ok label="Ativo" /> : p.priceId ? <StatusPill ok={false} label="Erro" /> : null}
                  </div>

                  {p.price ? (
                    <>
                      <p className="text-2xl font-black dash-title leading-none">
                        {fmt(p.price.unit_amount, p.price.currency)}
                        <span className="text-sm font-normal dash-muted ml-1">/{p.price.recurring?.interval === "month" ? "mês" : "ano"}</span>
                      </p>
                      {p.product && <p className="text-xs dash-muted mt-1">{p.product.name}</p>}
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
                        <span className="text-xs dash-muted">{activeCount} ativa{activeCount !== 1 ? "s" : ""}</span>
                        <code className="text-xs text-gray-400 dark:text-white/20 font-mono truncate max-w-[120px]">{p.priceId}</code>
                      </div>
                    </>
                  ) : p.plano === "ESSENCIAL" ? (
                    <>
                      <p className="text-2xl font-black dash-title leading-none">Grátis</p>
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.05]">
                        <span className="text-xs dash-muted">{activeCount} loja{activeCount !== 1 ? "s" : ""}</span>
                      </div>
                    </>
                  ) : (
                    <div className="mt-2">
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Price ID não configurado
                      </p>
                      <p className="text-xs dash-muted mt-1">
                        Defina <code className="bg-gray-100 dark:bg-white/10 px-1 rounded">STRIPE_PLAN_{p.plano}</code> no .env
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4">
            <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium dash-muted hover:text-emerald-500 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Produtos & Preços no Stripe
            </a>
          </div>
        </div>

        {/* ── PRODUTOS DE IMPRESSÃO ──────────────────────────────── */}
        <div className="dash-card p-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-semibold dash-title flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-500" />
              Produtos de Impressão
            </h2>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/admin/stripe/produtos"
                className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg transition-colors">
                Gerenciar produtos
              </Link>
              <a href={`https://dashboard.stripe.com/${isLive ? "" : "test/"}products?active=true`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium dash-muted hover:text-emerald-500 transition-colors">
                <ExternalLink className="w-3 h-3" /> Ver no Stripe
              </a>
            </div>
          </div>

          <div className="space-y-5">
            {kitsComDetalhes.map((grupo) => {
              const BORDER = { emerald: "border-emerald-200 dark:border-emerald-500/30", amber: "border-amber-200 dark:border-amber-500/30", blue: "border-blue-200 dark:border-blue-500/30" }
              const BADGE  = { emerald: COLOR_CLS.emerald, amber: COLOR_CLS.amber, blue: COLOR_CLS.blue }

              return (
                <div key={grupo.grupo} className={`rounded-xl border ${BORDER[grupo.cor]} bg-gray-50 dark:bg-white/[0.02] overflow-hidden`}>
                  {/* Cabeçalho do grupo */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${BADGE[grupo.cor]}`}>{grupo.grupo}</span>
                    {grupo.kits.some(k => k.price) && <StatusPill ok label="Ativo" />}
                  </div>

                  {/* Kits do grupo */}
                  <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                    {grupo.kits.map((k) => (
                      <div key={k.key} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold dash-subtitle">{k.label}</p>
                          {k.price ? (
                            <code className="text-xs text-gray-400 dark:text-white/20 font-mono truncate block mt-0.5">{k.priceId}</code>
                          ) : (
                            <p className="text-xs text-amber-500 flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              {k.priceId ? "Não encontrado" : "Não configurado"}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {k.price && (
                            <p className="text-base font-black dash-title">
                              {fmt(k.price.unit_amount, k.price.currency)}
                            </p>
                          )}
                          {k.priceId && (
                            <a
                              href={`https://dashboard.stripe.com/${isLive ? "" : "test/"}prices/${k.priceId}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-gray-400 hover:text-emerald-500 transition-colors"
                              title="Ver no Stripe"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── WEBHOOK ─────────────────────────────────────────────── */}
        <div className="dash-card p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="font-semibold dash-title flex items-center gap-2">
                <Webhook className="w-4 h-4 text-emerald-500" />
                Webhook
              </h2>
              <p className="text-xs dash-muted mt-0.5">Configure no Stripe Dashboard para ativar/bloquear contas automaticamente</p>
            </div>
            <StatusPill ok={webhookSecretOk} label={webhookSecretOk ? "Secret configurado" : "Secret ausente"} />
          </div>

          <div className="rounded-xl p-3 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] mb-4">
            <p className="text-xs dash-muted mb-1.5">URL do endpoint</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono dash-subtitle flex-1 truncate">{webhookUrl}</code>
              <button title="Copiar" className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                <Copy className="w-3.5 h-3.5 dash-muted" />
              </button>
            </div>
          </div>

          <p className="text-xs font-semibold dash-subtitle mb-2">Eventos a escutar:</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              "checkout.session.completed",
              "invoice.payment_succeeded",
              "invoice.payment_failed",
              "customer.subscription.deleted",
              "customer.subscription.trial_will_end",
            ].map((e) => (
              <code key={e} className="text-xs bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-white/60 px-2 py-0.5 rounded-md">
                {e}
              </code>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
            {[
              { label: "Secret Key",      value: maskKey(process.env.STRIPE_SECRET_KEY),            ok: !!process.env.STRIPE_SECRET_KEY },
              { label: "Publishable Key", value: maskKey(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY), ok: !!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY },
              { label: "Webhook Secret",  value: maskKey(process.env.STRIPE_SECRET_WEBHOOK_KEY),    ok: webhookSecretOk },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-3 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                <p className="dash-muted mb-1">{item.label}</p>
                <div className="flex items-center gap-1.5">
                  {item.ok ? <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> : <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                  <code className="font-mono dash-subtitle truncate">{item.value}</code>
                </div>
              </div>
            ))}
          </div>

          {stripeError && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 mb-4">
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{stripeError}</p>
            </div>
          )}

          <div className="flex gap-4 flex-wrap">
            <a href={`https://dashboard.stripe.com/${isLive ? "" : "test/"}webhooks/create`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              <ExternalLink className="w-3.5 h-3.5" /> Criar webhook no Stripe →
            </a>
            <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium dash-muted hover:text-emerald-500 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> API Keys
            </a>
          </div>
        </div>

        {/* ── TODAS AS LOJAS COM ASSINATURA ──────────────────────── */}
        <div className="dash-card p-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-semibold dash-title flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              Assinaturas ativas
            </h2>
            {todasComAssinatura.length > 0 && (
              <span className="text-xs font-semibold dash-muted">{todasComAssinatura.length} loja{todasComAssinatura.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          {todasComAssinatura.length > 0 ? (
            <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
              {/* Cabeçalho */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03] text-xs font-semibold dash-muted uppercase tracking-wide">
                <span className="col-span-4">Loja</span>
                <span className="col-span-2">Plano</span>
                <span className="col-span-3 hidden sm:block">Vencimento</span>
                <span className="col-span-2 hidden sm:block">Status</span>
                <span className="col-span-1 text-right">↗</span>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                {todasComAssinatura.map((loja) => {
                  const vencida    = loja.stripeCurrentPeriodEnd ? loja.stripeCurrentPeriodEnd < agora : false
                  const proxima    = !vencida && loja.stripeCurrentPeriodEnd ? loja.stripeCurrentPeriodEnd <= setesDias : false
                  const stripeBase = `https://dashboard.stripe.com/${isLive ? "" : "test/"}`

                  return (
                    <div key={loja.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <div className="col-span-4 min-w-0">
                        <Link href={`/dashboard/lojas/${loja.id}`} className="font-medium dash-subtitle hover:text-emerald-500 transition-colors truncate block">
                          {loja.nome}
                        </Link>
                        <p className="text-xs dash-muted truncate">{loja.email}</p>
                      </div>

                      <div className="col-span-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          loja.plano === "PROFISSIONAL" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
                          loja.plano === "EMPRESARIAL"  ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400" :
                          "bg-gray-100 dark:bg-white/[0.06] dash-muted"
                        }`}>
                          {PLANO_LABELS[loja.plano]}
                        </span>
                      </div>

                      <div className="col-span-3 hidden sm:block">
                        <span className={`text-xs ${vencida ? "text-red-500 dark:text-red-400 font-semibold" : proxima ? "text-amber-600 dark:text-amber-400 font-semibold" : "dash-muted"}`}>
                          {loja.stripeCurrentPeriodEnd
                            ? `${fmtDate(loja.stripeCurrentPeriodEnd)}${proxima ? ` · ${diasRestantes(loja.stripeCurrentPeriodEnd)}` : ""}`
                            : "—"}
                        </span>
                      </div>

                      <div className="col-span-2 hidden sm:flex">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          loja.status === "ATIVA" && !vencida
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                        }`}>
                          {loja.status === "ATIVA" && !vencida ? "Ativo" : "Vencido"}
                        </span>
                      </div>

                      <div className="col-span-1 sm:col-span-1 flex justify-end items-center gap-1.5">
                        {loja.stripeSubscriptionId && (
                          <a href={`${stripeBase}subscriptions/${loja.stripeSubscriptionId}`}
                            target="_blank" rel="noopener noreferrer"
                            title="Ver assinatura no Stripe"
                            className="dash-muted hover:text-emerald-500 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 dash-muted text-sm">
              Nenhuma loja com assinatura Stripe ainda.
            </div>
          )}
        </div>

        {/* ── EVENTOS RECENTES DO STRIPE ──────────────────────────── */}
        {recentEvents.length > 0 && (
          <div className="dash-card p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="font-semibold dash-title flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                Eventos recentes
              </h2>
              <a href={`https://dashboard.stripe.com/${isLive ? "" : "test/"}events`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium dash-muted hover:text-emerald-500 transition-colors">
                <RefreshCw className="w-3 h-3" /> Ver todos
              </a>
            </div>

            <div className="space-y-2">
              {recentEvents.map((evt) => (
                <div key={evt.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05]">
                  <EventBadge type={evt.type} />
                  <code className="text-xs text-gray-400 dark:text-white/25 font-mono hidden sm:block truncate flex-1 text-right">
                    {evt.id.slice(0, 28)}…
                  </code>
                  <span className="text-xs dash-muted flex-shrink-0">
                    {fmtDateTime(evt.created)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AÇÕES RÁPIDAS ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { href: `https://dashboard.stripe.com/${isLive ? "" : "test/"}customers`,     label: "Clientes",     desc: "Ver todos os customers" },
            { href: `https://dashboard.stripe.com/${isLive ? "" : "test/"}subscriptions`, label: "Assinaturas",  desc: "Gerenciar assinaturas"  },
            { href: `https://dashboard.stripe.com/${isLive ? "" : "test/"}payments`,      label: "Pagamentos",   desc: "Histórico de cobranças"  },
            { href: `https://dashboard.stripe.com/${isLive ? "" : "test/"}webhooks`,      label: "Webhooks",     desc: "Configurar e testar"    },
          ].map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
              className="dash-card p-4 flex items-center justify-between hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-colors group">
              <div>
                <p className="font-semibold dash-subtitle text-sm">{link.label}</p>
                <p className="text-xs dash-muted">{link.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 dash-muted group-hover:text-emerald-500 transition-colors flex-shrink-0" />
            </a>
          ))}
        </div>

      </div>
    </div>
  )
}
