import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { ChevronLeft, Building2, Key, Megaphone, Users, ShoppingBag } from "lucide-react"

const PLANO_CFG = {
  ESSENCIAL:    { label: "Essencial",    className: "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60" },
  PROFISSIONAL: { label: "Profissional", className: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  EMPRESARIAL:  { label: "Empresarial",  className: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
} as const

const STATUS_CAMPANHA = {
  RASCUNHO:  { label: "Rascunho",  className: "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60" },
  ATIVA:     { label: "Ativa",     className: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  PAUSADA:   { label: "Pausada",   className: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  ENCERRADA: { label: "Encerrada", className: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" },
  CANCELADA: { label: "Cancelada", className: "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30" },
} as const

export default async function LojaAdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard")

  const { id } = await params

  const loja = await db.loja.findUnique({
    where: { id },
    include: {
      usuarios: {
        select: { id: true, name: true, email: true, role: true, criadoEm: true },
        orderBy: { criadoEm: "asc" },
      },
      campanhas: {
        select: { id: true, nome: true, status: true, quantidadeChaves: true, criadoEm: true },
        orderBy: { criadoEm: "desc" },
        take: 10,
      },
      _count: { select: { chaves: true, resgates: true, lotes: true } },
    },
  })

  if (!loja) notFound()

  return (
    <div className="w-full">
      <Link
        href="/dashboard/lojas"
        className="inline-flex items-center gap-1.5 text-sm dash-muted hover:text-emerald-500 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Lojas
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-white/10">
          {loja.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={loja.logoUrl} alt="" className="w-14 h-14 rounded-2xl object-cover" />
          ) : (
            <Building2 className="w-7 h-7 text-gray-400 dark:text-white/30" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h1 className="text-2xl font-bold dash-title">{loja.nome}</h1>
            <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${PLANO_CFG[loja.plano]?.className ?? ""}`}>
              {PLANO_CFG[loja.plano]?.label ?? loja.plano}
            </span>
          </div>
          <p className="text-sm dash-subtitle">{loja.email}</p>
          {loja.cidade && (
            <p className="text-sm dash-muted">
              {loja.cidade}{loja.estado ? `, ${loja.estado}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Usuários",  value: loja.usuarios.length,  icon: Users,       color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" },
          { label: "Campanhas", value: loja.campanhas.length, icon: Megaphone,   color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Chaves",    value: loja._count.chaves,    icon: Key,         color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10" },
          { label: "Resgates",  value: loja._count.resgates,  icon: ShoppingBag, color: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10" },
        ].map((s) => (
          <div key={s.label} className="dash-card p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold dash-title">{s.value}</p>
            <p className="text-xs dash-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Usuários + Campanhas recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="dash-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.07]">
            <h2 className="font-semibold dash-title">Usuários</h2>
          </div>
          {loja.usuarios.length === 0 ? (
            <p className="px-5 py-6 text-sm dash-muted text-center">Nenhum usuário.</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {loja.usuarios.map((u) => (
                <div key={u.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium dash-title truncate">{u.name ?? u.email}</p>
                    <p className="text-xs dash-muted truncate">{u.email}</p>
                  </div>
                  <span className="text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60 px-2 py-0.5 rounded-full flex-shrink-0">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.07]">
            <h2 className="font-semibold dash-title">Campanhas recentes</h2>
          </div>
          {loja.campanhas.length === 0 ? (
            <p className="px-5 py-6 text-sm dash-muted text-center">Nenhuma campanha.</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {loja.campanhas.map((c) => (
                <div key={c.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium dash-title truncate">{c.nome}</p>
                    <p className="text-xs dash-muted">
                      {c.quantidadeChaves} chaves · {new Date(c.criadoEm).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_CAMPANHA[c.status]?.className ?? ""}`}>
                    {STATUS_CAMPANHA[c.status]?.label ?? c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
