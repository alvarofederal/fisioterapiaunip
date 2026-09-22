import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { configuracaoLigada } from "@/lib/configuracoes-servidor"
import { RegisterForm } from "./_components/register-form"
import { MarcaFisio } from "@/components/marca-fisio"

export const metadata = { title: "Criar conta" }

export default async function PaginaCadastro() {
  const sessao = await auth()
  if (sessao?.user) redirect("/painel")

  // A rota some junto com a opção. A API de cadastro também recusa — esta
  // checagem é o aviso, não a tranca.
  if (!(await configuracaoLigada("cadastro_aberto"))) redirect("/login?cadastro=fechado")

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0e0f2d] px-5 py-12">
      <div aria-hidden className="ceu-estrelado pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="malha-estrelas pointer-events-none absolute inset-x-0 top-0 h-[500px] opacity-40"
        style={{
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 0%, #000 20%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 0%, #000 20%, transparent 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <MarcaFisio className="mb-6" />
          <h1 className="titulo-display text-[30px]">Criar conta</h1>
          <p className="mt-2 text-[15px] text-fog">
            O administrador da turma libera seu acesso depois
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-8">
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-[14px] text-fog">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-medium text-hover-blurple underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
