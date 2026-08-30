"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

interface Props {
  plano:   "PROFISSIONAL" | "EMPRESARIAL"
  label:   string
  variant: "primary" | "outline"
}

export function AssinarButton({ plano, label, variant }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/criar-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? "Erro ao criar sessão de pagamento")
        setLoading(false)
      }
    } catch {
      alert("Erro de conexão. Tente novamente.")
      setLoading(false)
    }
  }

  const base = "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
  const cls = variant === "primary"
    ? `${base} dash-btn-primary`
    : `${base} border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5`

  return (
    <button onClick={handleClick} disabled={loading} className={`${cls} disabled:opacity-60`}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {loading ? "Redirecionando..." : label}
    </button>
  )
}
