import Link from "next/link"
import { Newspaper, Lock } from "lucide-react"
import { BarraPublica } from "@/components/barra-publica"
import { CardNoticia } from "@/components/card-noticia"
import { MarcaFisio } from "@/components/marca-fisio"
import { notFound } from "next/navigation"
import { buscarNoticias } from "@/lib/noticias"
import { configuracaoLigada } from "@/lib/configuracoes-servidor"

export const metadata = {
  title: "Notícias da turma",
  description: "Trabalhos, seminários, eventos e congressos da turma de Fisioterapia da UNIP.",
}

/** Vitrine sempre fresca: um prazo novo não pode esperar cache para aparecer. */
export const dynamic = "force-dynamic"

export default async function PaginaNoticias() {
  // Desligada, a vitrine deixa de existir para quem está de fora — nem uma
  // página vazia, que já entregaria que a turma usa o portal.
  if (!(await configuracaoLigada("noticias_publicas"))) notFound()

  const { proximas, passadas } = await buscarNoticias()

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0e0f2d]">
      <div aria-hidden className="ceu-estrelado pointer-events-none absolute inset-0" />

      <BarraPublica atual="noticias" />

      <div className="relative z-10 mx-auto max-w-[840px] px-5 pb-24 pt-12">
        <header className="mb-10">
          <h1 className="titulo-display text-[34px] md:text-[44px]">Notícias da turma</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-fog">
            O que está chegando: trabalhos, seminários, eventos e congressos.
            Sem precisar entrar.
          </p>
        </header>

        {proximas.length === 0 && passadas.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-blurple/15 text-hover-blurple">
              <Newspaper size={26} aria-hidden />
            </span>
            <h2 className="titulo-display text-[22px]">Nada publicado ainda</h2>
            <p className="max-w-[420px] text-[15px] leading-relaxed text-fog">
              Assim que o administrador da turma publicar a primeira atividade, ela aparece
              aqui para todo mundo.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {proximas.length > 0 && (
              <section className="flex flex-col gap-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-greyple">
                  A fazer · {proximas.length}
                </h2>
                {proximas.map((noticia) => (
                  <CardNoticia key={noticia.id} noticia={noticia} />
                ))}
              </section>
            )}

            {passadas.length > 0 && (
              <section className="flex flex-col gap-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-greyple">
                  Já passou · {passadas.length}
                </h2>
                {passadas.map((noticia) => (
                  <CardNoticia key={noticia.id} noticia={noticia} />
                ))}
              </section>
            )}
          </div>
        )}

        <aside className="mt-12 flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-hover-blurple">
            <Lock size={14} aria-hidden />
            Quer o conteúdo completo?
          </span>
          <p className="m-0 text-[15px] leading-relaxed text-fog">
            A descrição de cada atividade, os arquivos do professor para baixar e o
            cronograma com seu acompanhamento de estudo ficam dentro do portal.
          </p>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <Link href="/login" className="btn-primario">
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 text-[15px] font-medium text-fog transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              Criar conta
            </Link>
          </div>
        </aside>
      </div>

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
