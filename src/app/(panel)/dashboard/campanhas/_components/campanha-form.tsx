"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import type { CampanhaFormState } from "../_actions/criar-campanha"

const TIPOS_BENEFICIO = [
  { value: "DESCONTO_PERCENTUAL", label: "Desconto Percentual (ex: 20% off)" },
  { value: "DESCONTO_FIXO",       label: "Desconto Fixo (ex: R$ 50 off)" },
  { value: "BRINDE",              label: "Brinde (produto grátis)" },
  { value: "SORTEIO",             label: "Sorteio entre participantes" },
  { value: "FRETE_GRATIS",        label: "Frete Grátis" },
  { value: "CASHBACK",            label: "Cashback (dinheiro de volta)" },
] as const

type TipoBeneficio = (typeof TIPOS_BENEFICIO)[number]["value"]

function toDatetimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

type LayoutOption = {
  id: string
  nome: string
  corPrimaria: string
  padrao: boolean
}

type DefaultValues = {
  nome?: string
  descricao?: string
  tipoBeneficio?: TipoBeneficio
  valorBeneficio?: string
  descricaoPremio?: string
  regrasUso?: string
  inicioEm?: Date
  expiraEm?: Date
  quantidadeChaves?: number
  layoutId?: string
}

type Action = (prev: CampanhaFormState, formData: FormData) => Promise<CampanhaFormState>

interface Props {
  action: Action
  defaultValues?: DefaultValues
  isEditing?: boolean
  layouts?: LayoutOption[]
}

const inputCls = "w-full dash-input focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
const labelCls = "block text-sm font-medium dash-subtitle mb-1.5"
const hintCls  = "text-xs dash-muted mt-1"

function SubmitButtons({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus()
  if (isEditing) {
    return (
      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto dash-btn-primary text-sm px-6 py-2.5 rounded-xl disabled:opacity-50 transition-all"
      >
        {pending ? "Salvando..." : "Salvar alterações"}
      </button>
    )
  }
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <button
        type="submit"
        name="publicar"
        value="rascunho"
        disabled={pending}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 dash-subtitle text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
      >
        {pending ? "Salvando..." : "Salvar como rascunho"}
      </button>
      <button
        type="submit"
        name="publicar"
        value="ativa"
        disabled={pending}
        className="w-full sm:w-auto dash-btn-primary text-sm px-6 py-2.5 rounded-xl disabled:opacity-50 transition-all"
      >
        {pending ? "Criando..." : "Criar e ativar"}
      </button>
    </div>
  )
}

export function CampanhaForm({ action, defaultValues = {}, isEditing = false, layouts = [] }: Props) {
  const [state, formAction] = useActionState(action, {})
  const [tipoBeneficio, setTipoBeneficio] = useState<TipoBeneficio>(
    defaultValues.tipoBeneficio ?? "DESCONTO_PERCENTUAL",
  )

  const showValor = tipoBeneficio === "DESCONTO_PERCENTUAL" || tipoBeneficio === "DESCONTO_FIXO"
  const showPremio = tipoBeneficio === "BRINDE" || tipoBeneficio === "SORTEIO"

  const fe = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm">
          {state.error}
        </div>
      )}

      {/* Nome + Tipo de benefício */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className={labelCls}>
            Nome da campanha <span className="text-red-500">*</span>
          </label>
          <input
            name="nome"
            type="text"
            defaultValue={defaultValues.nome}
            placeholder="Ex: Desconto de Aniversário"
            className={inputCls}
          />
          {fe.nome && <p className="text-red-500 text-xs mt-1">{fe.nome[0]}</p>}
        </div>

        <div>
          <label className={labelCls}>
            Tipo de benefício <span className="text-red-500">*</span>
          </label>
          <select
            name="tipoBeneficio"
            value={tipoBeneficio}
            onChange={(e) => setTipoBeneficio(e.target.value as TipoBeneficio)}
            className={inputCls}
          >
            {TIPOS_BENEFICIO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {fe.tipoBeneficio && (
            <p className="text-red-500 text-xs mt-1">{fe.tipoBeneficio[0]}</p>
          )}
        </div>
      </div>

      {/* Valor (desconto) / Descrição do prêmio (brinde/sorteio) */}
      {(showValor || showPremio) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {showValor && (
            <div>
              <label className={labelCls}>
                {tipoBeneficio === "DESCONTO_PERCENTUAL" ? "Percentual de desconto (%)" : "Valor do desconto (R$)"}
                <span className="text-red-500"> *</span>
              </label>
              <input
                name="valorBeneficio"
                type="number"
                step="0.01"
                min="0"
                defaultValue={defaultValues.valorBeneficio}
                placeholder={tipoBeneficio === "DESCONTO_PERCENTUAL" ? "Ex: 20" : "Ex: 50.00"}
                className={inputCls}
              />
              {fe.valorBeneficio && (
                <p className="text-red-500 text-xs mt-1">{fe.valorBeneficio[0]}</p>
              )}
            </div>
          )}
          {showPremio && (
            <div>
              <label className={labelCls}>
                Descrição do prêmio <span className="text-red-500">*</span>
              </label>
              <input
                name="descricaoPremio"
                type="text"
                defaultValue={defaultValues.descricaoPremio}
                placeholder={
                  tipoBeneficio === "SORTEIO"
                    ? "Ex: Smart TV 55\" Samsung"
                    : "Ex: Camiseta exclusiva da marca"
                }
                className={inputCls}
              />
              {fe.descricaoPremio && (
                <p className="text-red-500 text-xs mt-1">{fe.descricaoPremio[0]}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Descrição + Regras de uso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className={labelCls}>
            Descrição <span className="dash-muted font-normal">(opcional)</span>
          </label>
          <textarea
            name="descricao"
            defaultValue={defaultValues.descricao}
            rows={3}
            placeholder="Descreva brevemente a campanha para seus clientes..."
            className={`${inputCls} resize-none`}
          />
          {fe.descricao && <p className="text-red-500 text-xs mt-1">{fe.descricao[0]}</p>}
        </div>

        <div>
          <label className={labelCls}>
            Regras de uso <span className="dash-muted font-normal">(opcional)</span>
          </label>
          <textarea
            name="regrasUso"
            defaultValue={defaultValues.regrasUso}
            rows={3}
            placeholder="Ex: Válido apenas para compras acima de R$ 100. Não cumulativo com outras promoções."
            className={`${inputCls} resize-none`}
          />
          {fe.regrasUso && <p className="text-red-500 text-xs mt-1">{fe.regrasUso[0]}</p>}
        </div>
      </div>

      {/* Datas + Quantidade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>
            Data de início <span className="text-red-500">*</span>
          </label>
          <input
            name="inicioEm"
            type="datetime-local"
            defaultValue={defaultValues.inicioEm ? toDatetimeLocal(defaultValues.inicioEm) : ""}
            className={inputCls}
          />
          {fe.inicioEm && <p className="text-red-500 text-xs mt-1">{fe.inicioEm[0]}</p>}
        </div>
        <div>
          <label className={labelCls}>
            Data de expiração <span className="text-red-500">*</span>
          </label>
          <input
            name="expiraEm"
            type="datetime-local"
            defaultValue={defaultValues.expiraEm ? toDatetimeLocal(defaultValues.expiraEm) : ""}
            className={inputCls}
          />
          {fe.expiraEm && <p className="text-red-500 text-xs mt-1">{fe.expiraEm[0]}</p>}
        </div>
        <div>
          <label className={labelCls}>
            Limite de chaves <span className="text-red-500">*</span>
          </label>
          <input
            name="quantidadeChaves"
            type="number"
            min="1"
            max="10000"
            defaultValue={defaultValues.quantidadeChaves ?? 100}
            className={inputCls}
          />
          {fe.quantidadeChaves && (
            <p className="text-red-500 text-xs mt-1">{fe.quantidadeChaves[0]}</p>
          )}
          <p className={hintCls}>Geradas separadamente após criar</p>
        </div>
      </div>

      {/* Layout de impressão */}
      {layouts.length > 0 && (
        <div>
          <label className={labelCls}>
            Layout de impressão{" "}
            <span className="dash-muted font-normal">(opcional)</span>
          </label>
          <select
            name="layoutId"
            defaultValue={defaultValues.layoutId ?? ""}
            className={inputCls}
          >
            <option value="">Usar layout padrão da loja</option>
            {layouts.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}{l.padrao ? " (padrão)" : ""}
              </option>
            ))}
          </select>
          <p className={hintCls}>
            Define o visual dos cards impressos para esta campanha
          </p>
        </div>
      )}

      {/* Botões */}
      <div className="pt-2 flex items-center justify-end">
        <SubmitButtons isEditing={isEditing} />
      </div>
    </form>
  )
}
