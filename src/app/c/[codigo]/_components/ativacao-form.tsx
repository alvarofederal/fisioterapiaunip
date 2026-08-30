"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { ativarChave } from "../_actions/ativar-chave"
import type { AtivarChaveState } from "../_actions/ativar-chave"

function SubmitButton({ cor }: { cor: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
      style={{
        background: `linear-gradient(135deg, ${cor}, ${cor}cc)`,
        color: "#000",
        boxShadow: `0 0 20px ${cor}35`,
      }}
    >
      {pending ? (
        <>
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Ativando...
        </>
      ) : (
        "Ativar minha chave"
      )}
    </button>
  )
}

function CopyButton({ text, cor }: { text: string; cor: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] active:scale-95"
      style={{
        border: `1px solid ${copied ? cor : cor + "50"}`,
        color: copied ? "#000" : cor,
        background: copied ? cor : "transparent",
      }}
    >
      {copied ? "✓ Código copiado!" : "Copiar código"}
    </button>
  )
}

const inputStyle = (cor: string, focused: boolean): React.CSSProperties => ({
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${focused ? cor + "60" : "rgba(255,255,255,0.09)"}`,
  borderRadius: "12px",
  padding: "12px 14px",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.2s",
})

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  marginBottom: "6px",
  color: "rgba(255,255,255,0.45)",
  letterSpacing: "0.04em",
}

interface Props {
  codigo: string
  corPrimaria: string
}

export function AtivacaoForm({ codigo, corPrimaria }: Props) {
  const [state, formAction] = useActionState<AtivarChaveState, FormData>(ativarChave, {})
  const [focused, setFocused] = useState<string | null>(null)
  const fe = state.fieldErrors ?? {}

  if (state.success) {
    return (
      <div className="text-center py-2 space-y-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
          style={{ background: `${corPrimaria}14`, border: `1px solid ${corPrimaria}28` }}
        >
          <svg className="w-7 h-7" style={{ color: corPrimaria }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Chave ativada!</h3>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Mostre este código ao atendente para receber seu benefício.
          </p>
        </div>
        <div
          className="rounded-2xl py-5 px-4"
          style={{ background: `${corPrimaria}10`, border: `1px solid ${corPrimaria}22` }}
        >
          <code className="font-mono text-2xl font-black tracking-widest block" style={{ color: corPrimaria }}>
            {codigo}
          </code>
        </div>
        <CopyButton text={codigo} cor={corPrimaria} />
      </div>
    )
  }

  return (
    <form
      action={formAction}
      className="space-y-4"
      style={{ "--brand": corPrimaria } as React.CSSProperties}
    >
      <input type="hidden" name="codigo" value={codigo} />

      {state.error && (
        <div
          className="rounded-xl p-3 text-sm text-center"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.22)",
            color: "#fca5a5",
          }}
        >
          {state.error}
        </div>
      )}

      <div>
        <label style={labelStyle}>
          Seu nome <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>(opcional)</span>
        </label>
        <input
          name="nome"
          type="text"
          placeholder="Ex: João Silva"
          onFocus={() => setFocused("nome")}
          onBlur={() => setFocused(null)}
          style={inputStyle(corPrimaria, focused === "nome")}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Telefone <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>(ou e-mail — obrigatório um)</span>
        </label>
        <input
          name="telefone"
          type="tel"
          placeholder="(11) 99999-9999"
          onFocus={() => setFocused("telefone")}
          onBlur={() => setFocused(null)}
          style={inputStyle(corPrimaria, focused === "telefone")}
        />
        {fe.telefone && <p className="text-xs mt-1" style={{ color: "#fca5a5" }}>{fe.telefone[0]}</p>}
      </div>

      <div>
        <label style={labelStyle}>
          E-mail <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>(ou telefone)</span>
        </label>
        <input
          name="email"
          type="email"
          placeholder="seu@email.com"
          onFocus={() => setFocused("email")}
          onBlur={() => setFocused(null)}
          style={inputStyle(corPrimaria, focused === "email")}
        />
        {fe.email && <p className="text-xs mt-1" style={{ color: "#fca5a5" }}>{fe.email[0]}</p>}
      </div>

      <div className="pt-1">
        <SubmitButton cor={corPrimaria} />
      </div>

      <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
        Seus dados são usados apenas para identificação do resgate.
      </p>
    </form>
  )
}
