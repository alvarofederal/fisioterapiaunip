"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { CampoSenha } from "@/components/campo-senha"

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
        // conta está apenas aguardando liberação. Ver src/lib/auth.ts.
        toast.error("Não foi possível entrar", {
          description:
            "E-mail ou senha incorretos — ou sua conta ainda não foi liberada pelo administrador.",
        })
        setCarregando(false)
        return
      }

      router.push(parametros.get("redirect") ?? "/painel")
      router.refresh()
    } catch {
      toast.error("Erro ao entrar. Tente novamente.")
      setCarregando(false)
    }
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-5" noValidate>
      <div>
        <label htmlFor="email" className="rotulo">
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
          className="campo"
        />
      </div>

      <CampoSenha
        id="password"
        label="Senha"
        value={dados.password}
        onChange={(senha) => setDados({ ...dados, password: senha })}
        autoComplete="current-password"
        required
      />

      <button type="submit" disabled={carregando} className="btn-primario mt-1 w-full">
        {carregando && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {carregando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  )
}
