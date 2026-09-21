"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MailCheck, Clock } from "lucide-react"
import { toast } from "sonner"

type Admin = { nome: string; email: string } | null

export function RegisterForm() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)
  const [pendente, setPendente] = useState<{ mensagem: string; admin: Admin } | null>(null)
  const [dados, setDados] = useState({ ra: "", nome: "", email: "", password: "" })

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

      setPendente({ mensagem: corpo.message, admin: corpo.admin ?? null })
    } catch {
      toast.error("Erro ao criar conta. Tente novamente.")
      setCarregando(false)
    }
  }

  if (pendente) {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-ember-orange/15 text-ember-orange">
          <Clock size={26} aria-hidden />
        </span>
        <h2 className="titulo-display text-[22px]">Aguardando liberação</h2>
        <p className="text-[15px] leading-relaxed text-fog">{pendente.mensagem}</p>

        {pendente.admin && (
          <div className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="m-0 mb-3 text-[13px] text-fog">
              Demorando? Avise <strong className="font-medium text-white">{pendente.admin.nome}</strong>,
              que administra o portal da turma.
            </p>
            <a
              href={`mailto:${pendente.admin.email}?subject=${encodeURIComponent("Liberação de acesso — Portal Fisioterapia UNIP")}&body=${encodeURIComponent(`Oi! Acabei de criar minha conta no portal.\n\nNome: ${dados.nome}\nRA: ${dados.ra}\nE-mail: ${dados.email}\n\nPode liberar meu acesso?`)}`}
              className="btn-primario w-full"
            >
              <MailCheck size={16} aria-hidden />
              Avisar o administrador
            </a>
          </div>
        )}

        <p className="text-[13px] text-greyple">
          Assim que liberarem, é só entrar com seu e-mail e senha.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-5" noValidate>
      <div>
        <label htmlFor="ra" className="rotulo">
          RA <span className="font-normal text-greyple">(número da matrícula)</span>
        </label>
        <input
          id="ra"
          type="text"
          inputMode="numeric"
          required
          maxLength={30}
          value={dados.ra}
          onChange={(e) => setDados({ ...dados, ra: e.target.value })}
          placeholder="Ex.: 1234567890"
          className="campo"
        />
        <p className="mt-2 text-[12px] text-greyple">
          É por ele que o administrador confere que você é da turma.
        </p>
      </div>

      <div>
        <label htmlFor="nome" className="rotulo">
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
          className="campo"
        />
      </div>

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

      <div>
        <label htmlFor="password" className="rotulo">
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
          className="campo"
        />
        <p className="mt-2 text-[12px] text-greyple">
          Mínimo de 8 caracteres, com maiúscula, minúscula e número.
        </p>
      </div>

      <button type="submit" disabled={carregando} className="btn-primario mt-1 w-full">
        {carregando && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {carregando ? "Criando..." : "Criar conta"}
      </button>
    </form>
  )
}
