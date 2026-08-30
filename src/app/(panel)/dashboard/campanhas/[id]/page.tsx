import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { ChevronLeft, Pencil, Key, Calendar, Hash, ArrowRightLeft, AlertTriangle } from "lucide-react"
import { StatusBadge } from "../_components/status-badge"
import { TipoBeneficioBadge } from "../_components/tipo-beneficio-badge"
import { AcoesCampanha } from "../_components/acoes-campanha"

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs dash-muted mb-1">
        <span>{value.toLocaleString("pt-BR")}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default async function CampanhaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ migrado?: string }>
}) {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  const { id }       = await params
  const sp           = await searchParams
  const qtdMigrado   = sp.migrado ? parseInt(sp.migrado, 10) : 0

  const campanha = await db.campanha.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          chaves: true,
          lotes: true,
        },
      },
    },
  })

  if (!campanha || campanha.lojaId !== session.user.lojaId) notFound()

  const [geradas, ativadas, resgatadas, expiradas] = await Promise.all([
    db.chave.count({ where: { campanhaId: id, status: "GERADA" } }),
    db.chave.count({ where: { campanhaId: id, status: "ATIVADA" } }),
    db.chave.count({ where: { campanhaId: id, status: "RESGATADA" } }),
    db.chave.count({ where: { campanhaId: id, status: "EXPIRADA" } }),
  ])

  const totalGeradas  = campanha._count.chaves
  const encerrada     = campanha.status === "ENCERRADA" || campanha.status === "CANCELADA"
  const expirada      = new Date() > campanha.expiraEm
  const chavesPendentes = geradas + ativadas // ainda não resgatadas

  const taxaAtivacao =
    totalGeradas > 0 ? Math.round(((ativadas + resgatadas) / totalGeradas) * 100) : 0
  const taxaConversao =
    ativadas + resgatadas > 0 ? Math.round((resgatadas / (ativadas + resgatadas)) * 100) : 0

  return (
    <div className="w-full">
      {/* Breadcrumb */}
      <Link
        href="/dashboard/campanhas"
        className="inline-flex items-center gap-1.5 text-sm dash-muted hover:text-emerald-500 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Campanhas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold dash-title">{campanha.nome}</h1>
            <StatusBadge status={campanha.status} />
            {expirada && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                Expirada
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <TipoBeneficioBadge tipo={campanha.tipoBeneficio} />
            <span className={`text-sm font-medium ${expirada ? "text-red-500 dark:text-red-400" : "dash-muted"}`}>
              {new Date(campanha.inicioEm).toLocaleDateString("pt-BR")} →{" "}
              {new Date(campanha.expiraEm).toLocaleDateString("pt-BR")}
              {expirada && " (expirada)"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {!encerrada && !expirada && (
            <Link
              href={`/dashboard/campanhas/${id}/editar`}
              className="inline-flex items-center gap-2 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 dash-subtitle text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </Link>
          )}
          {(expirada || encerrada) && chavesPendentes > 0 && (
            <Link
              href={`/dashboard/campanhas/${id}/migrar`}
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-colors bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Migrar {chavesPendentes} chave{chavesPendentes !== 1 ? "s" : ""}
            </Link>
          )}
        </div>
      </div>

      {/* Banner de sucesso de migração */}
      {qtdMigrado > 0 && (
        <div className="flex items-center gap-3 mb-6 px-4 py-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
          <ArrowRightLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {qtdMigrado} chave{qtdMigrado !== 1 ? "s" : ""} migrada{qtdMigrado !== 1 ? "s" : ""} com sucesso!
            Os QR Codes nos cartões físicos agora apontam para esta campanha.
          </p>
        </div>
      )}

      {/* Banner de campanha expirada com chaves pendentes */}
      {(expirada || encerrada) && chavesPendentes > 0 && (
        <div className="flex items-start gap-3 mb-6 px-4 py-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {chavesPendentes} chave{chavesPendentes !== 1 ? "s" : ""} ainda não resgatada{chavesPendentes !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-0.5">
              Esta campanha expirou mas ainda há chaves que os clientes não usaram. Migre-as para uma campanha ativa — os QR Codes nos cartões físicos continuarão funcionando.
            </p>
          </div>
          <Link
            href={`/dashboard/campanhas/${id}/migrar`}
            className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors"
          >
            Migrar agora
          </Link>
        </div>
      )}

      {/* Ações de status */}
      <div className="mb-6">
        <AcoesCampanha campanhaId={id} status={campanha.status} />
      </div>

      {/* Stats de chaves */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Geradas",    value: geradas,    bar: "bg-gray-400 dark:bg-gray-500" },
          { label: "Ativadas",   value: ativadas,   bar: "bg-blue-400" },
          { label: "Resgatadas", value: resgatadas, bar: "bg-emerald-500" },
          { label: "Expiradas",  value: expiradas,  bar: "bg-red-400" },
        ].map((stat) => (
          <div key={stat.label} className="dash-card p-4 text-center">
            <p className="text-2xl font-bold dash-title">{stat.value}</p>
            <p className="text-xs dash-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Métricas */}
      <div className="dash-card p-4 sm:p-5 mb-6">
        <h2 className="font-semibold dash-title mb-4">Métricas</h2>
        <div className="space-y-5">
          <div>
            <div className="flex justify-between items-center text-sm">
              <span className="dash-subtitle">
                Chaves geradas ({totalGeradas} / {campanha.quantidadeChaves} planejadas)
              </span>
            </div>
            <ProgressBar
              value={totalGeradas}
              max={campanha.quantidadeChaves}
              color="bg-gray-400 dark:bg-gray-500"
            />
          </div>
          <div>
            <div className="flex justify-between items-center text-sm">
              <span className="dash-subtitle">Taxa de ativação</span>
            </div>
            <ProgressBar value={taxaAtivacao} max={100} color="bg-blue-400" />
          </div>
          <div>
            <div className="flex justify-between items-center text-sm">
              <span className="dash-subtitle">Taxa de conversão (ativadas → resgatadas)</span>
            </div>
            <ProgressBar value={taxaConversao} max={100} color="bg-emerald-500" />
          </div>
        </div>
      </div>

      {/* Detalhes da campanha */}
      <div className="dash-card p-4 sm:p-5 mb-6">
        <h2 className="font-semibold dash-title mb-4">Detalhes</h2>
        <dl className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <dt className="text-xs font-medium dash-muted uppercase tracking-wide mb-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Início
              </dt>
              <dd className="text-sm dash-subtitle">
                {new Date(campanha.inicioEm).toLocaleString("pt-BR")}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium dash-muted uppercase tracking-wide mb-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Expira
              </dt>
              <dd className="text-sm dash-subtitle">
                {new Date(campanha.expiraEm).toLocaleString("pt-BR")}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium dash-muted uppercase tracking-wide mb-0.5 flex items-center gap-1">
                <Hash className="w-3 h-3" /> Lotes
              </dt>
              <dd className="text-sm dash-subtitle">{campanha._count.lotes}</dd>
            </div>
          </div>
          {campanha.valorBeneficio !== null && (
            <div>
              <dt className="text-xs font-medium dash-muted uppercase tracking-wide mb-0.5">
                Valor do benefício
              </dt>
              <dd className="text-sm dash-subtitle">
                {campanha.tipoBeneficio === "DESCONTO_PERCENTUAL"
                  ? `${campanha.valorBeneficio}%`
                  : `R$ ${Number(campanha.valorBeneficio).toFixed(2)}`}
              </dd>
            </div>
          )}
          {campanha.descricaoPremio && (
            <div>
              <dt className="text-xs font-medium dash-muted uppercase tracking-wide mb-0.5">
                Prêmio
              </dt>
              <dd className="text-sm dash-subtitle">{campanha.descricaoPremio}</dd>
            </div>
          )}
          {campanha.descricao && (
            <div>
              <dt className="text-xs font-medium dash-muted uppercase tracking-wide mb-0.5">
                Descrição
              </dt>
              <dd className="text-sm dash-subtitle">{campanha.descricao}</dd>
            </div>
          )}
          {campanha.regrasUso && (
            <div>
              <dt className="text-xs font-medium dash-muted uppercase tracking-wide mb-0.5">
                Regras de uso
              </dt>
              <dd className="text-sm dash-subtitle whitespace-pre-line">{campanha.regrasUso}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Ação de gerar chaves */}
      <div className="dash-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-semibold dash-title">Chaves</h2>
            <p className="text-sm dash-muted mt-0.5">
              {totalGeradas === 0
                ? "Nenhum lote gerado ainda. Gere chaves para distribuir."
                : `${totalGeradas} chaves geradas em ${campanha._count.lotes} lote(s).`}
            </p>
          </div>
          <Link
            href={
              totalGeradas === 0
                ? `/dashboard/chaves/gerar?campanhaId=${id}`
                : `/dashboard/chaves?campanhaId=${id}`
            }
            className="inline-flex items-center justify-center gap-2 dash-btn-primary text-sm px-4 py-2.5 rounded-xl transition-colors w-full sm:w-auto"
          >
            <Key className="w-4 h-4" />
            {totalGeradas === 0 ? "Gerar chaves agora" : "Ver chaves"}
          </Link>
        </div>
      </div>
    </div>
  )
}
