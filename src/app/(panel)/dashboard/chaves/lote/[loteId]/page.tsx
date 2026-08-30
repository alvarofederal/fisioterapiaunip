import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { ChevronLeft, Key, Calendar, Hash } from "lucide-react"
import { QrGrid } from "./_components/qr-grid"
import { ExportarCsv } from "./_components/exportar-csv"
import { CancelarLoteBtn } from "./_components/cancelar-lote-btn"
import { ImprimirBtn } from "./_components/imprimir-btn"

const PAGE_SIZE = 100

type SearchParams = { page?: string }

export default async function LoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ loteId: string }>
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  const { loteId } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? "1", 10))

  const lote = await db.loteChave.findUnique({
    where: { id: loteId },
    include: {
      campanha: { select: { id: true, nome: true, status: true, expiraEm: true } },
      geradoPor: { select: { name: true } },
    },
  })

  if (!lote || lote.lojaId !== session.user.lojaId) notFound()

  const totalChaves = await db.chave.count({ where: { loteId } })
  const totalPages = Math.ceil(totalChaves / PAGE_SIZE)

  const chavesRaw = await db.chave.findMany({
    where: { loteId },
    orderBy: { criadoEm: "asc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      codigo: true,
      status: true,
      criadoEm: true,
      landingUrl: true,
      resgate: {
        select: {
          beneficioEntregue: true,
          resgatadoEm: true,
          campanha: {
            select: {
              tipoBeneficio: true,
              valorBeneficio: true,
              descricaoPremio: true,
            },
          },
        },
      },
    },
  })

  // Normaliza Decimal → number para serialização segura
  const chaves = chavesRaw.map((c) => ({
    ...c,
    resgate: c.resgate
      ? {
          ...c.resgate,
          campanha: {
            ...c.resgate.campanha,
            valorBeneficio:
              c.resgate.campanha.valorBeneficio != null
                ? Number(c.resgate.campanha.valorBeneficio)
                : null,
          },
        }
      : null,
  }))

  // stats do lote inteiro
  const statsRaw = await db.chave.groupBy({
    by: ["status"],
    where: { loteId },
    _count: true,
  })
  const stats: Record<string, number> = {}
  for (const s of statsRaw) stats[s.status] = s._count

  const nomeLote = lote.descricao ?? `Lote de ${totalChaves} chaves`

  return (
    <div>
      {/* Breadcrumb */}
      <Link
        href={`/dashboard/chaves?campanhaId=${lote.campanhaId}`}
        className="inline-flex items-center gap-1.5 text-sm dash-muted hover:text-emerald-500 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Chaves — {lote.campanha.nome}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold dash-title">{nomeLote}</h1>
          <p className="dash-muted text-sm mt-0.5">
            Campanha:{" "}
            <Link
              href={`/dashboard/campanhas/${lote.campanha.id}`}
              className="text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              {lote.campanha.nome}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportarCsv loteId={loteId} />
          <ImprimirBtn loteId={loteId} />
          <CancelarLoteBtn loteId={loteId} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total",       value: totalChaves,          color: "dash-title" },
          { label: "Disponíveis", value: stats.GERADA ?? 0,    color: "dash-subtitle" },
          { label: "Ativadas",    value: stats.ATIVADA ?? 0,   color: "text-amber-500" },
          { label: "Resgatadas",  value: stats.RESGATADA ?? 0, color: "text-emerald-500" },
        ].map((s) => (
          <div key={s.label} className="dash-card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs dash-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Meta do lote */}
      {(() => {
        const expirado = new Date() > lote.campanha.expiraEm
        return (
          <div className={`dash-card p-5 mb-6 ${expirado ? "border-red-200 dark:border-red-500/30" : ""}`}>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm dash-muted">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Gerado em {new Date(lote.criadoEm).toLocaleString("pt-BR")}
              </div>
              {lote.geradoPor && (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Por {lote.geradoPor.name}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                {totalChaves} chaves
              </div>
              <div className={`flex items-center gap-2 font-medium ${
                expirado
                  ? "text-red-600 dark:text-red-400"
                  : new Date() > new Date(lote.campanha.expiraEm.getTime() - 3 * 24 * 60 * 60 * 1000)
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
              }`}>
                <Calendar className="w-4 h-4" />
                {expirado ? "Expirou em" : "Válidas até"}{" "}
                {new Date(lote.campanha.expiraEm).toLocaleDateString("pt-BR")}
                {expirado && (
                  <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                    Expirado
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Grid de chaves / QR codes */}
      <div className="dash-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold dash-title">
            Chaves{totalPages > 1 ? ` — página ${page} de ${totalPages}` : ""}
          </h2>
          {totalPages > 1 && (
            <div className="flex items-center gap-1 text-sm">
              {page > 1 && (
                <Link
                  href={`/dashboard/chaves/lote/${loteId}?page=${page - 1}`}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 dash-subtitle transition-colors"
                >
                  ← Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/dashboard/chaves/lote/${loteId}?page=${page + 1}`}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 dash-subtitle transition-colors"
                >
                  Próxima →
                </Link>
              )}
            </div>
          )}
        </div>

        <QrGrid chaves={chaves} expiraEm={lote.campanha.expiraEm} />

        {/* Paginação inferior */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/dashboard/chaves/lote/${loteId}?page=${p}`}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  p === page
                    ? "bg-emerald-500 text-white"
                    : "border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
