import { BookOpen, User2 } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { ABREVIACAO_DIA, CORES_MATERIA, ORDEM_DIAS } from "@/lib/dominio"

export const metadata = { title: "Matérias" }

export default async function PaginaMaterias() {
  const sessao = await auth()
  const ehAdmin = sessao?.user.role === "ADMIN"

  const materias = await prisma.materia.findMany({
    where: { arquivada: false },
    include: { _count: { select: { trabalhos: true } } },
  })

  const ordenadas = [...materias].sort((a, b) => {
    const posicao = ORDEM_DIAS.indexOf(a.diaSemana) - ORDEM_DIAS.indexOf(b.diaSemana)
    return posicao !== 0 ? posicao : a.nome.localeCompare(b.nome, "pt-BR")
  })

  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="titulo-display text-[30px] md:text-[38px]">Matérias</h1>
        <p className="mt-2 text-[15px] text-fog">
          {materias.length === 0
            ? "Nenhuma matéria cadastrada"
            : `${materias.length} ${materias.length === 1 ? "matéria" : "matérias"} no semestre`}
        </p>
      </header>

      {ordenadas.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-ember-orange/15 text-ember-orange">
            <BookOpen size={26} aria-hidden />
          </span>
          <h2 className="titulo-display text-[22px]">Nenhuma matéria ainda</h2>
          <p className="max-w-[460px] text-[15px] leading-relaxed text-fog">
            {ehAdmin
              ? "O formulário de cadastro entra na próxima etapa do desenvolvimento."
              : "Assim que o administrador cadastrar as matérias, elas aparecem aqui."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ordenadas.map((materia) => {
            const tema = CORES_MATERIA[materia.cor]
            return (
              <article
                key={materia.id}
                className="acento-lateral relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 pl-6 transition-colors hover:border-white/20"
                style={{ ["--acento" as string]: tema.base }}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="titulo-display text-[18px] leading-tight">{materia.nome}</h2>
                  <span
                    className="inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      background: tema.suave,
                      color: tema.base,
                      borderColor: tema.borda,
                    }}
                  >
                    {ABREVIACAO_DIA[materia.diaSemana]}
                  </span>
                </div>

                <p className="flex items-center gap-2 text-[14px] text-fog">
                  <User2 size={14} className="text-greyple" aria-hidden />
                  {materia.professor || (
                    <span className="italic text-greyple">Professor não informado</span>
                  )}
                </p>

                {materia.anotacoes && (
                  <p className="line-clamp-4 whitespace-pre-line text-[14px] leading-relaxed text-fog">
                    {materia.anotacoes}
                  </p>
                )}

                <p className="mt-auto border-t border-white/[0.08] pt-3 text-[12px] text-greyple">
                  {materia._count.trabalhos === 0
                    ? "Nenhum trabalho publicado"
                    : `${materia._count.trabalhos} ${
                        materia._count.trabalhos === 1 ? "trabalho" : "trabalhos"
                      }`}
                </p>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
