"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { ChevronLeft, AlertTriangle, ArrowRight, Key, Loader2, CheckCircle2 } from "lucide-react"
import { migrarChaves } from "../../_actions/migrar-chaves"
import type { MigrarState } from "../../_actions/migrar-chaves"
import { useEffect, useState } from "react"

/* ── Este componente recebe os dados já pré-carregados do Server ── */
/* A page.tsx (Server) faz fetch e passa como props              ── */

interface Destino {
  id: string
  nome: string
  expiraEm: string
  vagasDisponiveis: number
}

interface Props {
  campanhaOrigemId:   string
  campanhaOrigemNome: string
  campanhaExpiraEm:   string
  qtdMigraveis:       number
  destinos:           Destino[]
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex items-center justify-center gap-2 dash-btn-primary disabled:opacity-50 text-sm font-semibold px-6 py-3 rounded-xl transition-colors w-full sm:w-auto"
    >
      {pending
        ? <><Loader2 className="w-4 h-4 animate-spin" />Migrando…</>
        : <><ArrowRight className="w-4 h-4" />Confirmar migração</>
      }
    </button>
  )
}

export function MigrarForm({ campanhaOrigemId, campanhaOrigemNome, campanhaExpiraEm, qtdMigraveis, destinos }: Props) {
  const [state, action] = useActionState<MigrarState, FormData>(migrarChaves, {})
  const [destinoId, setDestinoId] = useState(destinos[0]?.id ?? "")

  const destino = destinos.find((d) => d.id === destinoId)
  const vagasSuficientes = destino ? destino.vagasDisponiveis >= qtdMigraveis : false

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <Link
        href={`/dashboard/campanhas/${campanhaOrigemId}`}
        className="inline-flex items-center gap-1.5 text-sm dash-muted hover:text-emerald-500 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        {campanhaOrigemNome}
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex-shrink-0">
          <Key className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold dash-title">Migrar chaves</h1>
          <p className="dash-subtitle text-sm mt-0.5">Transfira chaves não resgatadas para uma nova campanha</p>
        </div>
      </div>

      {/* Origem */}
      <div className="dash-card p-5 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide dash-muted mb-3">Campanha de origem</p>
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-semibold dash-title">{campanhaOrigemNome}</p>
            <p className="text-sm text-red-500 dark:text-red-400 mt-0.5">
              Expirou em {new Date(campanhaExpiraEm).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{qtdMigraveis}</p>
            <p className="text-xs dash-muted">chaves a migrar</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.07] text-xs dash-muted">
          <strong className="dash-subtitle">O que será migrado:</strong> chaves com status{" "}
          <code className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">GERADA</code>{" "}
          <code className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">CONSULTADA</code>{" "}
          <code className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">ATIVADA</code>.
          Chaves resgatadas, expiradas e canceladas <strong>não</strong> são migradas.
        </div>
      </div>

      {/* Aviso QR */}
      <div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/25 text-blue-700 dark:text-blue-400 text-sm">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Os QR Codes existentes continuam funcionando.</strong>{" "}
          As URLs dos cartões físicos são permanentes e passarão a mostrar a nova campanha automaticamente.
        </span>
      </div>

      {/* Formulário */}
      <form action={action} className="dash-card p-5 space-y-5">
        <input type="hidden" name="campanhaOrigemId" value={campanhaOrigemId} />

        {/* Destino */}
        <div>
          <label className="block text-sm font-medium dash-subtitle mb-1.5">
            Campanha de destino <span className="text-red-500">*</span>
          </label>
          {destinos.length === 0 ? (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              Nenhuma campanha vigente disponível. {" "}
              <a href="/dashboard/campanhas/nova" className="underline font-medium hover:opacity-80">
                Crie uma nova campanha
              </a>{" "}
              e volte aqui para migrar as chaves.
            </div>
          ) : (
            <>
              <select
                name="campanhaDestinoId"
                value={destinoId}
                onChange={(e) => setDestinoId(e.target.value)}
                className="w-full dash-input focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {destinos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome} — {d.vagasDisponiveis} vaga(s) · válida até {new Date(d.expiraEm).toLocaleDateString("pt-BR")}
                  </option>
                ))}
              </select>

              {/* Aviso de vagas insuficientes */}
              {destino && !vagasSuficientes && (
                <div className="flex items-center gap-2 mt-2 text-xs text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  Esta campanha tem apenas {destino.vagasDisponiveis} vaga(s). Você precisa de {qtdMigraveis}.
                  Edite a campanha de destino e aumente o número máximo de chaves.
                </div>
              )}

              {destino && vagasSuficientes && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {destino.vagasDisponiveis} vagas disponíveis — suficiente para as {qtdMigraveis} chaves
                </p>
              )}
            </>
          )}
        </div>

        {/* Erro global */}
        {state.error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 text-red-600 dark:text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {state.error}
          </div>
        )}

        <div className="flex items-center gap-3 justify-end pt-2">
          <Link
            href={`/dashboard/campanhas/${campanhaOrigemId}`}
            className="text-sm dash-muted hover:dash-subtitle px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Cancelar
          </Link>
          <SubmitButton disabled={destinos.length === 0 || !vagasSuficientes} />
        </div>
      </form>
    </div>
  )
}
