import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { LoginForm } from "./_components/login-form"
import { MarcaFisio } from "@/components/marca-fisio"

export const metadata = { title: "Entrar" }

export default async function PaginaLogin() {
  const sessao = await auth()
  if (sessao?.user) redirect("/painel")

  // Quem procurar se não conseguir entrar. Sai do banco — nenhum contato
  // fica escrito no código.
  const admin = await prisma.user
    .findFirst({
      where: { role: "ADMIN", ativo: true },
      select: { nome: true, email: true },
      orderBy: { criadoEm: "asc" },
    })
    .catch(() => null)

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
          <h1 className="titulo-display text-[30px]">Entrar no portal</h1>
          <p className="mt-2 text-[15px] text-fog">
            Use o e-mail que você cadastrou
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-8">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-[14px] text-fog">
          Ainda não tem conta?{" "}
          <Link
            href="/register"
            className="font-medium text-hover-blurple underline-offset-4 hover:underline"
          >
            Criar conta
          </Link>
        </p>

        {admin && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-center">
            <p className="m-0 text-[13px] leading-relaxed text-fog">
              Não consegue entrar? Sua conta pode estar aguardando liberação.
              <br />
              Fale com{" "}
              <a
                href={`mailto:${admin.email}?subject=${encodeURIComponent("Liberação de acesso — Portal Fisioterapia UNIP")}`}
                className="font-medium text-hover-blurple underline-offset-4 hover:underline"
              >
                {admin.nome}
              </a>
              , da turma.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
