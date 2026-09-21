"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

const CLASSE_CAMPO =
  "h-10 w-full rounded-md border border-[#e5e5e5] bg-white px-3 text-[14px] text-[#171717] outline-none transition-colors placeholder:text-[#737373] focus:border-[#171717] focus:ring-[3px] focus:ring-black/8"

export function RegisterForm() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)
  const [concluido, setConcluido] = useState<string | null>(null)
  const [dados, setDados] = useState({ nome: "", email: "", password: "" })

  async function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault()
    setCarregando(true)

    try {
      const resposta = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      })
      const corpo = await resposta.json()

      if (!resposta.ok) {
        toast.error(corpo.error ?? "Não foi possível criar a conta")
        setCarregando(false)
        return
      }

      if (corpo.primeiroAcesso) {
        toast.success("Conta de administrador criada!")
        router.push("/login")
        return
      }

      setConcluido(corpo.message)
    } catch {
      toast.error("Erro ao criar conta. Tente novamente.")
      setCarregando(false)
    }
  }

  if (concluido) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="h-10 w-10 text-[#16a34a]" aria-hidden />
        <h2 className="text-[16px] font-semibold text-[#171717]">Conta criada</h2>
        <p className="text-[14px] leading-relaxed text-[#525252]">{concluido}</p>
        <p className="text-[13px] text-[#737373]">
          Assim que for liberado, você já consegue entrar com seu e-mail e senha.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4" noValidate>
      <div>
        <label htmlFor="nome" className="mb-1.5 block text-[13px] font-medium text-[#171717]">
          Nome completo
        </label>
        <input
          id="nome"
          type="text"
          autoComplete="name"
          required
          maxLength={80}
          value={dados.nome}
          onChange={(e) => setDados({ ...dados, nome: e.target.value })}
          placeholder="Como seus colegas te conhecem"
          className={CLASSE_CAMPO}
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-[#171717]">
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
          className={CLASSE_CAMPO}
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-[#171717]">
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={dados.password}
          onChange={(e) => setDados({ ...dados, password: e.target.value })}
          placeholder="••••••••"
          className={CLASSE_CAMPO}
        />
        <p className="mt-1.5 text-[12px] text-[#737373]">
          Mínimo de 8 caracteres, com maiúscula, minúscula e número.
        </p>
      </div>

      <button
        type="submit"
        disabled={carregando}
        className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-[#262626] disabled:opacity-60"
      >
        {carregando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {carregando ? "Criando..." : "Criar conta"}
      </button>
    </form>
  )
}
