import { BookOpen } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { ABREVIACAO_DIA, CORES_MATERIA, ORDEM_DIAS } from "@/lib/dominio"

export const metadata = { title: "Matérias" }

export default async function PaginaMaterias() {
  const sessao = await auth()
  const ehAdmin = sessao?.user.role === "ADMIN"

  const materias = await prisma.materia.findMany({
    where: { arquivada: false },
    orderBy: { nome: "asc" },
  })

  const ordenadas = [...materias].sort((a, b) => {
    const posicao = ORDEM_DIAS.indexOf(a.diaSemana) - ORDEM_DIAS.indexOf(b.diaSemana)
    return posicao !== 0 ? posicao : a.nome.localeCompare(b.nome, "pt-BR")
  })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-medium tracking-[-0.01em] text-[#171717]">
            Matérias
          </h1>
          <p className="mt-1 text-[14px] text-[#737373]">
            {materias.length === 0
              ? "Nenhuma matéria cadastrada"
              : `${materias.length} ${materias.length === 1 ? "matéria" : "matérias"} no semestre`}
          </p>
        </div>
      </header>

      {ordenadas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#d4d4d4] bg-[#f5f5f5] px-6 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-[#e5e5e5] bg-white text-[#737373]">
            <BookOpen size={22} aria-hidden />
          </span>
          <h2 className="text-[16px] font-semibold text-[#171717]">
            Nenhuma matéria cadastrada
          </h2>
          <p className="max-w-[420px] text-[14px] text-[#525252]">
            {ehAdmin
              ? "O formulário de cadastro entra na próxima etapa do desenvolvimento."
              : "Assim que o administrador cadastrar as matérias, elas aparecem aqui."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordenadas.map((materia) => {
            const tema = CORES_MATERIA[materia.cor]
            return (
              <article
                key={materia.id}
                className="acento-lateral relative flex flex-col gap-2.5 overflow-hidden rounded-xl border border-[#e5e5e5] bg-white p-4 pl-5 transition-colors hover:border-[#d4d4d4]"
                style={{ ["--acento" as string]: tema.base }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.01em] text-[#171717]">
                    {materia.nome}
                  </h3>
                  <span
                    className="inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: tema.suave,
                      color: tema.base,
                      borderColor: tema.borda,
                    }}
                  >
                    {ABREVIACAO_DIA[materia.diaSemana]}
                  </span>
                </div>

                <p className="text-[14px] text-[#525252]">
                  {materia.professor || (
                    <span className="italic text-[#a3a3a3]">Professor não informado</span>
                  )}
                </p>

                {materia.anotacoes && (
                  <p className="line-clamp-4 whitespace-pre-line text-[14px] leading-relaxed text-[#525252]">
                    {materia.anotacoes}
                  </p>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
