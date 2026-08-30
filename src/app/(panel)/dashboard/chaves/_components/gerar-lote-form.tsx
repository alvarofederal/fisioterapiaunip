"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { gerarLote } from "../_actions/gerar-lote"
import type { GerarLoteState } from "../_actions/gerar-lote"

type Campanha = { id: string; nome: string; expiraEm: Date; quantidadeChaves: number; chavesGeradas: number }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 dash-btn-primary disabled:opacity-50 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
    >
      {pending ? "Gerando chaves..." : "Gerar lote"}
    </button>
  )
}

interface Props {
  campanhas: Campanha[]
  campanhaIdPadrão?: string
}

export function GerarLoteForm({ campanhas, campanhaIdPadrão }: Props) {
  const [state, formAction] = useActionState<GerarLoteState, FormData>(gerarLote, {})
  const fe = state.fieldErrors ?? {}

  const labelCls = "block text-sm font-medium dash-subtitle mb-1.5"

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm">
          {state.error}
        </div>
      )}

      {/* Campanha */}
      <div>
        <label className={labelCls}>
          Campanha <span className="text-red-500">*</span>
        </label>
        {campanhas.length === 0 ? (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            Nenhuma campanha vigente encontrada. Todas as campanhas podem ter expirado ou atingido o limite de chaves.{" "}
            <a href="/dashboard/campanhas/nova" className="underline font-medium hover:opacity-80">Criar nova campanha</a>.
          </div>
        ) : (
          <select
            name="campanhaId"
            defaultValue={campanhaIdPadrão ?? ""}
            className="w-full dash-input focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="" disabled>
              Selecione uma campanha...
            </option>
            {campanhas.map((c) => {
              const restantes  = c.quantidadeChaves - c.chavesGeradas
              const validade   = new Date(c.expiraEm).toLocaleDateString("pt-BR")
              return (
                <option key={c.id} value={c.id} disabled={restantes <= 0}>
                  {c.nome} — {restantes > 0 ? `${restantes} vagas` : "limite atingido"} · válida até {validade}
                </option>
              )
            })}
          </select>
        )}
        {fe.campanhaId && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{fe.campanhaId[0]}</p>}
      </div>

      {/* Quantidade */}
      <div>
        <label className={labelCls}>
          Quantidade de chaves <span className="text-red-500">*</span>
        </label>
        <input
          name="quantidade"
          type="number"
          min="1"
          max="2000"
          defaultValue={50}
          className="w-full dash-input focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
        <p className="dash-muted text-xs mt-1">Máximo 2.000 por lote. Limite respeitado conforme a campanha.</p>
        {fe.quantidade && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{fe.quantidade[0]}</p>}
      </div>

      {/* Descrição */}
      <div>
        <label className={labelCls}>
          Descrição do lote <span className="dash-muted font-normal">(opcional)</span>
        </label>
        <input
          name="descricao"
          type="text"
          placeholder="Ex: Lote para distribuidores de SP — Semana 1"
          className="w-full dash-input focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
        {fe.descricao && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{fe.descricao[0]}</p>}
      </div>

      <div className="pt-2 flex justify-end">
        <SubmitButton />
      </div>
    </form>
  )
}
