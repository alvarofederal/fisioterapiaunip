import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import {
  ArrowLeft, QrCode, Globe, HandHelpingIcon,
  CheckCircle2, Clock, AlertTriangle, XCircle, Sparkles,
  Mail, Phone, Calendar, User,
} from "lucide-react"

// ─── helpers ──────────────────────────────────────────────────────

const STATUS_CFG = {
  GERADA:     { label: "Gerada",     icon: Clock,         cls: "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/40",           iconCls: "text-gray-400 dark:text-white/30" },
  CONSULTADA: { label: "Consultada", icon: Sparkles,      cls: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",             iconCls: "text-blue-400" },
  ATIVADA:    { label: "Ativada",    icon: Clock,         cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",          iconCls: "text-amber-400" },
  RESGATADA:  { label: "Resgatada",  icon: CheckCircle2,  cls: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",  iconCls: "text-emerald-500" },
  EXPIRADA:   { label: "Expirada",   icon: AlertTriangle, cls: "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400",                 iconCls: "text-red-400" },
  CANCELADA:  { label: "Cancelada",  icon: XCircle,       cls: "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400",                 iconCls: "text-red-400" },
} as const

const CANAL_CFG = {
  WEB:    { label: "Web",    icon: Globe           },
  QRCODE: { label: "QR Code", icon: QrCode         },
  MANUAL: { label: "Manual", icon: HandHelpingIcon },
} as const

const BENEFICIO_LABELS: Record<string, string> = {
  DESCONTO_PERCENTUAL: "Desconto %",
  DESCONTO_FIXO:       "Desconto fixo",
  BRINDE:              "Brinde",
  SORTEIO:             "Sorteio",
  FRETE_GRATIS:        "Frete grátis",
  CASHBACK:            "Cashback",
}

function fmtDate(d: Date | null) {
  if (!d) return "—"
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function fmtDateTime(d: Date | null) {
  if (!d) return "—"
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function initial(nome: string | null, email: string | null) {
  return (nome ?? email ?? "?")[0].toUpperCase()
}

// ─── Page ────────────────────────────────────────────────────────

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  const lojaId = session.user.lojaId
  const { id } = await params

  // Busca cliente + chaves que pertencem a esta loja
  const cliente = await db.cliente.findUnique({
    where: { id },
    include: {
      chaves: {
        where: { lojaId },
        include: {
          campanha: {
            select: { id: true, nome: true, tipoBeneficio: true, valorBeneficio: true },
          },
          resgate: {
            select: {
              resgatadoEm: true,
              canal: true,
              beneficioEntregue: true,
              observacao: true,
            },
          },
        },
        orderBy: { criadoEm: "desc" },
      },
    },
  })

  // Garante que o cliente existe e tem chaves desta loja
  if (!cliente || cliente.chaves.length === 0) notFound()

  // Stats
  const total      = cliente.chaves.length
  const ativadas   = cliente.chaves.filter(c => c.status === "ATIVADA").length
  const resgatadas = cliente.chaves.filter(c => c.status === "RESGATADA").length
  const expiradas  = cliente.chaves.filter(c => c.status === "EXPIRADA" || c.status === "CANCELADA").length

  // Campanhas distintas
  const campanhasSet = new Map(
    cliente.chaves.map(c => [c.campanha.id, c.campanha.nome])
  )

  return (
    <div className="w-full max-w-4xl mx-auto">

      {/* Volta */}
      <Link
        href="/dashboard/clientes"
        className="inline-flex items-center gap-1.5 text-sm dash-muted hover:text-emerald-500 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Clientes
      </Link>

      {/* Header do cliente */}
      <div className="dash-card p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl font-black"
            style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
          >
            {initial(cliente.nome, cliente.email)}
          </div>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold dash-title truncate">
              {cliente.nome ?? <span className="text-gray-400 dark:text-white/30 italic font-normal">Sem nome cadastrado</span>}
            </h1>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-2">
              {cliente.email && (
                <span className="flex items-center gap-1.5 text-sm dash-muted">
                  <Mail className="w-3.5 h-3.5" /> {cliente.email}
                </span>
              )}
              {cliente.telefone && (
                <span className="flex items-center gap-1.5 text-sm dash-muted">
                  <Phone className="w-3.5 h-3.5" /> {cliente.telefone}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm dash-muted">
                <Calendar className="w-3.5 h-3.5" /> Cliente desde {fmtDate(cliente.criadoEm)}
              </span>
              {cliente.documento && (
                <span className="flex items-center gap-1.5 text-sm dash-muted">
                  <User className="w-3.5 h-3.5" /> {cliente.documento}
                </span>
              )}
              {(() => {
                const canalCfg = CANAL_CFG[cliente.canalOrigem as keyof typeof CANAL_CFG]
                const Icon = canalCfg?.icon
                return Icon ? (
                  <span className="flex items-center gap-1.5 text-sm dash-muted">
                    <Icon className="w-3.5 h-3.5" /> Veio via {canalCfg.label}
                  </span>
                ) : null
              })()}
            </div>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-100 dark:border-white/[0.06]">
          {[
            { label: "Total de chaves",     value: total,      color: "dash-title" },
            { label: "Ativadas",            value: ativadas,   color: "text-amber-600 dark:text-amber-400" },
            { label: "Resgatadas",          value: resgatadas, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Exp. / canceladas",   value: expiradas,  color: expiradas > 0 ? "text-red-500 dark:text-red-400" : "dash-title" },
          ].map((s) => (
            <div key={s.label} className="text-center p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05]">
              <p className={`text-2xl font-black leading-none ${s.color}`}>{s.value}</p>
              <p className="text-xs dash-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Campanhas participadas */}
        {campanhasSet.size > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from(campanhasSet.entries()).map(([cid, nome]) => (
              <Link
                key={cid}
                href={`/dashboard/campanhas/${cid}`}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.06] dash-subtitle hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                {nome}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Tabela de chaves */}
      <div className="dash-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h2 className="font-semibold dash-title">Chaves deste cliente</h2>
          <p className="text-xs dash-muted mt-0.5">{total} chave{total !== 1 ? "s" : ""} no total</p>
        </div>

        {/* Cabeçalho */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06] text-xs font-semibold dash-muted uppercase tracking-wide">
          <span className="col-span-5">Código / Campanha</span>
          <span className="col-span-3">Ativada em</span>
          <span className="col-span-2">Resgatada em</span>
          <span className="col-span-2">Status</span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
          {cliente.chaves.map((chave) => {
            const cfg        = STATUS_CFG[chave.status] ?? STATUS_CFG.GERADA
            const StatusIcon = cfg.icon

            return (
              <div key={chave.id} className="divide-y divide-gray-100 dark:divide-white/[0.03]">
                {/* Linha principal */}
                <div className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center text-sm">
                  <div className="col-span-5 min-w-0">
                    <code className="text-xs font-mono font-semibold dash-subtitle block truncate">{chave.codigo}</code>
                    <p className="text-xs dash-muted truncate mt-0.5">{chave.campanha.nome}</p>
                    {chave.campanha.tipoBeneficio && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400">
                        {BENEFICIO_LABELS[chave.campanha.tipoBeneficio] ?? chave.campanha.tipoBeneficio}
                        {chave.campanha.valorBeneficio
                          ? chave.campanha.tipoBeneficio === "DESCONTO_PERCENTUAL"
                            ? ` ${chave.campanha.valorBeneficio}%`
                            : ` R$ ${Number(chave.campanha.valorBeneficio).toFixed(2)}`
                          : ""}
                      </span>
                    )}
                  </div>

                  <div className="col-span-3">
                    <span className="text-xs dash-muted">{fmtDateTime(chave.ativadaEm)}</span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-xs dash-muted">{fmtDateTime(chave.resgatadaEm)}</span>
                  </div>

                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>
                      <StatusIcon className={`w-3 h-3 ${cfg.iconCls}`} />
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Detalhe do resgate (se houver) */}
                {chave.resgate && (
                  <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-500/[0.04] flex flex-wrap gap-x-6 gap-y-1">
                    <span className="text-xs dash-muted">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">Resgatado em:</span>{" "}
                      {fmtDateTime(chave.resgate.resgatadoEm)}
                    </span>
                    {chave.resgate.beneficioEntregue && (
                      <span className="text-xs dash-muted">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">Benefício:</span>{" "}
                        {chave.resgate.beneficioEntregue}
                      </span>
                    )}
                    {chave.resgate.observacao && (
                      <span className="text-xs dash-muted">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">Obs:</span>{" "}
                        {chave.resgate.observacao}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
