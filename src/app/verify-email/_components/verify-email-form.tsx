// src/app/verify-email/_components/verify-email-form.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, Mail, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface VerifyEmailFormProps {
  initialEmail?: string
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "12px",
  padding: "12px 12px 12px 44px",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
}

const codeInputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(16,185,129,0.06)",
  border: "1px solid rgba(16,185,129,0.25)",
  borderRadius: "12px",
  padding: "16px",
  color: "#fff",
  fontSize: "28px",
  fontWeight: "bold",
  letterSpacing: "10px",
  textAlign: "center",
  outline: "none",
  fontFamily: "'Courier New', monospace",
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  marginBottom: "6px",
  color: "rgba(255,255,255,0.45)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
}

export function VerifyEmailForm({ initialEmail }: VerifyEmailFormProps) {
  const router = useRouter()

  const [loading, setLoading]           = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown]       = useState(0)
  const [formData, setFormData]         = useState({
    email: initialEmail || "",
    code:  "",
  })

  // Countdown baseado no expiresAt salvo no localStorage
  useEffect(() => {
    const tick = () => {
      const expiry = localStorage.getItem("verificationExpiry")
      if (!expiry) { setCountdown(0); return }
      const remaining = Math.max(0, Math.floor((new Date(expiry).getTime() - Date.now()) / 1000))
      setCountdown(remaining)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Fallback para email do localStorage quando não vem pela URL
  useEffect(() => {
    if (!initialEmail) {
      const saved = localStorage.getItem("verificationEmail")
      if (saved) setFormData(prev => ({ ...prev, email: saved }))
    }
  }, [initialEmail])

  const fmtCountdown = (s: number) =>
    s >= 60 ? `${Math.floor(s / 60)}min ${s % 60}s` : `${s}s`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.code.length !== 6) { toast.error("O código deve ter 6 dígitos"); return }

    setLoading(true)
    try {
      const res  = await fetch("/api/verify-email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: formData.email, code: formData.code }),
      })
      const data = await res.json()

      if (!res.ok) { toast.error(data.error || "Código inválido"); setLoading(false); return }

      localStorage.removeItem("verificationExpiry")
      localStorage.removeItem("verificationEmail")
      toast.success("Email verificado com sucesso!")
      setTimeout(() => router.push("/login"), 1500)
    } catch {
      toast.error("Erro ao verificar email")
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || !formData.email) return
    setResendLoading(true)
    try {
      const res  = await fetch("/api/resend-verification", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: formData.email }),
      })
      const data = await res.json()

      if (!res.ok) { toast.error(data.error || "Erro ao reenviar"); setResendLoading(false); return }

      if (data.expiresAt) localStorage.setItem("verificationExpiry", data.expiresAt)
      toast.success("Código reenviado! Verifique seu email.")
      setResendLoading(false)
      setFormData(prev => ({ ...prev, code: "" }))
    } catch {
      toast.error("Erro ao reenviar código")
      setResendLoading(false)
    }
  }

  const canResend = countdown === 0

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label style={labelStyle}>Email</label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "rgba(255,255,255,0.28)" }}
            />
            <input
              type="email"
              required
              readOnly={!!initialEmail}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Código */}
        <div>
          <label style={labelStyle}>Código de 6 dígitos</label>
          <input
            type="text"
            required
            maxLength={6}
            pattern="[0-9]{6}"
            value={formData.code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "")
              setFormData({ ...formData, code: value })
            }}
            placeholder="000000"
            autoFocus
            style={codeInputStyle}
          />
          <p className="text-xs mt-2 text-center" style={{ color: countdown > 0 ? "rgba(16,185,129,0.70)" : "rgba(239,68,68,0.70)" }}>
            {countdown > 0
              ? `⏱ Expira em ${fmtCountdown(countdown)}`
              : "Código expirado — solicite um novo"}
          </p>
        </div>

        {/* Botão verificar */}
        <button
          type="submit"
          disabled={loading || formData.code.length !== 6}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-black transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            boxShadow: "0 0 24px rgba(16,185,129,0.30)",
          }}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
          ) : (
            <><CheckCircle2 className="w-4 h-4" /> Verificar Email</>
          )}
        </button>
      </form>

      {/* Reenviar */}
      <div
        className="pt-4 text-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.30)" }}>
          Não recebeu o código?
        </p>
        <button
          type="button"
          disabled={!canResend || resendLoading}
          onClick={handleResend}
          className="inline-flex items-center gap-2 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: canResend ? "#10b981" : "rgba(255,255,255,0.30)" }}
        >
          {resendLoading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Reenviando...</>
          ) : canResend ? (
            <><RefreshCw className="w-3.5 h-3.5" /> Reenviar Código</>
          ) : (
            `Reenviar em ${fmtCountdown(countdown)}`
          )}
        </button>
      </div>
    </div>
  )
}
