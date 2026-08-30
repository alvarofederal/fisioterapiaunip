import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import Link from "next/link"
import {
  Megaphone, Key, ShoppingBag, TrendingUp, Plus, ArrowRight,
  Building2, Users, AlertCircle, Check, ChevronRight, Sparkles,
  Layers, Zap, Target, BarChart2, User, ScanLine,
} from "lucide-react"

/* ─── helpers ─────────────────────────────────────────────────────── */
const BENEFICIO_LABEL: Record<string, string> = {
  DESCONTO_PERCENTUAL: "% desconto",
  DESCONTO_FIXO:       "R$ desconto",
  BRINDE:              "Brinde",
  SORTEIO:             "Sorteio",
  FRETE_GRATIS:        "Frete grátis",
  CASHBACK:            "Cashback",
}

const STATUS_CAMPANHA: Record<string, { label: string; cls: string }> = {
  ATIVA:      { label: "Ativa",      cls: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  RASCUNHO:   { label: "Rascunho",   cls: "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60" },
  ENCERRADA:  { label: "Encerrada",  cls: "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400" },
  CANCELADA:  { label: "Cancelada",  cls: "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30" },
}

/* ─── mini gráfico de barras ─────────────────────────────────────── */
function BarChart({ data }: { data: { label: string; value: number; isToday?: boolean }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end justify-between gap-2 h-28">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 min-h-[14px]">
              {d.value > 0 ? d.value : ""}
            </span>
            <div className="w-full flex items-end" style={{ height: "72px" }}>
              <div
                className={`w-full rounded-t-lg transition-all ${
                  d.isToday
                    ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                    : "bg-emerald-400/30 dark:bg-emerald-500/25"
                }`}
                style={{ height: pct > 0 ? `${Math.max(pct, 8)}%` : "4px", opacity: pct === 0 ? 0.25 : 1 }}
              />
            </div>
            <span className="text-[10px] dash-muted leading-none">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ─── anel de taxa ───────────────────────────────────────────────── */
function TaxaRing({ pct, cor }: { pct: number; cor: string }) {
  const r = 20
  const c = 2 * Math.PI * r
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90 flex-shrink-0">
      <circle cx="26" cy="26" r={r} fill="none" stroke={cor + "25"} strokeWidth="4.5" />
      <circle cx="26" cy="26" r={r} fill="none" stroke={cor} strokeWidth="4.5"
        strokeLinecap="round" strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        style={{ transition: "stroke-dashoffset 0.8s ease" }} />
    </svg>
  )
}

/* ─── Onboarding Hero ────────────────────────────────────────────── */
const STEPS = [
  { n: 1, key: "loja",     title: "Loja criada",       desc: "Conta configurada",           href: null,                        cta: null,            icon: Building2 },
  { n: 2, key: "marca",    title: "Identidade visual", desc: "Logo, cor e dados da loja",   href: "/dashboard/configuracoes",  cta: "Configurar",    icon: Sparkles  },
  { n: 3, key: "layout",   title: "Criar layout",      desc: "Visual dos cards impressos",  href: "/dashboard/layout/novo",    cta: "Criar layout",  icon: Layers    },
  { n: 4, key: "campanha", title: "1ª campanha",       desc: "Crie sua oferta de cortesia", href: "/dashboard/campanhas/nova", cta: "Criar agora",   icon: Megaphone },
  { n: 5, key: "chaves",   title: "Gerar chaves",      desc: "Códigos com QR Code",         href: "/dashboard/chaves/gerar",   cta: "Gerar chaves",  icon: Key       },
  { n: 6, key: "resgate",  title: "Validar resgate",   desc: "Confirme o benefício",        href: "/dashboard/validar",        cta: "Validar agora", icon: ShoppingBag},
]

function OnboardingHero({ passos, passosFeitos, nome }: {
  passos: Record<string, boolean>; passosFeitos: number; nome: string
}) {
  const pct = Math.round((passosFeitos / 6) * 100)
  const r = 22; const circum = 2 * Math.PI * r
  const next = STEPS.find((s) => !passos[s.key])

  return (
    <div className="relative mb-8 rounded-3xl overflow-hidden hero-card">
      <div aria-hidden className="absolute inset-0 pointer-events-none hero-card-grid" />
      <div aria-hidden className="absolute pointer-events-none hero-card-orb"
        style={{ top: "-60px", right: "10%", width: "300px", height: "300px", borderRadius: "50%" }} />

      <div className="relative z-10 px-6 pt-7 pb-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-2 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
            Configuração inicial
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold hero-card-title leading-tight">
            {passosFeitos === 1 ? `Bem-vindo, ${nome}! Configure sua loja 🚀`
              : passosFeitos < 5 ? "Continue configurando — está quase pronto"
              : "Último passo! Sua loja está quase live"}
          </h2>
          <p className="text-sm mt-1 hero-card-sub">
            {passosFeitos} de 6 etapas concluídas
            {next && <> · próximo: <span className="text-emerald-600 dark:text-emerald-400">{next.title}</span></>}
          </p>
        </div>
        <div className="relative flex-shrink-0 w-16 h-16">
          <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
            <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(16,185,129,0.20)" strokeWidth="5" />
            <circle cx="32" cy="32" r={r} fill="none" stroke="#10b981" strokeWidth="5"
              strokeLinecap="round" strokeDasharray={circum}
              strokeDashoffset={circum * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 0.6s ease" }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{pct}%</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 pb-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {STEPS.map((step) => {
          const done = passos[step.key]
          const isCurr = !done && STEPS.findIndex((s) => !passos[s.key]) === step.n - 1
          const Icon = step.icon
          return (
            <div key={step.key} className={`rounded-2xl p-4 flex flex-col gap-3 transition-all ${
              done ? "onb-step-done" : isCurr ? "onb-step-current" : "onb-step-todo"
            }`}>
              <div className="flex items-center justify-between">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  done ? "onb-num-done" : isCurr ? "onb-num-curr" : "onb-num-todo"
                }`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : step.n}
                </div>
                <Icon className={`w-4 h-4 flex-shrink-0 ${
                  done ? "text-emerald-500" : isCurr ? "text-emerald-600 dark:text-white/60" : "text-emerald-400/50 dark:text-white/18"
                }`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold leading-tight ${
                  done ? "onb-title-done" : isCurr ? "onb-title-curr" : "onb-title-todo"
                }`}>{step.title}</p>
                <p className={`text-xs mt-0.5 leading-snug ${done ? "onb-desc-done" : "onb-desc-todo"}`}>
                  {step.desc}
                </p>
              </div>
              {!done && step.href && (
                <Link href={step.href} className={`flex items-center justify-between w-full rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  isCurr ? "text-white" : "onb-cta-todo"
                }`} style={isCurr ? {
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  boxShadow: "0 0 18px rgba(16,185,129,0.35)",
                } : undefined}>
                  {step.cta}<ChevronRight className="w-3 h-3" />
                </Link>
              )}
              {done && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">✓ Concluído</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Lojista Dashboard ──────────────────────────────────────────── */
export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role === "SUPER_ADMIN") return <SuperAdminDashboard />
  if (!session.user.lojaId) redirect("/onboarding/loja")

  const lojaId = session.user.lojaId

  /* datas */
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const ontem = new Date(hoje.getTime() - 86_400_000)
  const seteAtras = new Date(hoje.getTime() - 6 * 86_400_000)

  const [
    loja,
    campanhasAtivas,
    totalCampanhas,
    temLayout,
    totalChaves,
    totalAtivadas,       // ATIVADA + RESGATADA (já passou pelo funil)
    totalResgatadas,     // somente RESGATADA
    resgatesToday,
    resgatesOntem,
    ultimosResgates,
    resgates7Dias,
    topCampanhas,
  ] = await Promise.all([
    db.loja.findUnique({
      where: { id: lojaId },
      select: { nome: true, plano: true, status: true, logoUrl: true, corPrimaria: true },
    }),
    db.campanha.count({ where: { lojaId, status: "ATIVA" } }),
    db.campanha.count({ where: { lojaId } }),
    db.layout.count({ where: { lojaId } }),
    db.chave.count({ where: { lojaId } }),
    db.chave.count({ where: { lojaId, status: { in: ["ATIVADA", "RESGATADA"] } } }),
    db.chave.count({ where: { lojaId, status: "RESGATADA" } }),
    db.resgate.count({ where: { lojaId, resgatadoEm: { gte: hoje } } }),
    db.resgate.count({ where: { lojaId, resgatadoEm: { gte: ontem, lt: hoje } } }),
    db.resgate.findMany({
      where: { lojaId },
      orderBy: { resgatadoEm: "desc" },
      take: 6,
      select: {
        id: true,
        resgatadoEm: true,
        campanha: { select: { nome: true, tipoBeneficio: true, valorBeneficio: true, descricaoPremio: true } },
        cliente: { select: { nome: true } },
      },
    }),
    db.resgate.findMany({
      where: { lojaId, resgatadoEm: { gte: seteAtras } },
      select: { resgatadoEm: true },
    }),
    db.campanha.findMany({
      where: { lojaId, status: { not: "CANCELADA" } },
      select: {
        id: true, nome: true, status: true, tipoBeneficio: true,
        _count: { select: { resgates: true, chaves: true } },
      },
      orderBy: { resgates: { _count: "desc" } },
      take: 5,
    }),
  ])

  /* métricas derivadas */
  const taxaAtivacao  = totalChaves > 0 ? Math.round((totalAtivadas  / totalChaves)  * 100) : 0
  const taxaConversao = totalAtivadas > 0 ? Math.round((totalResgatadas / totalAtivadas) * 100) : 0
  const trendHoje     = resgatesOntem > 0
    ? Math.round(((resgatesToday - resgatesOntem) / resgatesOntem) * 100)
    : null

  /* gráfico 7 dias */
  const porDia: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(hoje); dt.setDate(hoje.getDate() - i)
    porDia[dt.toISOString().slice(0, 10)] = 0
  }
  for (const r of resgates7Dias) {
    const key = new Date(r.resgatadoEm).toISOString().slice(0, 10)
    if (key in porDia) porDia[key]++
  }
  const todayKey = new Date().toISOString().slice(0, 10)
  const grafico = Object.entries(porDia).map(([date, value]) => ({
    label: new Date(date + "T12:00:00Z").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    value,
    isToday: date === todayKey,
  }))
  const totalGrafico = grafico.reduce((a, b) => a + b.value, 0)

  /* onboarding */
  const temResgate = ultimosResgates.length > 0
  const passos = {
    loja:     true,
    marca:    !!(loja?.logoUrl || loja?.corPrimaria !== "#10b981"),
    layout:   temLayout > 0,
    campanha: totalCampanhas > 0,
    chaves:   totalChaves > 0,
    resgate:  temResgate,
  }
  const passosFeitos = Object.values(passos).filter(Boolean).length
  const onboardingOk = passosFeitos === 6

  return (
    <div className="space-y-6">
      {/* Onboarding */}
      {!onboardingOk && (
        <OnboardingHero passos={passos} passosFeitos={passosFeitos}
          nome={session.user.name?.split(" ")[0] ?? "Lojista"} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold dash-title">
            {onboardingOk
              ? `Olá, ${session.user.name?.split(" ")[0] ?? "Lojista"} 👋`
              : "Visão geral"}
          </h1>
          <p className="dash-subtitle mt-0.5 text-sm truncate">{loja?.nome}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link href="/dashboard/validar"
            className="hidden sm:inline-flex items-center gap-2 border border-gray-200 dark:border-white/10 dash-subtitle hover:text-emerald-500 hover:border-emerald-300 dark:hover:border-emerald-500/40 px-3 py-2 rounded-xl text-sm transition-colors">
            <ScanLine className="w-4 h-4" />Validar
          </Link>
          <Link href="/dashboard/campanhas/nova"
            className="inline-flex items-center gap-2 dash-btn-primary px-3 sm:px-4 py-2.5 rounded-xl text-sm">
            <Plus className="w-4 h-4" /><span className="hidden xs:inline">Nova campanha</span>
          </Link>
        </div>
      </div>

      {/* ── 4 cards de KPI ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Campanhas ativas */}
        <Link href="/dashboard/campanhas" className="dash-card-hover p-5 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center dash-icon-emerald">
              <Megaphone className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-white/20 group-hover:text-emerald-500 transition-colors" />
          </div>
          <p className="text-3xl font-bold dash-title">{campanhasAtivas}</p>
          <p className="text-sm dash-subtitle mt-0.5">Campanhas ativas</p>
        </Link>

        {/* Resgates hoje */}
        <Link href="/dashboard/resgates" className="dash-card-hover p-5 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center dash-icon-orange">
              <ShoppingBag className="w-4 h-4" />
            </div>
            {trendHoje !== null && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                trendHoje >= 0
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-50 dark:bg-red-500/10 text-red-500"
              }`}>
                {trendHoje >= 0 ? "↑" : "↓"}{Math.abs(trendHoje)}%
              </span>
            )}
          </div>
          <p className="text-3xl font-bold dash-title">{resgatesToday}</p>
          <p className="text-sm dash-subtitle mt-0.5">Resgates hoje</p>
          {trendHoje !== null && (
            <p className="text-xs dash-muted mt-1">
              {resgatesOntem} ontem
            </p>
          )}
        </Link>

        {/* Taxa de ativação */}
        <div className="dash-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center dash-icon-blue">
              <Zap className="w-4 h-4" />
            </div>
            <div className="relative flex items-center justify-center">
              <TaxaRing pct={taxaAtivacao} cor="#3b82f6" />
              <span className="absolute text-[11px] font-bold text-blue-600 dark:text-blue-400 rotate-90">
                {taxaAtivacao}%
              </span>
            </div>
          </div>
          <p className="text-3xl font-bold dash-title">{taxaAtivacao}%</p>
          <p className="text-sm dash-subtitle mt-0.5">Taxa de ativação</p>
          <p className="text-xs dash-muted mt-1">{totalAtivadas} de {totalChaves} chaves</p>
        </div>

        {/* Taxa de conversão */}
        <div className="dash-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center dash-icon-purple">
              <Target className="w-4 h-4" />
            </div>
            <div className="relative flex items-center justify-center">
              <TaxaRing pct={taxaConversao} cor="#8b5cf6" />
              <span className="absolute text-[11px] font-bold text-purple-600 dark:text-purple-400 rotate-90">
                {taxaConversao}%
              </span>
            </div>
          </div>
          <p className="text-3xl font-bold dash-title">{taxaConversao}%</p>
          <p className="text-sm dash-subtitle mt-0.5">Taxa de conversão</p>
          <p className="text-xs dash-muted mt-1">{totalResgatadas} de {totalAtivadas} ativadas</p>
        </div>
      </div>

      {/* ── Gráfico + Top campanhas ────────────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-4">

        {/* Gráfico 7 dias */}
        <div className="dash-card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold dash-title flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-500" />
                Resgates — últimos 7 dias
              </h2>
              <p className="text-xs dash-muted mt-0.5">
                {totalGrafico > 0
                  ? `${totalGrafico} resgate${totalGrafico > 1 ? "s" : ""} no período`
                  : "Nenhum resgate ainda neste período"}
              </p>
            </div>
            <Link href="/dashboard/resgates"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium transition-colors">
              Ver todos →
            </Link>
          </div>
          <BarChart data={grafico} />
        </div>

        {/* Top campanhas */}
        <div className="dash-card overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center justify-between">
            <h2 className="font-semibold dash-title text-sm">Top campanhas</h2>
            <Link href="/dashboard/campanhas"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium">
              Ver todas →
            </Link>
          </div>
          {topCampanhas.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm dash-muted">Nenhuma campanha ainda.</p>
              <Link href="/dashboard/campanhas/nova"
                className="text-sm text-emerald-500 font-medium hover:text-emerald-400 mt-1 inline-block">
                Criar primeira →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {topCampanhas.map((c, i) => {
                const pctResgate = c._count.chaves > 0
                  ? Math.round((c._count.resgates / c._count.chaves) * 100)
                  : 0
                const st = STATUS_CAMPANHA[c.status] ?? STATUS_CAMPANHA.RASCUNHO
                return (
                  <Link key={c.id} href={`/dashboard/campanhas/${c.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold dash-muted flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold dash-title truncate">{c.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${st.cls}`}>
                          {st.label}
                        </span>
                        <span className="text-[10px] dash-muted">
                          {BENEFICIO_LABEL[c.tipoBeneficio] ?? c.tipoBeneficio}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {c._count.resgates}
                      </p>
                      <p className="text-[10px] dash-muted">{pctResgate}% conv.</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Feed de últimos resgates ───────────────────────────── */}
      {ultimosResgates.length > 0 && (
        <div className="dash-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center justify-between">
            <h2 className="font-semibold dash-title text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Últimos resgates
            </h2>
            <Link href="/dashboard/resgates"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
            {ultimosResgates.map((r) => {
              const beneficio = (() => {
                const c = r.campanha
                if (c.tipoBeneficio === "DESCONTO_PERCENTUAL" && c.valorBeneficio)
                  return `${c.valorBeneficio}% off`
                if (c.tipoBeneficio === "DESCONTO_FIXO" && c.valorBeneficio)
                  return `R$ ${Number(c.valorBeneficio).toFixed(2)} off`
                if (c.tipoBeneficio === "FRETE_GRATIS") return "Frete grátis"
                if (c.descricaoPremio) return c.descricaoPremio
                return BENEFICIO_LABEL[c.tipoBeneficio] ?? c.tipoBeneficio
              })()
              return (
                <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                    <User className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium dash-title truncate">
                      {r.cliente?.nome ?? "Cliente anônimo"}
                    </p>
                    <p className="text-xs dash-muted truncate">
                      {r.campanha.nome} · <span className="text-emerald-600 dark:text-emerald-400 font-medium">{beneficio}</span>
                    </p>
                  </div>
                  <span className="text-xs dash-muted flex-shrink-0">
                    {new Date(r.resgatadoEm).toLocaleString("pt-BR", {
                      day: "2-digit", month: "2-digit",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalChaves === 0 && campanhasAtivas === 0 && (
        <div className="dash-card border-dashed p-10 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 dash-icon-emerald">
            <Megaphone className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold dash-title mb-2">Comece criando sua primeira campanha</h2>
          <p className="dash-subtitle text-sm max-w-md mx-auto mb-6">
            Crie uma campanha, gere chaves com QR Code e distribua para seus clientes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard/campanhas/nova"
              className="inline-flex items-center justify-center gap-2 dash-btn-primary px-6 py-3 rounded-xl text-sm">
              <Plus className="w-4 h-4" />Criar campanha
            </Link>
            <Link href="/dashboard/chaves"
              className="inline-flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10 dash-subtitle text-sm font-medium px-6 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <Key className="w-4 h-4" />Gerenciar chaves
            </Link>
          </div>
        </div>
      )}

      {/* Plano ESSENCIAL */}
      {loja?.plano === "ESSENCIAL" && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">Plano Essencial</p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">Limite de 3 campanhas e 100 chaves/mês.</p>
          </div>
          <Link href="/dashboard/configuracoes/plano"
            className="text-amber-700 dark:text-amber-400 text-xs font-semibold hover:text-amber-900 whitespace-nowrap">
            Ver planos →
          </Link>
        </div>
      )}
    </div>
  )
}

/* ─── Super Admin ────────────────────────────────────────────────── */
async function SuperAdminDashboard() {
  const [totalLojas, totalUsuarios, totalChaves, resgatesToday] = await Promise.all([
    db.loja.count(),
    db.user.count(),
    db.chave.count(),
    db.resgate.count({ where: { resgatadoEm: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
  ])
  const lojasRecentes = await db.loja.findMany({
    take: 5, orderBy: { criadoEm: "desc" },
    select: { id: true, nome: true, plano: true, status: true, criadoEm: true },
  })

  const stats = [
    { label: "Lojas cadastradas", value: totalLojas,    icon: Building2,  cls: "dash-icon-emerald", href: "/dashboard/lojas"    },
    { label: "Usuários",          value: totalUsuarios, icon: Users,       cls: "dash-icon-blue",    href: "/dashboard/usuarios" },
    { label: "Total de chaves",   value: totalChaves,   icon: Key,         cls: "dash-icon-purple",  href: "/dashboard/chaves"   },
    { label: "Resgates hoje",     value: resgatesToday, icon: ShoppingBag, cls: "dash-icon-orange",  href: "/dashboard/resgates" },
  ]

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Painel Super Admin</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Visão geral de toda a plataforma</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="dash-card-hover p-5 group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.cls}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 dark:text-white/20 group-hover:text-emerald-500 transition-colors" />
            </div>
            <p className="text-3xl font-bold dash-title">{s.value}</p>
            <p className="text-sm dash-subtitle mt-0.5">{s.label}</p>
          </Link>
        ))}
      </div>
      <div className="dash-card overflow-hidden">
        <div className="px-5 py-4 border-b dash-border flex items-center justify-between">
          <h2 className="font-semibold dash-title">Lojas recentes</h2>
          <Link href="/dashboard/lojas" className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium">Ver todas →</Link>
        </div>
        {lojasRecentes.length === 0 ? (
          <div className="px-5 py-10 text-center dash-subtitle text-sm">Nenhuma loja cadastrada ainda.</div>
        ) : (
          <div className="divide-y dash-divider">
            {lojasRecentes.map((loja) => (
              <div key={loja.id} className="px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-white/5 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-gray-500 dark:text-white/40" />
                  </div>
                  <div>
                    <p className="text-sm font-medium dash-title">{loja.nome}</p>
                    <p className="text-xs dash-muted">{new Date(loja.criadoEm).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    loja.plano === "ESSENCIAL" ? "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60"
                    : loja.plano === "PROFISSIONAL" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}>{loja.plano}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    loja.status === "ATIVA"
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}>{loja.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
