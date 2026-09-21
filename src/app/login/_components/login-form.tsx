"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export function LoginForm() {
  const router = useRouter()
  const parametros = useSearchParams()
  const [carregando, setCarregando] = useState(false)
  const [dados, setDados] = useState({ email: "", password: "" })

  async function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault()
    setCarregando(true)

    try {
      const resultado = await signIn("credentials", {
        email: dados.email,
        password: dados.password,
        redirect: false,
      })

      if (!resultado || resultado.error) {
        // Mensagem única de propósito: não revelamos se o e-mail existe nem se a
        // conta está só aguardando liberação. Ver comentário em src/lib/auth.ts.
        toast.error("Não foi possível entrar", {
          description:
            "E-mail ou senha incorretos — ou sua conta ainda não foi liberada pelo administrador da turma.",
        })
        setCarregando(false)
        return
      }

      const destino = parametros.get("redirect") ?? "/painel"
      router.push(destino)
      router.refresh()
    } catch {
      toast.error("Erro ao entrar. Tente novamente.")
      setCarregando(false)
    }
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4" noValidate>
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-[13px] font-medium text-[#171717]"
        >
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={dados.email}
          onChange={(e) => setDados({ ...dados, email: e.target.value })}
          placeholder="seu.email@exemplo.com"
          className="h-10 w-full rounded-md border border-[#e5e5e5] bg-white px-3 text-[14px] text-[#171717] outline-none transition-colors placeholder:text-[#737373] focus:border-[#171717] focus:ring-[3px] focus:ring-black/8"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-[13px] font-medium text-[#171717]"
        >
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={dados.password}
          onChange={(e) => setDados({ ...dados, password: e.target.value })}
          placeholder="••••••••"
          className="h-10 w-full rounded-md border border-[#e5e5e5] bg-white px-3 text-[14px] text-[#171717] outline-none transition-colors placeholder:text-[#737373] focus:border-[#171717] focus:ring-[3px] focus:ring-black/8"
        />
      </div>

      <button
        type="submit"
        disabled={carregando}
        className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-[#262626] disabled:opacity-60"
      >
        {carregando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {carregando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  )
}
