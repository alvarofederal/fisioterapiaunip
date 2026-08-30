import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { Plus, Key, ArrowRight, Package } from "lucide-react"

const LOTE_STATUS = {
  GERADO:      { label: "Gerado",      className: "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60" },
  EXPORTADO:   { label: "Exportado",   className: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  DISTRIBUIDO: { label: "Distribuído", className: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
} as const

type SearchParams = { campanhaId?: string }

export default async function ChavesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  const params      = await searchParams
  const campanhaId  = params.campanhaId

  const lotes = await db.loteChave.findMany({
    where: { lojaId: session.user.lojaId!, ...(campanhaId ? { campanhaId } : {}) },
    orderBy: { criadoEm: "desc" },
    include: { campanha: { select: { nome: true, status: true, expiraEm: true } }, _count: { select: { chaves: true } } },
  })

  const statsRaw = await db.chave.groupBy({
    by: ["loteId", "status"],
    where: { loteId: { in: lotes.map((l) => l.id) } },
    _count: true,
  })

  const statsByLote: Record<string, Record<string, number>> = {}
  for (const s of statsRaw) {
    if (!statsByLote[s.loteId]) statsByLote[s.loteId] = {}
    statsByLote[s.loteId][s.status] = s._count
  }

  const campanhaFiltro = campanhaId
    ? await db.campanha.findUnique({ where: { id: campanhaId }, select: { nome: true } })
    : null

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold dash-title">Chaves</h1>
          <p className="dash-subtitle text-sm mt-0.5 truncate">
            {campanhaFiltro ? `Lotes da campanha: ${campanhaFiltro.nome}` : "Todos os lotes de chaves gerados"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {campanhaId && (
            <Link href="/dashboard/chaves"
              className="text-sm dash-subtitle hover:text-gray-700 dark:hover:text-white border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl hidden sm:inline-flex transition-colors">
              Ver todos
            </Link>
          )}
          <Link href={campanhaId ? `/dashboard/chaves/gerar?campanhaId=${campanhaId}` : "/dashboard/chaves/gerar"}
            className="inline-flex items-center gap-2 dash-btn-primary px-3 sm:px-4 py-2.5 rounded-xl text-sm">
            <Plus className="w-4 h-4" /><span>Gerar lote</span>
          </Link>
        </div>
      </div>

      {/* Lista de lotes */}
      {lotes.length === 0 ? (
        <div className="dash-card border-dashed p-12 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 dash-icon-blue">
            <Key className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold dash-title mb-2">Nenhum lote gerado</h2>
          <p className="dash-subtitle text-sm max-w-sm mx-auto mb-6">
            Gere um lote de chaves únicas para distribuir em uma campanha.
          </p>
          <Link href={campanhaId ? `/dashboard/chaves/gerar?campanhaId=${campanhaId}` : "/dashboard/chaves/gerar"}
            className="inline-flex items-center gap-2 dash-btn-primary px-6 py-3 rounded-xl text-sm">
            <Plus className="w-4 h-4" />Gerar primeiro lote
          </Link>
        </div>
      ) : (
        <div className="dash-card overflow-hidden">
          <div className="divide-y dash-divider">
            {lotes.map((lote) => {
              const stats     = statsByLote[lote.id] ?? {}
              const total     = lote._count.chaves
              const ativadas  = stats.ATIVADA   ?? 0
              const resgatadas= stats.RESGATADA  ?? 0
              const geradas   = stats.GERADA     ?? 0
              const expirado  = new Date() > new Date(lote.campanha.expiraEm)
              return (
                <Link key={lote.id} href={`/dashboard/chaves/lote/${lote.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:opacity-80 transition-opacity ${expirado ? "bg-red-50 dark:bg-red-500/10 text-red-400 dark:text-red-400" : "dash-icon-blue"}`}>
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-semibold dash-title text-sm">{lote.descricao ?? `Lote de ${total} chaves`}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LOTE_STATUS[lote.status]?.className ?? "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60"}`}>
                        {LOTE_STATUS[lote.status]?.label ?? lote.status}
                      </span>
                      {expirado && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                          Expirado
                        </span>
                      )}
                    </div>
                    <p className="text-xs dash-muted">
                      {lote.campanha.nome}
                      {" · "}
                      Criado {new Date(lote.criadoEm).toLocaleDateString("pt-BR")}
                      {" · "}
                      <span className={expirado ? "text-red-500 dark:text-red-400 font-medium" : ""}>
                        {expirado ? "Expirou" : "Válido até"}{" "}
                        {new Date(lote.campanha.expiraEm).toLocaleDateString("pt-BR")}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs flex-shrink-0 hidden sm:flex">
                    <div className="text-center">
                      <p className="font-semibold dash-title">{total}</p>
                      <p className="dash-muted">total</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-amber-600 dark:text-amber-400">{ativadas}</p>
                      <p className="dash-muted">ativadas</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">{resgatadas}</p>
                      <p className="dash-muted">resgatadas</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold dash-subtitle">{geradas}</p>
                      <p className="dash-muted">disponíveis</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 dark:text-white/20 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
