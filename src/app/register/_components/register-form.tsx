"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Mail, Lock, Chrome } from "lucide-react"
import { toast } from "sonner"
import { signIn } from "next-auth/react"

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

export function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading]             = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [focused, setFocused]             = useState<string | null>(null)
  const [formData, setFormData]           = useState({
    email: "", password: "", confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }
    if (formData.password.length < 8) {
      toast.error("Senha deve ter no mínimo 8 caracteres")
      return
    }
    setLoading(true)
    try {
      const res  = await fetch("/api/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Erro ao criar conta")
        setLoading(false)
        return
      }
      if (data.devAutoVerified) {
        toast.success("Conta criada! Redirecionando...")
        router.push("/login")
        return
      }
      if (data.expiresAt) {
        localStorage.setItem("verificationExpiry", data.expiresAt)
        localStorage.setItem("verificationEmail", formData.email)
      }
      toast.success("Conta criada! Verifique seu email.")
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
    } catch {
      toast.error("Erro ao criar conta")
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await signIn("google", { callbackUrl: "/dashboard" })
  }

  const field = (id: string) => ({
    onFocus: () => setFocused(id),
    onBlur:  () => setFocused(null),
    style:   { ...inputStyle, borderColor: focused === id ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.10)" },
  })

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
        Cadastrar com Google
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
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: focused === "email" ? "#10b981" : "rgba(255,255,255,0.28)" }} />
            <input type="email" required placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              {...field("email")} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: focused === "password" ? "#10b981" : "rgba(255,255,255,0.28)" }} />
            <input type="password" required minLength={8} placeholder="Mín. 8 caracteres"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              {...field("password")} />
          </div>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.22)" }}>
            Mín. 8 caracteres, com maiúscula, número e símbolo
          </p>
        </div>

        <div>
          <label style={labelStyle}>Confirmar senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: focused === "confirm" ? "#10b981" : "rgba(255,255,255,0.28)" }} />
            <input type="password" required placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              {...field("confirm")} />
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
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</> : "Criar conta grátis"}
        </button>
      </form>
    </div>
  )
}
