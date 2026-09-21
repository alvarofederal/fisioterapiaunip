import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { LoginForm } from "./_components/login-form"

export const metadata = { title: "Entrar" }

export default async function PaginaLogin() {
  const sessao = await auth()
  if (sessao?.user) redirect("/painel")

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-white px-5 py-12">
      <div
        aria-hidden
        className="fundo-pontilhado pointer-events-none absolute inset-x-0 top-0 h-[360px]"
        style={{
          maskImage: "radial-gradient(ellipse 70% 80% at 50% 0%, #000 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 80% at 50% 0%, #000 30%, transparent 100%)",
        }}
      />

      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="mb-5 flex items-center gap-2.5">
            <span className="marca-simbolo grid h-9 w-9 place-items-center rounded-lg">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-[#0a0a0a] text-[13px] font-semibold text-white">
                F
              </span>
            </span>
            <span className="text-[17px] font-semibold tracking-[-0.01em] text-[#171717]">
              Fisioterapia UNIP
            </span>
          </Link>
          <h1 className="text-[24px] font-medium tracking-[-0.01em] text-[#171717]">
            Entrar no portal
          </h1>
          <p className="mt-1 text-[14px] text-[#737373]">
            Use o e-mail cadastrado na turma
          </p>
        </div>

        <div className="rounded-2xl border border-[#e5e5e5] bg-white p-6 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-[13px] text-[#737373]">
          Ainda não tem conta?{" "}
          <Link
            href="/register"
            className="font-medium text-[#2563eb] underline-offset-4 hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  )
}
