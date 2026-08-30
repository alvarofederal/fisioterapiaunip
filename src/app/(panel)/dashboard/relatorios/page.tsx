import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import {
  BarChart3, TrendingUp, Users, Building2, Key, ShoppingBag,
  Download, Filter, Calendar,
} from "lucide-react"

export default async function RelatoriosPage() {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard")

  // ── Totais globais ──────────────────────────────────────────────
  const [totalLojas, totalUsuarios, totalChaves, totalResgates, totalCampanhas] =
    await Promise.all([
      db.loja.count(),
      db.user.count(),
      db.chave.count(),
      db.resgate.count(),
      db.campanha.count(),
    ])

  const [chavesResgatadas, chavesAtivas, lojasAtivas] = await Promise.all([
    db.chave.count({ where: { status: "RESGATADA" } }),
    db.chave.count({ where: { status: { in: ["GERADA", "CONSULTADA", "ATIVADA"] } } }),
    db.loja.count({ where: { status: "ATIVA" } }),
  ])

  const taxaConversaoGlobal =
    totalChaves > 0 ? ((chavesResgatadas / totalChaves) * 100).toFixed(1) : "0.0"

  // ── Lojas com mais resgates ─────────────────────────────────────
  const topLojas = await db.loja.findMany({
    take: 8,
    orderBy: { resgates: { _count: "desc" } },
    select: {
      id: true,
      nome: true,
      plano: true,
      _count: { select: { resgates: true, campanhas: true, chaves: true } },
    },
  })

  // ── Resgates por dia (últimos 14 dias) ──────────────────────────
  const diasAtras14 = new Date()
  diasAtras14.setDate(diasAtras14.getDate() - 13)
  diasAtras14.setHours(0, 0, 0, 0)

  const resgatesRecentes = await db.resgate.findMany({
    where: { resgatadoEm: { gte: diasAtras14 } },
    select: { resgatadoEm: true },
  })

  const hoje = new Date()
  const diasData: { label: string; count: number; isToday: boolean }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    const isToday = i === 0
    const count = resgatesRecentes.filter((r) => {
      const rd = new Date(r.resgatadoEm)
      return rd.getFullYear() === d.getFullYear() &&
        rd.getMonth() === d.getMonth() &&
        rd.getDate() === d.getDate()
    }).length
    diasData.push({ label, count, isToday })
  }
  const maxDia = Math.max(...diasData.map((d) => d.count), 1)

  const PLANO_CFG = {
    ESSENCIAL:    { label: "Essencial",    className: "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60" },
    PROFISSIONAL: { label: "Profissional", className: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    EMPRESARIAL:  { label: "Empresarial",  className: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  } as const

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold dash-title">Relatórios</h1>
          <p className="dash-subtitle text-sm mt-0.5">Visão consolidada de toda a plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Calendar className="w-4 h-4" />
            Período
          </button>
          <button className="inline-flex items-center gap-2 border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <button className="inline-flex items-center gap-2 dash-btn-primary text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Lojas ativas",     value: lojasAtivas,    total: totalLojas,    icon: Building2,   color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Usuários",         value: totalUsuarios,  total: null,          icon: Users,       color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" },
          { label: "Chaves geradas",   value: totalChaves,    total: null,          icon: Key,         color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10" },
          { label: "Resgates totais",  value: totalResgates,  total: null,          icon: ShoppingBag, color: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10" },
        ].map((s) => (
          <div key={s.label} className="dash-card p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold dash-title">{s.value.toLocaleString("pt-BR")}</p>
            <p className="text-xs dash-muted mt-0.5">
              {s.label}
              {s.total !== null && s.total !== s.value && (
                <span className="ml-1 opacity-60">/ {s.total}</span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Métricas de conversão */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="dash-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold dash-title">{taxaConversaoGlobal}%</p>
            <p className="text-xs dash-muted">Taxa de conversão global</p>
          </div>
        </div>
        <div className="dash-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex-shrink-0">
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold dash-title">{chavesAtivas.toLocaleString("pt-BR")}</p>
            <p className="text-xs dash-muted">Chaves ainda ativas</p>
          </div>
        </div>
        <div className="dash-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex-shrink-0">
            <Key className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold dash-title">{totalCampanhas.toLocaleString("pt-BR")}</p>
            <p className="text-xs dash-muted">Campanhas criadas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de barras — resgates 14 dias */}
        <div className="dash-card p-5">
          <h2 className="font-semibold dash-title mb-1">Resgates — últimos 14 dias</h2>
          <p className="text-xs dash-muted mb-4">Total da plataforma</p>
          <div className="flex items-end gap-1 h-32">
            {diasData.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: "96px" }}>
                  <div
                    className={`w-full rounded-t-sm transition-all ${
                      d.isToday
                        ? "bg-emerald-500 shadow-sm shadow-emerald-500/40"
                        : "bg-gray-200 dark:bg-white/[0.10]"
                    }`}
                    style={{ height: `${Math.max((d.count / maxDia) * 96, d.count > 0 ? 4 : 2)}px` }}
                    title={`${d.label}: ${d.count} resgates`}
                  />
                </div>
                {d.isToday && (
                  <span className="text-[9px] text-emerald-500 font-semibold">hoje</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] dash-muted">{diasData[0].label}</span>
            <span className="text-[10px] dash-muted">{diasData[diasData.length - 1].label}</span>
          </div>
        </div>

        {/* Top Lojas */}
        <div className="dash-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.07]">
            <h2 className="font-semibold dash-title">Top lojas por resgates</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
            {topLojas.length === 0 ? (
              <p className="px-5 py-8 text-sm dash-muted text-center">Nenhum resgate ainda.</p>
            ) : (
              topLojas.map((loja, idx) => (
                <div key={loja.id} className="px-5 py-3 flex items-center gap-3">
                  <span className="w-5 text-xs font-bold dash-muted text-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium dash-title truncate">{loja.nome}</p>
                    <p className="text-xs dash-muted">
                      {loja._count.campanhas} campanhas · {loja._count.chaves} chaves
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLANO_CFG[loja.plano]?.className ?? ""}`}>
                      {PLANO_CFG[loja.plano]?.label ?? loja.plano}
                    </span>
                    <span className="text-sm font-bold dash-title w-8 text-right">
                      {loja._count.resgates}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Aviso de feature futura */}
      <div className="dash-card border-dashed p-6 text-center">
        <BarChart3 className="w-8 h-8 dash-muted mx-auto mb-3" />
        <p className="font-medium dash-title mb-1">Relatórios detalhados em breve</p>
        <p className="text-sm dash-muted max-w-md mx-auto">
          Exportação CSV/PDF, filtros por período e por loja, relatório de ROI por campanha e análise de churn.
        </p>
      </div>
    </div>
  )
}
