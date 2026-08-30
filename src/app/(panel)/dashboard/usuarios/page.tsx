import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { Users } from "lucide-react"

const ROLE_CFG = {
  SUPER_ADMIN: { label: "Super Admin", className: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400" },
  LOJISTA:     { label: "Lojista",     className: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  CLIENTE:     { label: "Cliente",     className: "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60" },
} as const

type SearchParams = { role?: string }

export default async function UsuariosAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard")

  const params = await searchParams
  const roleFiltro = params.role ?? ""

  const usuarios = await db.user.findMany({
    where: roleFiltro ? { role: roleFiltro as never } : {},
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      ativo: true,
      criadoEm: true,
      ultimoAcesso: true,
      loja: { select: { nome: true } },
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold dash-title">Usuários</h1>
          <p className="dash-subtitle text-sm mt-0.5">{usuarios.length} usuários cadastrados</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mb-6">
        <div className="flex gap-1 bg-gray-100 dark:bg-white/[0.05] p-1 rounded-xl w-max">
          {[
            { value: "",           label: "Todos"      },
            { value: "SUPER_ADMIN", label: "Super Admin" },
            { value: "LOJISTA",    label: "Lojistas"   },
          ].map((tab) => (
            <a
              key={tab.value}
              href={tab.value ? `/dashboard/usuarios?role=${tab.value}` : "/dashboard/usuarios"}
              className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                roleFiltro === tab.value
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70"
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </div>

      {usuarios.length === 0 ? (
        <div className="dash-card border-dashed p-12 text-center">
          <Users className="w-8 h-8 dash-muted mx-auto mb-3" />
          <p className="dash-subtitle">Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <div className="dash-card overflow-hidden">
          <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
            {usuarios.map((u) => (
              <div key={u.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 dark:bg-white/[0.07] rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-gray-600 dark:text-white/60">
                  {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium dash-title truncate">
                      {u.name ?? u.email}
                    </p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_CFG[u.role as keyof typeof ROLE_CFG]?.className ?? ""}`}>
                      {ROLE_CFG[u.role as keyof typeof ROLE_CFG]?.label ?? u.role}
                    </span>
                    {!u.ativo && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="text-xs dash-muted truncate">
                    {u.email}
                    {u.loja && ` · ${u.loja.nome}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-xs dash-muted">
                    {u.ultimoAcesso
                      ? `Acesso ${new Date(u.ultimoAcesso).toLocaleDateString("pt-BR")}`
                      : `Cadastro ${new Date(u.criadoEm).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
