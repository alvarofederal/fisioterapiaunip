import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { BookOpen, CalendarClock, FileDown } from "lucide-react"

const RECURSOS = [
  { icone: BookOpen, cor: "var(--materia-laranja)", texto: "Matérias e professores" },
  { icone: CalendarClock, cor: "var(--materia-roxo)", texto: "Trabalhos com data de entrega" },
  { icone: FileDown, cor: "var(--materia-verde)", texto: "Slides e fotos do quadro" },
]

export default async function PaginaInicial() {
  const sessao = await auth()
  if (sessao?.user) redirect("/painel")

  return (
    <main className="relative min-h-screen bg-white">
      <div
        aria-hidden
        className="fundo-pontilhado pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{
          maskImage: "radial-gradient(ellipse 75% 70% at 50% 0%, #000 35%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 50% 0%, #000 35%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto flex max-w-[1200px] flex-col items-center px-5 pt-20 pb-24 text-center md:pt-28">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="marca-simbolo grid h-9 w-9 place-items-center rounded-lg">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-[#0a0a0a] text-[13px] font-semibold text-white">
              F
            </span>
          </span>
          <span className="text-[17px] font-semibold tracking-[-0.01em] text-[#171717]">
            Fisioterapia UNIP
          </span>
        </div>

        <h1 className="max-w-[720px] text-[36px] font-medium leading-[1.08] tracking-[-0.02em] text-[#171717] md:text-[48px] md:leading-none">
          O portal da turma,
          <br />
          sem ninguém se perder.
        </h1>

        <p className="mt-5 max-w-[560px] text-[16px] leading-relaxed text-[#525252] md:text-[18px]">
          Matérias, trabalhos, datas de entrega e o material dos professores —
          tudo num lugar só, acessível para todo mundo da turma.
        </p>

        <div className="mt-8 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-black px-6 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-[#262626]"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#e5e5e5] bg-white px-6 text-[14px] font-medium text-[#171717] transition-colors hover:border-[#d4d4d4] hover:bg-[#f5f5f5]"
          >
            Criar minha conta
          </Link>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-2">
          {RECURSOS.map(({ icone: Icone, cor, texto }) => (
            <span
              key={texto}
              className="inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-[14px] font-medium text-[#171717] shadow-sm"
            >
              <Icone size={15} style={{ color: cor }} aria-hidden />
              {texto}
            </span>
          ))}
        </div>

        <p className="mt-14 text-[13px] text-[#737373]">
          O acesso é liberado pelo administrador da turma.
        </p>
      </div>
    </main>
  )
}
