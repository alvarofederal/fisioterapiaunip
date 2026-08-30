"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { CheckCircle, AlertCircle, Banknote, Copy, Check } from "lucide-react"
import type { AdminAtualizarState } from "../../../../impressao/_actions/impressao-actions"

const STATUS_OPTIONS = [
  { value: "PENDENTE",             label: "Pendente" },
  { value: "EM_ANALISE",           label: "Em análise" },
  { value: "AGUARDANDO_PAGAMENTO", label: "Aguardando pagamento" },
  { value: "APROVADA",             label: "Aprovada" },
  { value: "REJEITADA",            label: "Rejeitada" },
  { value: "IMPRESSA",             label: "Impressa" },
  { value: "ENTREGUE",             label: "Entregue" },
] as const

const STATUS_COLORS: Record<string, string> = {
  PENDENTE:             "text-amber-600",
  EM_ANALISE:           "text-blue-600",
  AGUARDANDO_PAGAMENTO: "text-orange-600",
  APROVADA:             "text-emerald-600",
  REJEITADA:            "text-red-600",
  IMPRESSA:             "text-purple-600",
  ENTREGUE:             "text-gray-500",
}

function SaveBtn() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full dash-btn-primary text-sm px-4 py-2.5 rounded-xl disabled:opacity-50 transition-all"
    >
      {pending ? "Salvando..." : "Atualizar status"}
    </button>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      title="Copiar"
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-emerald-500" />
        : <Copy className="w-3.5 h-3.5 dash-muted" />
      }
    </button>
  )
}

export function AdminStatusForm({
  id,
  currentStatus,
  currentObs,
  action,
  aprovadoPor,
  aprovadoEm,
  valorCobrado,
  pixChave,
  pixNome,
  pagamentoConfirmadoPor,
  pagamentoConfirmadoEm,
}: {
  id: string
  currentStatus: string
  currentObs: string | null
  action: (prev: AdminAtualizarState, data: FormData) => Promise<AdminAtualizarState>
  aprovadoPor: string | null
  aprovadoEm: Date | null
  valorCobrado: number | null
  pixChave: string | null
  pixNome: string | null
  pagamentoConfirmadoPor: string | null
  pagamentoConfirmadoEm: Date | null
}) {
  const [state, formAction] = useActionState<AdminAtualizarState, FormData>(action, {})
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)

  const showPaymentFields = selectedStatus === "AGUARDANDO_PAGAMENTO"
  const hasPagamento      = valorCobrado != null && valorCobrado > 0

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={id} />

      {state.success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-700 text-xs">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Status atualizado com sucesso!
        </div>
      )}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700 text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {state.error}
        </div>
      )}

      {/* Status select */}
      <div>
        <label className="block text-xs font-medium dash-subtitle mb-1.5">Novo status</label>
        <select
          name="status"
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="w-full dash-input text-sm px-3 py-2.5 rounded-xl border"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value} className={STATUS_COLORS[o.value]}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Campos de pagamento — aparecem quando AGUARDANDO_PAGAMENTO */}
      {showPaymentFields && (
        <div className="rounded-xl border-2 border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Banknote className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">
              Dados de pagamento PIX
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium dash-subtitle mb-1">
              Valor a cobrar (R$) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="valorCobrado"
              step="0.01"
              min="0.01"
              defaultValue={valorCobrado ?? ""}
              placeholder="0,00"
              className="w-full dash-input text-sm px-3 py-2 rounded-xl border"
            />
          </div>

          <div>
            <label className="block text-xs font-medium dash-subtitle mb-1">
              Chave PIX <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="pixChave"
              defaultValue={pixChave ?? ""}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              className="w-full dash-input text-sm px-3 py-2 rounded-xl border"
            />
          </div>

          <div>
            <label className="block text-xs font-medium dash-subtitle mb-1">
              Nome do destinatário PIX
            </label>
            <input
              type="text"
              name="pixNome"
              defaultValue={pixNome ?? ""}
              placeholder="Ex: Courtesyfy Ltda"
              className="w-full dash-input text-sm px-3 py-2 rounded-xl border"
            />
          </div>
        </div>
      )}

      {/* Resumo de pagamento (quando já configurado e status diferente de AGUARDANDO_PAGAMENTO) */}
      {!showPaymentFields && hasPagamento && (
        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-3 space-y-2">
          <p className="text-xs font-medium dash-subtitle flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5 dash-muted" />
            Pagamento configurado
          </p>
          <div className="space-y-1 text-xs dash-muted">
            <p>Valor: <span className="font-semibold dash-title">R$ {Number(valorCobrado).toFixed(2).replace(".", ",")}</span></p>
            {pixChave && (
              <div className="flex items-center gap-1">
                <span>Chave PIX:</span>
                <span className="font-medium dash-subtitle">{pixChave}</span>
                <CopyBtn text={pixChave} />
              </div>
            )}
            {pixNome && <p>Titular: <span className="font-medium dash-subtitle">{pixNome}</span></p>}
          </div>
          {pagamentoConfirmadoPor && pagamentoConfirmadoEm && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ Pagamento confirmado por {pagamentoConfirmadoPor} em{" "}
              {new Date(pagamentoConfirmadoEm).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
      )}

      {/* Observação admin */}
      <div>
        <label className="block text-xs font-medium dash-subtitle mb-1.5">
          Observação interna <span className="font-normal dash-muted">(visível ao lojista)</span>
        </label>
        <textarea
          name="observacaoAdmin"
          rows={4}
          maxLength={500}
          defaultValue={currentObs ?? ""}
          placeholder="Ex: Aguardando pagamento — envie o PIX e nos confirme o comprovante."
          className="w-full dash-input text-sm px-3 py-2.5 rounded-xl border resize-none"
        />
      </div>

      <SaveBtn />

      {/* Aprovação info */}
      {aprovadoPor && aprovadoEm && (
        <div className="pt-3 border-t border-gray-100 dark:border-white/5">
          <p className="text-xs dash-muted">
            Aprovado por <span className="font-medium dash-subtitle">{aprovadoPor}</span>{" "}
            em {new Date(aprovadoEm).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "short", year: "numeric",
            })}
          </p>
        </div>
      )}
    </form>
  )
}
