import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import {
  ChevronLeft, Store, Megaphone, Layers, Key, Printer, Calendar,
  Mail, Phone, Globe, MapPin, Clock, CheckCircle2, XCircle, Search, Truck, Banknote,
} from "lucide-react"
import { AdminStatusForm } from "./_components/admin-status-form"
import { adminAtualizarSolicitacao } from "../../../impressao/_actions/impressao-actions"

// ─────────────────────────────────────────
// STATUS
// ─────────────────────────────────────────

const STATUS_CONFIG = {
  PENDENTE:             { label: "Pendente",           icon: Clock,         color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200"   },
  EM_ANALISE:           { label: "Em análise",         icon: Search,        color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200"    },
  AGUARDANDO_PAGAMENTO: { label: "Aguard. pagamento",  icon: Banknote,      color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200"  },
  APROVADA:             { label: "Aprovada",           icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  REJEITADA:            { label: "Rejeitada",          icon: XCircle,       color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200"     },
  IMPRESSA:             { label: "Impressa",           icon: Printer,       color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200"  },
  ENTREGUE:             { label: "Entregue",           icon: Truck,         color: "text-gray-500",    bg: "bg-gray-50",    border: "border-gray-200"    },
} as const

type StatusKey = keyof typeof STATUS_CONFIG

const TAMANHO_LABEL: Record<string, string> = {
  MINI:    "Mini 63×38 mm",
  CARTAO:  "Cartão 70×35 mm",
  PADRAO:  "Padrão 85×55 mm",
  COUPON:  "Cupom 95×68 mm",
  VOUCHER: "Voucher 190×68 mm",
  MEIO_A4: "Meio A4 190×138 mm",
  MDF:     "MDF 90×90 mm",
}

const STATUS_FLOW: StatusKey[] = ["PENDENTE", "EM_ANALISE", "AGUARDANDO_PAGAMENTO", "APROVADA", "IMPRESSA", "ENTREGUE"]

// ─────────────────────────────────────────
// INFO CARD COMPONENT
// ─────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-3.5 h-3.5 dash-muted flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs dash-muted">{label}</p>
        <p className="text-sm dash-title">{value}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────

export default async function AdminImpressaoDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard")

  const { id } = await params

  const sol = await db.solicitacaoImpressao.findUnique({
    where: { id },
    include: {
      loja: {
        select: {
          id: true,
          nome: true,
          nomeExibicao: true,
          email: true,
          telefone: true,
          siteUrl: true,
          logradouro: true,
          numero: true,
          complemento: true,
          bairro: true,
          cidade: true,
          estado: true,
          cep: true,
          plano: true,
          logoUrl: true,
          criadoEm: true,
          _count: { select: { campanhas: true, chaves: true, resgates: true } },
        },
      },
      campanha: {
        select: {
          id: true,
          nome: true,
          status: true,
          tipoBeneficio: true,
          inicioEm: true,
          expiraEm: true,
          quantidadeChaves: true,
          _count: { select: { chaves: true, resgates: true } },
        },
      },
      layout: {
        select: {
          nome: true,
          corPrimaria: true,
          corFundo: true,
          corTexto: true,
          tamanhoCard: true,
          estiloCard: true,
          padrao: true,
        },
      },
      lote: {
        select: {
          descricao: true,
          quantidade: true,
          formatoSaida: true,
          criadoEm: true,
          status: true,
          _count: { select: { chaves: true } },
        },
      },
      aprovadoPor:            { select: { name: true, email: true } },
      pagamentoConfirmadoPor: { select: { name: true, email: true } },
    },
  })

  if (!sol) notFound()

  const cfg = STATUS_CONFIG[sol.status as StatusKey] ?? STATUS_CONFIG.PENDENTE
  const StatusIcon = cfg.icon
  const nomeLoja = sol.loja.nomeExibicao ?? sol.loja.nome

  const enderecoLoja = [
    sol.loja.logradouro,
    sol.loja.numero,
    sol.loja.complemento,
    sol.loja.bairro,
    sol.loja.cidade,
    sol.loja.estado,
    sol.loja.cep,
  ].filter(Boolean).join(", ")

  return (
    <div>
      {/* Back */}
      <Link
        href="/dashboard/admin/impressoes"
        className="inline-flex items-center gap-1.5 text-sm dash-muted hover:dash-subtitle mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Impressões
      </Link>

      {/* Header da solicitação */}
      <div className="dash-card p-6 mb-6">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold dash-title">{nomeLoja}</h1>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                <StatusIcon className="w-3 h-3" />
                {cfg.label}
              </span>
            </div>
            <p className="text-sm dash-muted">
              Solicitação #{sol.id.slice(-8).toUpperCase()} · recebida em{" "}
              {new Date(sol.criadoEm).toLocaleDateString("pt-BR", {
                day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>

          {/* Números de destaque */}
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold dash-title">{sol.quantidadeCards}</p>
              <p className="text-xs dash-muted">cards</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold dash-title">{sol.folhasEstimadas}</p>
              <p className="text-xs dash-muted">folha{sol.folhasEstimadas !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {/* Timeline de status */}
        <div className="mt-6 flex items-center gap-0">
          {STATUS_FLOW.map((s, i) => {
            const c = STATUS_CONFIG[s]
            const isActive = sol.status === s
            const isPast = STATUS_FLOW.indexOf(sol.status as StatusKey) > i
            const isLast = i === STATUS_FLOW.length - 1

            return (
              <div key={s} className="flex items-center flex-1 min-w-0">
                <div className={`flex flex-col items-center min-w-0 ${isLast ? "flex-none" : "flex-1"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                    isActive
                      ? `${c.bg} ${c.border}`
                      : isPast
                      ? "bg-emerald-100 border-emerald-400"
                      : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  }`}>
                    {isPast
                      ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      : <c.icon className={`w-3 h-3 ${isActive ? c.color : "text-gray-300 dark:text-white/20"}`} />
                    }
                  </div>
                  <p className={`text-[10px] mt-1 font-medium text-center leading-tight ${
                    isActive ? c.color : isPast ? "text-emerald-600 dark:text-emerald-400" : "dash-muted"
                  }`}>
                    {c.label}
                  </p>
                </div>
                {!isLast && (
                  <div className={`h-0.5 flex-1 mx-1 rounded-full ${isPast ? "bg-emerald-400" : "bg-gray-200 dark:bg-white/10"}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Botão de visualização do arquivo de impressão */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <Link
          href={`/dashboard/admin/impressoes/${id}/imprimir`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
        >
          <Printer className="w-4 h-4" />
          Ver arquivo de impressão
        </Link>
        <p className="text-xs dash-muted">
          Visualize exatamente como o lojista vê o arquivo — com todos os cards e QR codes prontos para impressão.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coluna esquerda — contexto da loja */}
        <div className="lg:col-span-1 space-y-4">

          {/* Perfil da loja */}
          <div className="dash-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Store className="w-4 h-4 dash-muted" />
              <h2 className="text-sm font-semibold dash-title">Loja</h2>
            </div>
            {sol.loja.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sol.loja.logoUrl} alt="" className="w-14 h-14 rounded-xl object-cover mb-3 border border-black/5 dark:border-white/10" />
            )}
            <p className="text-base font-bold dash-title mb-3">{nomeLoja}</p>
            <div className="space-y-2.5">
              <InfoRow icon={Mail}   label="E-mail"   value={sol.loja.email} />
              <InfoRow icon={Phone}  label="Telefone" value={sol.loja.telefone} />
              <InfoRow icon={Globe}  label="Site"     value={sol.loja.siteUrl} />
              <InfoRow icon={MapPin} label="Endereço" value={enderecoLoja || null} />
              <InfoRow icon={Calendar} label="Cliente desde" value={new Date(sol.loja.criadoEm).toLocaleDateString("pt-BR")} />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-sm font-bold dash-title">{sol.loja._count.campanhas}</p>
                <p className="text-xs dash-muted">campanhas</p>
              </div>
              <div>
                <p className="text-sm font-bold dash-title">{sol.loja._count.chaves}</p>
                <p className="text-xs dash-muted">chaves</p>
              </div>
              <div>
                <p className="text-sm font-bold dash-title">{sol.loja._count.resgates}</p>
                <p className="text-xs dash-muted">resgates</p>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 dash-muted">
                Plano {sol.loja.plano}
              </span>
            </div>
          </div>

          {/* Campanha */}
          <div className="dash-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-4 h-4 dash-muted" />
              <h2 className="text-sm font-semibold dash-title">Campanha</h2>
            </div>
            <p className="text-sm font-semibold dash-title mb-2">{sol.campanha.nome}</p>
            <div className="space-y-1.5 text-xs dash-muted">
              <p>Status: <span className="font-medium dash-subtitle">{sol.campanha.status}</span></p>
              <p>Tipo: <span className="font-medium dash-subtitle">{sol.campanha.tipoBeneficio.replace(/_/g, " ")}</span></p>
              <p>Chaves: <span className="font-medium dash-subtitle">{sol.campanha._count.chaves} / {sol.campanha.quantidadeChaves}</span></p>
              <p>Resgates: <span className="font-medium dash-subtitle">{sol.campanha._count.resgates}</span></p>
              <p>Vigência: <span className="font-medium dash-subtitle">
                {new Date(sol.campanha.inicioEm).toLocaleDateString("pt-BR")} → {new Date(sol.campanha.expiraEm).toLocaleDateString("pt-BR")}
              </span></p>
            </div>
          </div>
        </div>

        {/* Coluna central — detalhes do pedido */}
        <div className="lg:col-span-1 space-y-4">

          {/* Layout */}
          <div className="dash-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 dash-muted" />
              <h2 className="text-sm font-semibold dash-title">Layout</h2>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-xl flex-shrink-0 border border-black/5 dark:border-white/10"
                style={{ backgroundColor: sol.layout.corPrimaria }}
              />
              <div>
                <p className="text-sm font-semibold dash-title">
                  {sol.layout.nome} {sol.layout.padrao && "⭐"}
                </p>
                <p className="text-xs dash-muted">{TAMANHO_LABEL[sol.layout.tamanhoCard] ?? sol.layout.tamanhoCard}</p>
                <p className="text-xs dash-muted">{sol.layout.estiloCard}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              {[sol.layout.corPrimaria, sol.layout.corFundo, sol.layout.corTexto].map((c, i) => (
                <div key={i} title={c}
                  className="w-8 h-8 rounded-lg border border-black/5 dark:border-white/10"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Lote */}
          <div className="dash-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 dash-muted" />
              <h2 className="text-sm font-semibold dash-title">Lote de chaves</h2>
            </div>
            <div className="space-y-1.5 text-xs dash-muted">
              <p>Descrição: <span className="font-medium dash-subtitle">{sol.lote.descricao || "—"}</span></p>
              <p>Quantidade: <span className="font-medium dash-subtitle">{sol.lote.quantidade} chaves</span></p>
              <p>Formato: <span className="font-medium dash-subtitle">{sol.lote.formatoSaida}</span></p>
              <p>Status: <span className="font-medium dash-subtitle">{sol.lote.status}</span></p>
              <p>Gerado em: <span className="font-medium dash-subtitle">{new Date(sol.lote.criadoEm).toLocaleDateString("pt-BR")}</span></p>
            </div>
          </div>

          {/* Resumo do pedido */}
          <div className="dash-card p-5 border-2 border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Resumo do pedido</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs dash-muted">Cards solicitados</span>
                <span className="text-sm font-bold dash-title">{sol.quantidadeCards}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs dash-muted">Folhas A4 estimadas</span>
                <span className="text-sm font-bold dash-title">{sol.folhasEstimadas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs dash-muted">Tamanho do card</span>
                <span className="text-sm font-medium dash-subtitle">{TAMANHO_LABEL[sol.layout.tamanhoCard] ?? sol.layout.tamanhoCard}</span>
              </div>
              {sol.valorCobrado != null && (
                <div className="flex justify-between pt-2 border-t border-emerald-200 dark:border-emerald-500/20">
                  <span className="text-xs font-semibold dash-subtitle">Valor cobrado</span>
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                    R$ {Number(sol.valorCobrado).toFixed(2).replace(".", ",")}
                  </span>
                </div>
              )}
            </div>

            {/* PIX info quando aguardando */}
            {sol.pixChave && (
              <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-500/20 space-y-1">
                <p className="text-xs font-semibold dash-subtitle flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5" /> PIX configurado
                </p>
                <div className="flex items-center gap-1 text-xs dash-muted">
                  <span>Chave:</span>
                  <span className="font-medium dash-subtitle">{sol.pixChave}</span>
                </div>
                {sol.pixNome && (
                  <p className="text-xs dash-muted">Titular: <span className="font-medium dash-subtitle">{sol.pixNome}</span></p>
                )}
              </div>
            )}

            {sol.observacaoLoja && (
              <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-500/20">
                <p className="text-xs font-medium dash-subtitle mb-1">Obs. do lojista:</p>
                <p className="text-xs dash-muted italic">{sol.observacaoLoja}</p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita — painel de ação */}
        <div className="lg:col-span-1">
          <div className="dash-card p-5 sticky top-6">
            <h2 className="text-sm font-semibold dash-title mb-4">Painel de atendimento</h2>
            <AdminStatusForm
              id={sol.id}
              currentStatus={sol.status as StatusKey}
              currentObs={sol.observacaoAdmin}
              action={adminAtualizarSolicitacao}
              aprovadoPor={sol.aprovadoPor ? (sol.aprovadoPor.name ?? sol.aprovadoPor.email ?? null) : null}
              aprovadoEm={sol.aprovadoEm}
              valorCobrado={sol.valorCobrado != null ? Number(sol.valorCobrado) : null}
              pixChave={sol.pixChave ?? null}
              pixNome={sol.pixNome ?? null}
              pagamentoConfirmadoPor={sol.pagamentoConfirmadoPor ? (sol.pagamentoConfirmadoPor.name ?? sol.pagamentoConfirmadoPor.email ?? null) : null}
              pagamentoConfirmadoEm={sol.pagamentoConfirmadoEm}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
