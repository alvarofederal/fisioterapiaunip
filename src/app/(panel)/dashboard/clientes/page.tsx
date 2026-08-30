import { redirect } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { Users, ChevronRight, QrCode, Globe, HandHelpingIcon } from "lucide-react"
import { BuscaInput } from "./_components/busca-input"

// ─── helpers ──────────────────────────────────────────────────────

const STATUS_CFG = {
  GERADA:     { label: "Gerada",     cls: "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/40" },
  CONSULTADA: { label: "Consultada", cls: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"   },
  ATIVADA:    { label: "Ativada",    cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  RESGATADA:  { label: "Resgatada",  cls: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  EXPIRADA:   { label: "Expirada",   cls: "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400"       },
  CANCELADA:  { label: "Cancelada",  cls: "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400"       },
} as const

const CANAL_CFG = {
  WEB:    { label: "Web",    icon: Globe    },
  QRCODE: { label: "QR",    icon: QrCode   },
  MANUAL: { label: "Manual", icon: HandHelpingIcon },
} as const

function fmtDate(d: Date | null) {
  if (!d) return "—"
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function initial(nome: string | null, email: string | null) {
  const src = nome ?? email ?? "?"
  return src[0].toUpperCase()
}

// ─── Page ────────────────────────────────────────────────────────

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>
}) {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  const lojaId = session.user.lojaId
  const sp     = await searchParams
  const busca  = sp.busca?.trim() ?? ""

  // ── Stats globais (independentes da busca) ────────────────────
  const [totalClientes, totalAtivadas, totalResgatadas] = await Promise.all([
    db.cliente.count({ where: { chaves: { some: { lojaId } } } }),
    db.chave.count({ where: { lojaId, status: "ATIVADA" } }),
    db.chave.count({ where: { lojaId, status: "RESGATADA" } }),
  ])

  // ── Lista de clientes (filtrada) ──────────────────────────────
  const clientes = await db.cliente.findMany({
    where: {
      chaves: { some: { lojaId } },
      ...(busca
        ? {
            OR: [
              { nome:     { contains: busca } },
              { email:    { contains: busca } },
              { telefone: { contains: busca } },
            ],
          }
        : {}),
    },
    include: {
      chaves: {
        where: { lojaId },
        select: {
          id: true,
          status: true,
          ativadaEm: true,
          campanha: { select: { id: true, nome: true } },
        },
        orderBy: { ativadaEm: "desc" },
      },
    },
    orderBy: { criadoEm: "desc" },
    take: 200,
  })

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="w-full">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold dash-title flex items-center gap-2">
          <Users className="w-6 h-6 text-emerald-500" />
          Clientes
        </h1>
        <p className="dash-muted text-sm mt-0.5">
          Clientes que ativaram chaves de suas campanhas.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Clientes únicos",  value: totalClientes,  color: "dash-title" },
          { label: "Chaves ativadas",  value: totalAtivadas,  color: "text-amber-600 dark:text-amber-400" },
          { label: "Chaves resgatadas",value: totalResgatadas, color: "text-emerald-600 dark:text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="dash-card p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs dash-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <Suspense>
          <BuscaInput />
        </Suspense>
        {busca && (
          <p className="text-sm dash-muted">
            {clientes.length} resultado{clientes.length !== 1 ? "s" : ""} para <strong className="dash-subtitle">&ldquo;{busca}&rdquo;</strong>
          </p>
        )}
      </div>

      {/* Lista */}
      {clientes.length === 0 ? (
        <div className="dash-card p-12 text-center">
          <Users className="w-10 h-10 dash-muted mx-auto mb-3 opacity-40" />
          <p className="dash-subtitle font-medium">
            {busca ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
          </p>
          <p className="text-sm dash-muted mt-1">
            {busca
              ? "Tente outros termos de busca."
              : "Os clientes aparecerão aqui conforme ativarem chaves de suas campanhas."}
          </p>
        </div>
      ) : (
        <div className="dash-card overflow-hidden">
          {/* Cabeçalho */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06] text-xs font-semibold dash-muted uppercase tracking-wide">
            <span className="col-span-4">Cliente</span>
            <span className="col-span-3 hidden sm:block">Contato</span>
            <span className="col-span-2 hidden sm:block">Canal</span>
            <span className="col-span-2">Chaves</span>
            <span className="col-span-1" />
          </div>

          <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
            {clientes.map((cliente) => {
              const chaves       = cliente.chaves
              const ativadas     = chaves.filter(c => c.status === "ATIVADA").length
              const resgatadas   = chaves.filter(c => c.status === "RESGATADA").length
              const expiradas    = chaves.filter(c => c.status === "EXPIRADA" || c.status === "CANCELADA").length
              const ultimaAtiv   = chaves.find(c => c.ativadaEm)?.ativadaEm ?? null
              const canalPrincipal = cliente.canalOrigem as keyof typeof CANAL_CFG
              const CanalIcon = CANAL_CFG[canalPrincipal]?.icon ?? null

              return (
                <Link
                  key={cliente.id}
                  href={`/dashboard/clientes/${cliente.id}`}
                  className="grid grid-cols-12 gap-2 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors items-center group"
                >
                  {/* Avatar + nome */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
                    >
                      {initial(cliente.nome, cliente.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium dash-subtitle truncate">
                        {cliente.nome ?? <span className="dash-muted italic">Sem nome</span>}
                      </p>
                      <p className="text-xs dash-muted truncate">{ultimaAtiv ? `Desde ${fmtDate(ultimaAtiv)}` : "—"}</p>
                    </div>
                  </div>

                  {/* Contato */}
                  <div className="col-span-3 hidden sm:block min-w-0">
                    <p className="text-sm dash-subtitle truncate">{cliente.email ?? "—"}</p>
                    <p className="text-xs dash-muted truncate">{cliente.telefone ?? "—"}</p>
                  </div>

                  {/* Canal */}
                  <div className="col-span-2 hidden sm:flex items-center gap-1.5">
                    {CanalIcon && <CanalIcon className="w-3.5 h-3.5 dash-muted flex-shrink-0" />}
                    <span className="text-xs dash-muted">{canalPrincipal ? CANAL_CFG[canalPrincipal]?.label : "—"}</span>
                  </div>

                  {/* Chaves — badges de status */}
                  <div className="col-span-2 flex flex-wrap gap-1 items-center">
                    {resgatadas > 0 && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CFG.RESGATADA.cls}`}>
                        {resgatadas}✓
                      </span>
                    )}
                    {ativadas > 0 && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CFG.ATIVADA.cls}`}>
                        {ativadas}
                      </span>
                    )}
                    {expiradas > 0 && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CFG.EXPIRADA.cls}`}>
                        {expiradas}
                      </span>
                    )}
                    {chaves.length === 0 && <span className="text-xs dash-muted">—</span>}
                  </div>

                  {/* Chevron */}
                  <div className="col-span-1 flex justify-end">
                    <ChevronRight className="w-4 h-4 dash-muted group-hover:text-emerald-500 transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>

          {clientes.length >= 200 && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-white/[0.06] text-xs dash-muted text-center">
              Exibindo os 200 clientes mais recentes. Use a busca para refinar.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
