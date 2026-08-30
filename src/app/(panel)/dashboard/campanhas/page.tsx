import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { Plus, Megaphone, ArrowRight, AlertTriangle, Clock } from "lucide-react"
import { StatusBadge } from "./_components/status-badge"
import { TipoBeneficioBadge } from "./_components/tipo-beneficio-badge"

const STATUS_TABS = [
  { value: "",           label: "Todas"      },
  { value: "ATIVA",     label: "Ativas"     },
  { value: "PAUSADA",   label: "Pausadas"   },
  { value: "RASCUNHO",  label: "Rascunho"   },
  { value: "ENCERRADA", label: "Encerradas" },
] as const

type SearchParams = { status?: string }

export default async function CampanhasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  const params       = await searchParams
  const statusFilter = params.status ?? ""

  const campanhas = await db.campanha.findMany({
    where: { lojaId: session.user.lojaId!, ...(statusFilter ? { status: statusFilter as never } : {}) },
    orderBy: { criadoEm: "desc" },
    select: {
      id: true, nome: true, tipoBeneficio: true, status: true,
      inicioEm: true, expiraEm: true, quantidadeChaves: true,
      _count: { select: { chaves: true } },
    },
  })

  const agora = new Date()

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold dash-title">Campanhas</h1>
          <p className="dash-subtitle text-sm mt-0.5">Gerencie suas campanhas promocionais com chaves únicas</p>
        </div>
        <Link href="/dashboard/campanhas/nova"
          className="flex-shrink-0 inline-flex items-center gap-2 dash-btn-primary px-3 sm:px-4 py-2.5 rounded-xl text-sm">
          <Plus className="w-4 h-4" /><span>Nova campanha</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mb-6">
        <div className="flex gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-max">
          {STATUS_TABS.map((tab) => (
            <Link key={tab.value}
              href={tab.value ? `/dashboard/campanhas?status=${tab.value}` : "/dashboard/campanhas"}
              className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-white/45 hover:text-gray-700 dark:hover:text-white"
              }`}>
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Lista */}
      {campanhas.length === 0 ? (
        <div className="dash-card border-dashed p-12 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 dash-icon-emerald">
            <Megaphone className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold dash-title mb-2">
            {statusFilter ? "Nenhuma campanha com este status" : "Nenhuma campanha criada ainda"}
          </h2>
          <p className="dash-subtitle text-sm max-w-sm mx-auto mb-6">
            {statusFilter
              ? "Tente outro filtro ou crie uma nova campanha."
              : "Crie sua primeira campanha para começar a distribuir chaves promocionais."}
          </p>
          {!statusFilter && (
            <Link href="/dashboard/campanhas/nova"
              className="inline-flex items-center gap-2 dash-btn-primary px-6 py-3 rounded-xl text-sm">
              <Plus className="w-4 h-4" />Criar campanha
            </Link>
          )}
        </div>
      ) : (
        <div className="dash-card overflow-hidden">
          <div className="divide-y dash-divider">
            {campanhas.map((c) => {
              const expirado      = agora > new Date(c.expiraEm)
              const expiraEm3dias = !expirado && agora > new Date(new Date(c.expiraEm).getTime() - 3 * 24 * 60 * 60 * 1000)
              const vigente       = !expirado && agora >= new Date(c.inicioEm)
              const naoIniciada   = !expirado && agora < new Date(c.inicioEm)

              return (
                <Link key={c.id} href={`/dashboard/campanhas/${c.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors group">

                  {/* Ícone com cor de estado */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:opacity-80 transition-opacity ${
                    expirado ? "bg-red-50 dark:bg-red-500/10 text-red-400" :
                    expiraEm3dias ? "bg-amber-50 dark:bg-amber-500/10 text-amber-500" :
                    "dash-icon-emerald"
                  }`}>
                    {expirado ? <AlertTriangle className="w-5 h-5" /> :
                     expiraEm3dias ? <Clock className="w-5 h-5" /> :
                     <Megaphone className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-semibold dash-title text-sm truncate">{c.nome}</p>
                      <StatusBadge status={c.status} />
                      {/* Badge de vigência */}
                      {expirado && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                          Expirada
                        </span>
                      )}
                      {expiraEm3dias && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                          Expira em breve
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs dash-muted flex-wrap">
                      <TipoBeneficioBadge tipo={c.tipoBeneficio} />
                      {/* Datas com cor */}
                      <span className={
                        expirado      ? "text-red-500 dark:text-red-400 font-medium" :
                        expiraEm3dias ? "text-amber-600 dark:text-amber-400 font-medium" :
                        naoIniciada   ? "dash-muted" :
                        "text-emerald-600 dark:text-emerald-500 font-medium"
                      }>
                        {expirado      ? "Expirou" :
                         naoIniciada   ? "Início" :
                         vigente       ? "Vigente até" :
                         "Válida até"}{" "}
                        {new Date(c.expiraEm).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="dash-muted">
                        Criada {new Date(c.inicioEm).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  {/* Contadores */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-sm font-semibold dash-title">{c._count.chaves} / {c.quantidadeChaves}</p>
                    <p className="text-xs dash-muted">chaves geradas</p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-gray-300 dark:text-white/20 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
