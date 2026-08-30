"use client"

import { useActionState, useState, useTransition, useEffect, useRef } from "react"
import { useFormStatus } from "react-dom"
import {
  Search, Check, ChevronLeft, User, Phone, Mail, Gift,
  RotateCcw, AlertCircle,
} from "lucide-react"
import {
  consultarChaveAutenticada,
  confirmarResgateAutenticado,
} from "../_actions/validar-resgate"
import type { ValidarResgateState } from "../_actions/validar-resgate"

/* ── formatar XXXX-XXXX-XXXX-XXXX ──────────────────────────────── */
function formatarCodigo(v: string) {
  const limpo = v.toUpperCase().replace(/[^A-Z0-9]/g, "")
  return (limpo.match(/.{1,4}/g) ?? []).join("-").slice(0, 19)
}

/* ── botão de submit ─────────────────────────────────────────────── */
function ConfirmarBtn() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full dash-btn-primary text-sm px-6 py-3 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          Confirmando…
        </>
      ) : (
        <>
          <Check className="w-4 h-4" />
          Confirmar resgate
        </>
      )}
    </button>
  )
}

/* ── componente principal ────────────────────────────────────────── */
export function ValidarForm() {
  const [codigo, setCodigo]           = useState("")
  const [consultaResult, setConsulta] = useState<ValidarResgateState | null>(null)
  const [isPending, startTransition]  = useTransition()
  const [countdown, setCountdown]     = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const [confirmState, formAction] = useActionState<ValidarResgateState, FormData>(
    confirmarResgateAutenticado,
    {},
  )

  /* auto-reset após sucesso */
  useEffect(() => {
    if (!confirmState.success) return
    setCountdown(6)
    const t = setInterval(() => {
      setCountdown(n => {
        if (n <= 1) { clearInterval(t); handleReset(); return 0 }
        return n - 1
      })
    }, 1000)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmState.success])

  function handleBuscar(cod = codigo) {
    if (cod.replace(/-/g, "").length < 16) return
    startTransition(async () => {
      const r = await consultarChaveAutenticada(cod)
      setConsulta(r)
    })
  }

  function handleReset() {
    setConsulta(null)
    setCodigo("")
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  /* ── SUCESSO ─────────────────────────────────────────────────── */
  if (confirmState.success) {
    const ch = consultaResult?.chave
    return (
      <div className="dash-card p-8 flex flex-col items-center text-center gap-6 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-200 dark:border-emerald-500/30">
          <Check className="w-10 h-10 text-emerald-500" strokeWidth={2.5} />
        </div>

        <div>
          <h2 className="text-xl font-bold dash-title">Benefício confirmado!</h2>
          <p className="dash-muted text-sm mt-1">Resgate registrado com sucesso.</p>
        </div>

        {ch && (
          <div className="w-full rounded-xl p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-center space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              {ch.campanhaNome}
            </p>
            <p className="text-2xl font-black dash-title">{ch.beneficio}</p>
            {ch.clienteNome && (
              <p className="text-sm dash-muted">Cliente: {ch.clienteNome}</p>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <p className="text-sm dash-muted">Resetando em {countdown}s…</p>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Validar outra agora
          </button>
        </div>
      </div>
    )
  }

  /* ── CONFIRMAÇÃO ─────────────────────────────────────────────── */
  if (consultaResult?.chave) {
    const ch = consultaResult.chave
    return (
      <div className="max-w-md mx-auto space-y-4">
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 text-sm dash-muted hover:text-emerald-500 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>

        {/* Card do benefício */}
        <div className="dash-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              Chave ativada — pronta para resgatar
            </span>
          </div>

          <div>
            <code className="font-mono text-lg font-bold dash-title tracking-widest block">
              {ch.codigo}
            </code>
            <p className="text-xs dash-muted mt-0.5">{ch.campanhaNome}</p>
          </div>

          <div className="pt-1 border-t border-gray-100 dark:border-white/[0.07]">
            <p className="text-2xl font-black dash-title flex items-center gap-2">
              <Gift className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              {ch.beneficio}
            </p>
          </div>
        </div>

        {/* Dados do cliente */}
        {(ch.clienteNome || ch.clienteTelefone || ch.clienteEmail) && (
          <div className="dash-card p-4 space-y-2">
            <p className="text-xs font-semibold dash-muted uppercase tracking-widest">Cliente</p>
            {ch.clienteNome && (
              <div className="flex items-center gap-2 text-sm dash-title">
                <User className="w-3.5 h-3.5 dash-muted flex-shrink-0" />
                {ch.clienteNome}
              </div>
            )}
            {ch.clienteTelefone && (
              <div className="flex items-center gap-2 text-sm dash-subtitle">
                <Phone className="w-3.5 h-3.5 dash-muted flex-shrink-0" />
                {ch.clienteTelefone}
              </div>
            )}
            {ch.clienteEmail && (
              <div className="flex items-center gap-2 text-sm dash-subtitle">
                <Mail className="w-3.5 h-3.5 dash-muted flex-shrink-0" />
                {ch.clienteEmail}
              </div>
            )}
          </div>
        )}

        {/* Formulário de confirmação */}
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="codigo" value={ch.codigo} />

          {confirmState.error && (
            <div className="flex items-center gap-2 rounded-xl p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {confirmState.error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold dash-muted uppercase tracking-widest mb-1.5">
              Observação <span className="normal-case font-normal">(opcional)</span>
            </label>
            <input
              name="observacao"
              type="text"
              placeholder="Ex: Brinde retirado no balcão"
              className="w-full dash-input focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <ConfirmarBtn />
        </form>
      </div>
    )
  }

  /* ── ENTRADA DO CÓDIGO ───────────────────────────────────────── */
  const codigoValido = codigo.replace(/-/g, "").length >= 16

  return (
    <div className="max-w-md mx-auto">
      <div className="dash-card p-6 space-y-5">

        {/* Erro de consulta */}
        {consultaResult?.error && (
          <div className="flex items-center gap-2 rounded-xl p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {consultaResult.error}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-semibold dash-muted uppercase tracking-widest">
            Código da chave
          </label>
          <input
            ref={inputRef}
            type="text"
            value={codigo}
            onChange={e => setCodigo(formatarCodigo(e.target.value))}
            onKeyDown={e => e.key === "Enter" && handleBuscar()}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="w-full font-mono text-xl text-center tracking-[0.25em] dash-input focus:outline-none focus:ring-2 focus:ring-emerald-500/50 py-4"
            maxLength={19}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <p className="text-xs dash-muted text-center">
            Digite ou escaneie o código que o cliente apresentou.
          </p>
        </div>

        <button
          onClick={() => handleBuscar()}
          disabled={isPending || !codigoValido}
          className="w-full dash-btn-primary text-sm px-6 py-3 rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              Verificando…
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Verificar código
            </>
          )}
        </button>
      </div>
    </div>
  )
}
