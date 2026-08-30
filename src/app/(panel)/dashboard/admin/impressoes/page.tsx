import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import {
  Printer, Clock, CheckCircle2, XCircle, Search, Truck, ChevronRight, Banknote,
} from "lucide-react"

// ─────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────

const STATUS_CONFIG = {
  PENDENTE:             { label: "Pendente",          icon: Clock,         color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200"   },
  EM_ANALISE:           { label: "Em análise",        icon: Search,        color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200"    },
  AGUARDANDO_PAGAMENTO: { label: "Aguard. pagamento", icon: Banknote,      color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200"  },
  APROVADA:             { label: "Aprovada",          icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  REJEITADA:            { label: "Rejeitada",         icon: XCircle,       color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200"     },
  IMPRESSA:             { label: "Impressa",          icon: Printer,       color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200"  },
  ENTREGUE:             { label: "Entregue",          icon: Truck,         color: "text-gray-500",    bg: "bg-gray-50",    border: "border-gray-200"    },
} as const

type StatusKey = keyof typeof STATUS_CONFIG
const STATUS_ORDER: StatusKey[] = ["PENDENTE", "EM_ANALISE", "AGUARDANDO_PAGAMENTO", "APROVADA", "REJEITADA", "IMPRESSA", "ENTREGUE"]

// ─────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────

export default async function AdminImpressoesPage() {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard")

  const solicitacoes = await db.solicitacaoImpressao.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      loja:     { select: { nome: true, nomeExibicao: true, email: true } },
      campanha: { select: { nome: true } },
      layout:   { select: { nome: true, corPrimaria: true, tamanhoCard: true } },
      lote:     { select: { quantidade: true, descricao: true } },
    },
  })

  // Agrupar por status para os contadores
  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = solicitacoes.filter(x => x.status === s).length
    return acc
  }, {} as Record<StatusKey, number>)

  const pendentes = solicitacoes.filter(s => ["PENDENTE", "EM_ANALISE", "AGUARDANDO_PAGAMENTO"].includes(s.status))
  const historico = solicitacoes.filter(s => !["PENDENTE", "EM_ANALISE", "AGUARDANDO_PAGAMENTO"].includes(s.status))

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold dash-title">Solicitações de Impressão</h1>
        <p className="dash-subtitle text-sm mt-0.5">
          Gerencie todas as solicitações de impressão das lojas.
        </p>
      </div>

      {/* Status counters */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
        {STATUS_ORDER.map(s => {
          const cfg = STATUS_CONFIG[s]
          const Icon = cfg.icon
          return (
            <div key={s} className={`dash-card p-3 text-center border ${cfg.border} ${cfg.bg}`}>
              <Icon className={`w-4 h-4 mx-auto mb-1 ${cfg.color}`} />
              <p className={`text-lg font-bold ${cfg.color}`}>{counts[s]}</p>
              <p className="text-xs text-gray-500">{cfg.label}</p>
            </div>
          )
        })}
      </div>

      {/* Fila ativa */}
      <section className="mb-8">
        <h2 className="text-base font-semibold dash-title mb-3">
          Fila de atendimento <span className="text-xs font-normal dash-muted ml-1">({pendentes.length})</span>
        </h2>

        {pendentes.length === 0 ? (
          <div className="dash-card p-8 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            <p className="text-sm dash-muted">Nenhuma solicitação pendente. 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendentes.map(sol => {
              const cfg = STATUS_CONFIG[sol.status as StatusKey]
              const Icon = cfg.icon
              const nomeLoja = sol.loja.nomeExibicao ?? sol.loja.nome

              return (
                <Link
                  key={sol.id}
                  href={`/dashboard/admin/impressoes/${sol.id}`}
                  className="dash-card p-5 flex items-center gap-4 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-colors group"
                >
                  {/* Cor layout */}
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 border border-black/5 dark:border-white/10"
                    style={{ backgroundColor: sol.layout.corPrimaria }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold dash-title">{nomeLoja}</p>
                      <span className="text-xs dash-muted">·</span>
                      <p className="text-xs dash-muted truncate">{sol.campanha.nome}</p>
                    </div>
                    <p className="text-xs dash-muted mt-0.5">
                      {sol.quantidadeCards} cards · {sol.folhasEstimadas} folha{sol.folhasEstimadas !== 1 ? "s" : ""} · Layout: {sol.layout.nome}
                    </p>
                    <p className="text-xs dash-muted">
                      {new Date(sol.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* Status */}
                  <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </div>

                  <ChevronRight className="w-4 h-4 dash-muted group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Histórico — sempre visível */}
      <section>
        <h2 className="text-base font-semibold dash-title mb-3">
          Histórico <span className="text-xs font-normal dash-muted ml-1">({historico.length})</span>
        </h2>

        {historico.length === 0 ? (
          <div className="dash-card p-8 text-center">
            <Printer className="w-8 h-8 mx-auto mb-2 dash-muted opacity-40" />
            <p className="text-sm dash-muted">Nenhuma solicitação concluída ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {historico.map(sol => {
              const cfg = STATUS_CONFIG[sol.status as StatusKey]
              const Icon = cfg.icon
              const nomeLoja = sol.loja.nomeExibicao ?? sol.loja.nome

              return (
                <Link
                  key={sol.id}
                  href={`/dashboard/admin/impressoes/${sol.id}`}
                  className="dash-card p-4 flex items-center gap-3 hover:border-gray-300 dark:hover:border-white/20 transition-colors group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex-shrink-0 border border-black/5 dark:border-white/10"
                    style={{ backgroundColor: sol.layout.corPrimaria }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium dash-title truncate">{nomeLoja} — {sol.campanha.nome}</p>
                    <p className="text-xs dash-muted">{new Date(sol.criadoEm).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </div>
                  <ChevronRight className="w-4 h-4 dash-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
