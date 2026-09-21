import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { BookOpen, CalendarClock, FileDown, ShieldCheck } from "lucide-react"
import { MarcaFisio } from "@/components/marca-fisio"

const RECURSOS = [
  {
    icone: BookOpen,
    cor: "#fda220",
    titulo: "Matérias e professores",
    texto: "Quem dá a aula, em que dia, com as anotações que importam.",
  },
  {
    icone: CalendarClock,
    cor: "#eb459e",
    titulo: "Trabalhos com prazo",
    texto: "Data de entrega em destaque. Ninguém mais descobre em cima da hora.",
  },
  {
    icone: FileDown,
    cor: "#57f287",
    titulo: "Slides e fotos do quadro",
    texto: "O material do professor fica guardado e pronto para baixar.",
  },
]

export default async function PaginaInicial() {
  const sessao = await auth()
  if (sessao?.user) redirect("/painel")

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0e0f2d]">
      <div aria-hidden className="ceu-estrelado pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="malha-estrelas pointer-events-none absolute inset-x-0 top-0 h-[700px] opacity-40"
        style={{
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, #000 20%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, #000 20%, transparent 100%)",
        }}
      />

      {/* Barra de topo */}
      <header className="relative z-10 mx-auto flex h-20 max-w-[1200px] items-center justify-between px-5">
        <MarcaFisio />
        <Link
          href="/login"
          className="rounded-2xl bg-white px-4 py-2.5 text-[15px] font-medium text-[#23272a] transition-transform hover:scale-[1.03]"
        >
          Entrar
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-[1200px] px-5 pt-14 pb-24 text-center md:pt-24">
        <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[13px] font-medium text-fog backdrop-blur">
          <ShieldCheck size={14} className="text-spring-green" aria-hidden />
          Acesso só para a turma
        </span>

        <h1 className="titulo-display mx-auto max-w-[900px] text-[31px] min-[420px]:text-[38px] sm:text-[52px] md:text-[64px]">
          O portal da turma,
          <br />
          sem ninguém se perder.
        </h1>

        <p className="mx-auto mt-7 max-w-[620px] text-[16px] leading-relaxed text-fog md:text-[18px]">
          Matérias, trabalhos, datas de entrega e o material dos professores —
          tudo num lugar só, acessível para todo mundo da turma.
        </p>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-blurple px-6 py-[19px] text-[16px] font-medium text-white transition-colors hover:bg-dark-blurple"
          >
            Criar minha conta
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-[15px] text-[16px] font-medium text-[#23272a] transition-transform hover:scale-[1.02]"
          >
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* Painéis de recurso — cada um com a própria iluminação */}
      <section className="relative z-10 mx-auto max-w-[1200px] px-5 pb-28">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {RECURSOS.map(({ icone: Icone, cor, titulo, texto }) => (
            <article
              key={titulo}
              className="painel-recurso border border-white/10 bg-white/[0.04] backdrop-blur-sm transition-colors hover:border-white/20"
            >
              <span
                className="mb-5 inline-grid size-12 place-items-center rounded-2xl"
                style={{ background: `${cor}1f`, color: cor }}
              >
                <Icone size={22} aria-hidden />
              </span>
              <h2 className="titulo-display mb-2 text-[20px] leading-tight">{titulo}</h2>
              <p className="text-[15px] leading-relaxed text-fog">{texto}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 bg-[#23272a]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-5 py-10 text-[14px] text-fog sm:flex-row">
          <MarcaFisio tamanho="pequeno" />
          <p className="m-0 text-center sm:text-right">
            Portal da turma de Fisioterapia — UNIP
          </p>
        </div>
      </footer>
    </main>
  )
}
