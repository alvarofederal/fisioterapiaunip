"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, Mail } from "lucide-react"
import { toast } from "sonner"

export function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get("email") || ""

  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [countdown, setCountdown] = useState(45)
  const [formData, setFormData] = useState({
    email: emailFromUrl,
    code: "",
  })

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.code.length !== 6) {
      toast.error("O código deve ter 6 dígitos")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Código inválido")
        setLoading(false)
        return
      }

      toast.success("Email verificado com sucesso!", {
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      })

      setTimeout(() => {
        router.push("/login")
      }, 1500)
    } catch {
      toast.error("Erro ao verificar email")
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return

    setResendLoading(true)

    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Erro ao reenviar código")
        setResendLoading(false)
        return
      }

      toast.success("Código reenviado! Verifique seu email.")
      setCountdown(45)
      setCanResend(false)
      setResendLoading(false)
    } catch {
      toast.error("Erro ao reenviar código")
      setResendLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
            Email
          </Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              required
              readOnly
              value={formData.email}
              className="h-12 pl-10 bg-gray-50 border-emerald-200"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="code" className="text-sm font-semibold text-gray-700">
            Código de 6 dígitos
          </Label>
          <Input
            id="code"
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
            className="h-12 text-center text-2xl font-bold tracking-widest border-emerald-200 focus:border-emerald-500"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-2">
            Digite o código de 6 dígitos que enviamos para seu email
          </p>
        </div>

        <Button
          type="submit"
          disabled={loading || formData.code.length !== 6}
          className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-base font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Verificar Email
            </>
          )}
        </Button>
      </form>

      <div className="text-center pt-4 border-t">
        <p className="text-sm text-gray-600 mb-3">Não recebeu o código?</p>
        <Button
          type="button"
          variant="outline"
          disabled={!canResend || resendLoading}
          onClick={handleResend}
          className="border-emerald-300 hover:bg-emerald-50 text-emerald-700"
        >
          {resendLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Reenviando...
            </>
          ) : canResend ? (
            "Reenviar Código"
          ) : (
            `Reenviar em ${countdown}s`
          )}
        </Button>
      </div>
    </div>
  )
}
