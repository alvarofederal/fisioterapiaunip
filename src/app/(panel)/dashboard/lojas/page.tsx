import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { Building2, ArrowRight, Search } from "lucide-react"

const PLANO_CFG = {
  ESSENCIAL:    { label: "Essencial",    className: "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60" },
  PROFISSIONAL: { label: "Profissional", className: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  EMPRESARIAL:  { label: "Empresarial",  className: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
} as const

const STATUS_CFG = {
  ATIVA:     { label: "Ativa",     className: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  SUSPENSA:  { label: "Suspensa",  className: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  CANCELADA: { label: "Cancelada", className: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" },
} as const

type SearchParams = { q?: string; status?: string }

export default async function LojasAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard")

  const params = await searchParams
  const q = params.q ?? ""
  const statusFiltro = params.status ?? ""

  const lojas = await db.loja.findMany({
    where: {
      ...(q ? { nome: { contains: q } } : {}),
      ...(statusFiltro ? { status: statusFiltro as never } : {}),
    },
    orderBy: { criadoEm: "desc" },
    include: {
      _count: { select: { usuarios: true, campanhas: true, chaves: true } },
    },
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold dash-title">Lojas</h1>
          <p className="dash-subtitle text-sm mt-0.5">{lojas.length} lojas cadastradas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form className="flex-1 sm:max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dash-muted pointer-events-none" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome..."
            className="w-full dash-input pl-9 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          {statusFiltro && <input type="hidden" name="status" value={statusFiltro} />}
        </form>

        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="flex gap-1 bg-gray-100 dark:bg-white/[0.05] p-1 rounded-xl w-max">
            {[
              { value: "",         label: "Todas"     },
              { value: "ATIVA",    label: "Ativas"    },
              { value: "SUSPENSA", label: "Suspensas" },
            ].map((tab) => (
              <Link
                key={tab.value}
                href={
                  tab.value
                    ? `/dashboard/lojas?status=${tab.value}${q ? `&q=${q}` : ""}`
                    : `/dashboard/lojas${q ? `?q=${q}` : ""}`
                }
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  statusFiltro === tab.value
                    ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Lista */}
      {lojas.length === 0 ? (
        <div className="dash-card border-dashed p-12 text-center">
          <Building2 className="w-8 h-8 dash-muted mx-auto mb-3" />
          <p className="dash-subtitle">Nenhuma loja encontrada.</p>
        </div>
      ) : (
        <div className="dash-card overflow-hidden">
          <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
            {lojas.map((loja) => (
              <Link
                key={loja.id}
                href={`/dashboard/lojas/${loja.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
              >
                {/* Avatar */}
                <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-white/10">
                  {loja.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={loja.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <Building2 className="w-5 h-5 text-gray-400 dark:text-white/30" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-semibold dash-title text-sm truncate">{loja.nome}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CFG[loja.status]?.className ?? ""}`}>
                      {STATUS_CFG[loja.status]?.label ?? loja.status}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLANO_CFG[loja.plano]?.className ?? ""}`}>
                      {PLANO_CFG[loja.plano]?.label ?? loja.plano}
                    </span>
                  </div>
                  <p className="text-xs dash-muted">
                    {loja.email} · Criada {new Date(loja.criadoEm).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                {/* Contadores */}
                <div className="hidden sm:flex items-center gap-4 text-xs flex-shrink-0">
                  {[
                    { value: loja._count.usuarios,  label: "usuários"  },
                    { value: loja._count.campanhas, label: "campanhas" },
                    { value: loja._count.chaves,    label: "chaves"    },
                  ].map((c) => (
                    <div key={c.label} className="text-center">
                      <p className="font-semibold dash-title">{c.value}</p>
                      <p className="dash-muted">{c.label}</p>
                    </div>
                  ))}
                </div>

                <ArrowRight className="w-4 h-4 text-gray-300 dark:text-white/20 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
