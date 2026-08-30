"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Loader2, Mail, Lock, Chrome } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "12px",
  padding: "12px 12px 12px 40px",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.2s",
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  marginBottom: "6px",
  color: "rgba(255,255,255,0.50)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
}

export function LoginForm() {
  const [loading, setLoading]           = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [formData, setFormData]         = useState({ email: "", password: "" })
  const [focused, setFocused]           = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res  = await fetch("/api/auth/login-and-redirect", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          toast.error("Email não verificado", {
            description: "Verifique sua caixa de entrada.",
            action: {
              label: "Reenviar código",
              onClick: () => (window.location.href = `/verify-email?email=${encodeURIComponent(formData.email)}`),
            },
          })
        } else {
          toast.error(data.error || "Email ou senha incorretos")
        }
        setLoading(false)
        return
      }
      toast.success("Login realizado!")
      window.location.href = data.redirectTo
    } catch {
      toast.error("Erro ao fazer login")
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      await signIn("google", { callbackUrl: "/dashboard", redirect: true })
    } catch {
      toast.error("Erro ao fazer login com Google")
      setGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "rgba(255,255,255,0.80)",
        }}
      >
        {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Chrome className="w-4 h-4" />}
        Continuar com Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>ou</span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label style={labelStyle}>Email</label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: focused === "email" ? "#10b981" : "rgba(255,255,255,0.28)" }}
            />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              placeholder="seu@email.com"
              style={{
                ...inputStyle,
                borderColor: focused === "email" ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.10)",
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label style={labelStyle}>Senha</label>
            <Link
              href="/forgot-password"
              className="text-xs transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.30)" }}
            >
              Esqueceu?
            </Link>
          </div>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: focused === "password" ? "#10b981" : "rgba(255,255,255,0.28)" }}
            />
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              placeholder="••••••••"
              style={{
                ...inputStyle,
                borderColor: focused === "password" ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.10)",
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-black transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 mt-2"
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            boxShadow: "0 0 24px rgba(16,185,129,0.30)",
          }}
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</> : "Entrar"}
        </button>
      </form>
    </div>
  )
}
