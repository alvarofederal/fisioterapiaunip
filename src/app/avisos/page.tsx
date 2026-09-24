import Link from "next/link"
import { Megaphone, Lock } from "lucide-react"
import { BarraPublica } from "@/components/barra-publica"
import { MarcaFisio } from "@/components/marca-fisio"
import { buscarAvisosPublicos } from "@/lib/avisos"

export const metadata = {
  title: "Avisos da turma",
  description: "Recados fixos da turma de Fisioterapia da UNIP.",
}

/** Vitrine sempre fresca: recado novo não pode esperar cache para aparecer. */
export const dynamic = "force-dynamic"

export default async function PaginaAvisosPublica() {
  const avisos = await buscarAvisosPublicos()

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0e0f2d]">
      <div aria-hidden className="ceu-estrelado pointer-events-none absolute inset-0" />

      <BarraPublica atual="avisos" />

      <div className="relative z-10 mx-auto max-w-[840px] px-5 pb-24 pt-12">
        <header className="mb-10">
          <h1 className="titulo-display text-[34px] md:text-[44px]">Avisos da turma</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-fog">
            Recados que valem o semestre inteiro. Sem precisar entrar.
          </p>
        </header>

        {avisos.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-ember-orange/15 text-ember-orange">
              <Megaphone size={26} aria-hidden />
            </span>
            <h2 className="titulo-display text-[22px]">Nenhum aviso publicado</h2>
            <p className="max-w-[420px] text-[15px] leading-relaxed text-fog">
              Quando a representação publicar um recado aberto, ele aparece aqui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {avisos.map((aviso) => (
              <article
                key={aviso.id}
                className="acento-lateral overflow-hidden rounded-2xl border border-ember-orange/25 bg-ember-orange/[0.06] p-6 pl-7"
                style={{ ["--acento" as string]: "#fda220" }}
              >
                <h2 className="titulo-display text-[19px] leading-tight">{aviso.titulo}</h2>

                {/* HTML limpo por allowlist na gravação (src/lib/sanitizar.ts). */}
                <div
                  className="conteudo-rico mt-3 text-[15px] leading-relaxed text-fog"
                  dangerouslySetInnerHTML={{ __html: aviso.conteudo }}
                />
              </article>
            ))}
          </div>
        )}

        <aside className="mt-12 flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-hover-blurple">
            <Lock size={14} aria-hidden />
            Quer o resto?
          </span>
          <p className="m-0 text-[15px] leading-relaxed text-fog">
            O cronograma, os trabalhos com os arquivos para baixar e a matéria de cada aula
            ficam dentro do portal.
          </p>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <Link href="/login" className="btn-primario">
              Entrar
            </Link>
            <Link href="/register" className="btn-secundario">
              Criar conta
            </Link>
          </div>
        </aside>
      </div>

      <footer className="relative z-10 border-t border-white/10 bg-[#23272a]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-5 py-8">
          <MarcaFisio />
          <p className="text-[14px] text-greyple">
            Portal da turma de Fisioterapia — UNIP
          </p>
        </div>
      </footer>
    </main>
  )
}
