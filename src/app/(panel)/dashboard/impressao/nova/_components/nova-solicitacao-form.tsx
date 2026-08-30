"use client"

import { useActionState, useState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { CheckCircle, Printer, Info } from "lucide-react"
import type { SolicitacaoState } from "../../_actions/impressao-actions"

// ─────────────────────────────────────────
// CONFIG DE TAMANHOS (cards por folha)
// ─────────────────────────────────────────

const CARDS_POR_FOLHA: Record<string, number> = {
  MINI:    21,
  CARTAO:  14,
  PADRAO:  10,
  COUPON:   8,
  VOUCHER:  4,
  MEIO_A4:  2,
  MDF:      6,
}

const TAMANHO_LABEL: Record<string, string> = {
  MINI:    "Mini 63×38 mm",
  CARTAO:  "Cartão 70×35 mm",
  PADRAO:  "Padrão 85×55 mm",
  COUPON:  "Cupom 95×68 mm",
  VOUCHER: "Voucher 190×68 mm",
  MEIO_A4: "Meio A4 190×138 mm",
  MDF:     "MDF 90×90 mm",
}

// ─────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────

type Lote = {
  id: string
  descricao: string | null
  quantidade: number
  criadoEm: Date
  formatoSaida: string
}

type Campanha = {
  id: string
  nome: string
  status: string
  lotes: Lote[]
}

type Layout = {
  id: string
  nome: string
  corPrimaria: string
  tamanhoCard: string
  estiloCard: string
  padrao: boolean
}

// ─────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 dash-btn-primary text-sm px-6 py-2.5 rounded-xl disabled:opacity-50 transition-all"
    >
      <Printer className="w-4 h-4" />
      {pending ? "Enviando..." : "Enviar solicitação"}
    </button>
  )
}

// ─────────────────────────────────────────
// FORM
// ─────────────────────────────────────────

export function NovaSolicitacaoForm({
  action,
  campanhas,
  layouts,
}: {
  action: (prev: SolicitacaoState, data: FormData) => Promise<SolicitacaoState>
  campanhas: Campanha[]
  layouts: Layout[]
}) {
  const [state, formAction] = useActionState<SolicitacaoState, FormData>(action, {})
  const fe = state.fieldErrors ?? {}

  const [campanhaId, setCampanhaId]   = useState("")
  const [loteId, setLoteId]           = useState("")
  const [layoutId, setLayoutId]       = useState(() => layouts.find(l => l.padrao)?.id ?? layouts[0]?.id ?? "")
  const [quantidade, setQuantidade]   = useState(100)

  const campanha    = campanhas.find(c => c.id === campanhaId)
  const lotesSel    = campanha?.lotes ?? []
  const layoutSel   = layouts.find(l => l.id === layoutId)
  const perFolha    = layoutSel ? (CARDS_POR_FOLHA[layoutSel.tamanhoCard] ?? 10) : 10
  const folhas      = Math.ceil(quantidade / perFolha)

  // Reset lote quando campanha muda
  useEffect(() => { setLoteId("") }, [campanhaId])

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-2 text-emerald-700 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Solicitação enviada com sucesso!
        </div>
      )}

      {/* Campanha */}
      <div className="dash-card p-5 space-y-4">
        <h2 className="text-sm font-semibold dash-title">1. Campanha e lote</h2>

        <div>
          <label className="block text-sm font-medium dash-subtitle mb-1.5">
            Campanha <span className="text-red-500">*</span>
          </label>
          <select
            name="campanhaId"
            value={campanhaId}
            onChange={e => setCampanhaId(e.target.value)}
            className="w-full dash-input text-sm px-4 py-2.5 rounded-xl border"
          >
            <option value="">Selecione uma campanha...</option>
            {campanhas.map(c => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.status})
              </option>
            ))}
          </select>
          {fe.campanhaId && <p className="text-red-500 text-xs mt-1">{fe.campanhaId[0]}</p>}
        </div>

        {campanhaId && (
          <div>
            <label className="block text-sm font-medium dash-subtitle mb-1.5">
              Lote de chaves <span className="text-red-500">*</span>
            </label>
            {lotesSel.length === 0 ? (
              <p className="text-sm dash-muted">Esta campanha não tem lotes gerados.</p>
            ) : (
              <select
                name="loteId"
                value={loteId}
                onChange={e => setLoteId(e.target.value)}
                className="w-full dash-input text-sm px-4 py-2.5 rounded-xl border"
              >
                <option value="">Selecione um lote...</option>
                {lotesSel.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.descricao || `Lote de ${l.quantidade} chaves`} — {new Date(l.criadoEm).toLocaleDateString("pt-BR")}
                  </option>
                ))}
              </select>
            )}
            {fe.loteId && <p className="text-red-500 text-xs mt-1">{fe.loteId[0]}</p>}
          </div>
        )}
      </div>

      {/* Layout */}
      <div className="dash-card p-5 space-y-4">
        <h2 className="text-sm font-semibold dash-title">2. Layout dos cards</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {layouts.map(l => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLayoutId(l.id)}
              className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                layoutId === l.id
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                  : "border-gray-200 dark:border-white/10 hover:border-gray-300"
              }`}
            >
              <div
                className="w-8 h-8 rounded-lg flex-shrink-0 border border-black/5 dark:border-white/10"
                style={{ backgroundColor: l.corPrimaria }}
              />
              <div className="min-w-0">
                <p className={`text-sm font-semibold truncate ${layoutId === l.id ? "text-emerald-700 dark:text-emerald-400" : "dash-title"}`}>
                  {l.nome} {l.padrao && "⭐"}
                </p>
                <p className="text-xs dash-muted truncate">
                  {TAMANHO_LABEL[l.tamanhoCard] ?? l.tamanhoCard}
                </p>
              </div>
            </button>
          ))}
        </div>
        <input type="hidden" name="layoutId" value={layoutId} />
        {fe.layoutId && <p className="text-red-500 text-xs mt-1">{fe.layoutId[0]}</p>}
      </div>

      {/* Quantidade */}
      <div className="dash-card p-5 space-y-4">
        <h2 className="text-sm font-semibold dash-title">3. Quantidade</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium dash-subtitle mb-1.5">
              Número de cards <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantidadeCards"
              min={1}
              max={10000}
              value={quantidade}
              onChange={e => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full dash-input text-sm px-4 py-2.5 rounded-xl border"
            />
            {fe.quantidadeCards && <p className="text-red-500 text-xs mt-1">{fe.quantidadeCards[0]}</p>}
          </div>

          {layoutSel && (
            <div className="flex items-end pb-0.5">
              <div className="dash-card bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 w-full">
                <p className="text-xs dash-muted mb-1">Estimativa de folhas A4</p>
                <p className="text-2xl font-bold dash-title">{folhas}</p>
                <p className="text-xs dash-muted">
                  {perFolha} cards/{TAMANHO_LABEL[layoutSel.tamanhoCard] ?? "folha"}
                </p>
              </div>
            </div>
          )}
        </div>

        <input type="hidden" name="folhasEstimadas" value={folhas} />

        <div className="flex items-start gap-2 text-xs dash-muted bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-xl px-3 py-2.5">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-500" />
          O Courtesyfy confirmará o orçamento antes da impressão. Você receberá as instruções de pagamento por e-mail.
        </div>
      </div>

      {/* Observação */}
      <div className="dash-card p-5 space-y-3">
        <h2 className="text-sm font-semibold dash-title">4. Observações <span className="font-normal dash-muted">(opcional)</span></h2>
        <textarea
          name="observacaoLoja"
          rows={3}
          maxLength={500}
          placeholder="Instruções especiais, prazo desejado, endereço de entrega..."
          className="w-full dash-input text-sm px-4 py-2.5 rounded-xl border resize-none"
        />
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  )
}
