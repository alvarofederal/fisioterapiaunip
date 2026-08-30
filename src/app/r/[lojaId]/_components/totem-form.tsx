"use client"

import { useActionState, useState, useTransition, useEffect, useRef } from "react"
import { useFormStatus } from "react-dom"
import { consultarChavePublico, confirmarResgatePublico } from "../_actions/resgatar-chave"
import type { ResgatePublicoState } from "../_actions/resgatar-chave"

interface Props {
  lojaId: string
  corPrimaria: string
  codigoInicial?: string
}

function ConfirmarButton({ cor }: { cor: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-4 rounded-2xl font-bold text-sm disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2"
      style={{
        background: `linear-gradient(135deg, ${cor}, ${cor}cc)`,
        color: "#000",
        boxShadow: `0 0 24px ${cor}35`,
      }}
    >
      {pending ? (
        <>
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          Confirmando...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
          </svg>
          Confirmar resgate
        </>
      )}
    </button>
  )
}

function formatarCodigo(valor: string) {
  const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, "")
  const grupos = limpo.match(/.{1,4}/g) ?? []
  return grupos.join("-").slice(0, 19)
}

export function TotemForm({ lojaId, corPrimaria, codigoInicial = "" }: Props) {
  const [codigo, setCodigo]             = useState(formatarCodigo(codigoInicial))
  const [consultaResult, setConsultaResult] = useState<ResgatePublicoState | null>(null)
  const [isPending, startTransition]    = useTransition()
  const [countdown, setCountdown]       = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const confirmarAction = confirmarResgatePublico.bind(null, lojaId)
  const [confirmState, formAction] = useActionState<ResgatePublicoState, FormData>(
    confirmarAction,
    {},
  )

  useEffect(() => {
    if (codigoInicial && codigoInicial.replace(/-/g, "").length === 16) {
      handleBuscar(formatarCodigo(codigoInicial))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!confirmState.success) return
    setCountdown(8)
    const interval = setInterval(() => {
      setCountdown(n => {
        if (n <= 1) { clearInterval(interval); handleReset(); return 0 }
        return n - 1
      })
    }, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmState.success])

  function handleBuscar(cod = codigo) {
    const limpo = cod.replace(/-/g, "")
    if (limpo.length < 16) return
    startTransition(async () => {
      const result = await consultarChavePublico(lojaId, cod)
      setConsultaResult(result)
    })
  }

  function handleReset() {
    setConsultaResult(null)
    setCodigo("")
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  /* ── Tela de SUCESSO ─────────────────────────────────────────── */
  if (confirmState.success) {
    const ch = consultaResult?.chave
    return (
      <div className="px-8 py-10 flex flex-col items-center text-center space-y-6">
        {/* Ícone animado */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: `${corPrimaria}18`,
            border: `2px solid ${corPrimaria}40`,
            boxShadow: `0 0 40px ${corPrimaria}25`,
          }}
        >
          <svg className="w-12 h-12" style={{ color: corPrimaria }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
          </svg>
        </div>

        <div>
          <h2 className="text-2xl font-black text-white mb-1">Benefício confirmado!</h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            O resgate foi registrado com sucesso.
          </p>
        </div>

        {ch && (
          <div
            className="w-full rounded-2xl px-5 py-4 text-center"
            style={{
              background: `${corPrimaria}12`,
              border: `1px solid ${corPrimaria}25`,
            }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: corPrimaria }}>
              {ch.campanhaNome}
            </p>
            <p className="text-2xl font-black text-white">{ch.beneficio}</p>
            {ch.clienteNome && (
              <p className="text-sm mt-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                Cliente: {ch.clienteNome}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          Voltando em {countdown}s...
        </div>

        <button
          onClick={handleReset}
          className="text-sm font-semibold underline transition-opacity hover:opacity-70"
          style={{ color: corPrimaria }}
        >
          Validar outra agora
        </button>
      </div>
    )
  }

  /* ── Tela de CONFIRMAÇÃO ─────────────────────────────────────── */
  if (consultaResult?.chave) {
    const ch = consultaResult.chave
    return (
      <div className="px-6 py-7 space-y-5">
        {/* Voltar */}
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: "rgba(255,255,255,0.40)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Voltar
        </button>

        <div>
          <h2 className="text-lg font-bold text-white mb-0.5">Confirmar resgate</h2>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
            Verifique os dados e confirme para registrar.
          </p>
        </div>

        {/* Card do benefício */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: `${corPrimaria}10`,
            border: `1.5px solid ${corPrimaria}30`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: corPrimaria }} />
            <span className="text-xs font-semibold" style={{ color: corPrimaria }}>
              Chave ativada — válida para resgate
            </span>
          </div>
          <code className="font-mono text-base font-bold text-white block mb-1 tracking-widest">
            {ch.codigo}
          </code>
          <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>{ch.campanhaNome}</p>
          <p className="text-2xl font-black text-white">{ch.beneficio}</p>
        </div>

        {/* Dados do cliente */}
        {(ch.clienteNome || ch.clienteTelefone || ch.clienteEmail) && (
          <div
            className="rounded-2xl p-4 space-y-2"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>
              Cliente
            </p>
            {ch.clienteNome && (
              <div className="flex items-center gap-2 text-sm text-white">
                <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.35)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                {ch.clienteNome}
              </div>
            )}
            {ch.clienteTelefone && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>
                <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.35)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                {ch.clienteTelefone}
              </div>
            )}
            {ch.clienteEmail && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>
                <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.35)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                {ch.clienteEmail}
              </div>
            )}
          </div>
        )}

        {/* Formulário */}
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="codigo" value={ch.codigo} />

          {confirmState.error && (
            <div
              className="rounded-xl p-3 text-sm text-center"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", color: "#fca5a5" }}
            >
              {confirmState.error}
            </div>
          )}

          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "rgba(255,255,255,0.40)", letterSpacing: "0.04em" }}
            >
              OBSERVAÇÃO <span style={{ color: "rgba(255,255,255,0.22)", fontWeight: 400 }}>(opcional)</span>
            </label>
            <input
              name="observacao"
              type="text"
              placeholder="Ex: Brinde retirado no balcão"
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid rgba(255,255,255,0.10)`,
              }}
            />
          </div>

          <ConfirmarButton cor={corPrimaria} />
        </form>
      </div>
    )
  }

  /* ── Tela INICIAL: entrada de código ─────────────────────────── */
  const codigoValido = codigo.replace(/-/g, "").length >= 16

  return (
    <div className="px-6 py-8 space-y-6">

      {/* Ícone */}
      <div className="flex justify-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: `${corPrimaria}15`, border: `1px solid ${corPrimaria}28` }}
        >
          <svg className="w-7 h-7" style={{ color: corPrimaria }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
          </svg>
        </div>
      </div>

      {/* Erro de consulta */}
      {consultaResult?.error && (
        <div
          className="rounded-xl p-3 text-sm text-center"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", color: "#fca5a5" }}
        >
          {consultaResult.error}
        </div>
      )}

      {/* Input */}
      <div className="space-y-3">
        <label
          className="block text-xs font-bold uppercase tracking-widest text-center"
          style={{ color: "rgba(255,255,255,0.30)" }}
        >
          Código da chave
        </label>
        <input
          ref={inputRef}
          type="text"
          value={codigo}
          onChange={e => setCodigo(formatarCodigo(e.target.value))}
          onKeyDown={e => e.key === "Enter" && handleBuscar()}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          className="w-full rounded-2xl px-5 py-4 text-center text-xl font-mono tracking-[0.3em] text-white outline-none transition-all placeholder:tracking-normal placeholder:text-base"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: `2px solid ${codigoValido ? corPrimaria + "60" : "rgba(255,255,255,0.10)"}`,
            boxShadow: codigoValido ? `0 0 0 4px ${corPrimaria}12` : "none",
          }}
          maxLength={19}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      {/* Botão */}
      <button
        onClick={() => handleBuscar()}
        disabled={isPending || !codigoValido}
        className="w-full py-4 rounded-2xl font-bold text-sm disabled:opacity-40 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2"
        style={{
          background: codigoValido
            ? `linear-gradient(135deg, ${corPrimaria}, ${corPrimaria}cc)`
            : "rgba(255,255,255,0.07)",
          color: codigoValido ? "#000" : "rgba(255,255,255,0.35)",
          boxShadow: codigoValido ? `0 0 24px ${corPrimaria}30` : "none",
        }}
      >
        {isPending ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
            Verificando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            Verificar código
          </>
        )}
      </button>

      <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.22)" }}>
        O código está no celular do cliente após ativar a chave.
      </p>
    </div>
  )
}
