import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, User2, Layers, Printer, GraduationCap } from "lucide-react"
import prisma from "@/lib/prisma"
import {
  CORES_MATERIA,
  ROTULO_DIA,
  ROTULO_MODALIDADE,
  rotuloSemestre,
} from "@/lib/dominio"
import {
  progressoDaMateria,
  PROGRESSO_VAZIO,
  type UnidadeComProgresso,
} from "@/lib/unidades"
import { exigirRotaLiberada } from "@/lib/porta-de-rota"
import { PainelUnidade } from "./_components/painel-unidade"
import { DialogoUnidade } from "./_components/dialogo-unidade"

export const metadata = { title: "Matéria" }

export default async function PaginaMateria({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { usuarioId, ehAdmin } = await exigirRotaLiberada("menu_materias")

  const { id } = await params

  const materia = await prisma.materia.findUnique({
      where: { id },
      include: {
        semestre: { select: { ano: true, periodo: true } },
        unidades: {
          orderBy: { numero: "asc" },
          include: {
            // `where` pelo usuário da sessão é a barreira: o progresso e o
            // resumo dos colegas nem saem do banco.
            progressos: { where: { usuarioId } },
            teleaulas: {
              orderBy: { numero: "asc" },
              include: { estudos: { where: { usuarioId } } },
            },
          },
        },
      },
  })

  if (!materia) notFound()

  const tema = CORES_MATERIA[materia.cor]

  const unidades: UnidadeComProgresso[] = materia.unidades.map((u) => ({
    id: u.id,
    numero: u.numero,
    titulo: u.titulo,
    progresso: u.progressos[0]
      ? {
          livroLido: u.progressos[0].livroLido,
          slidesVistos: u.progressos[0].slidesVistos,
          atividadeFeita: u.progressos[0].atividadeFeita,
          questionarioFeito: u.progressos[0].questionarioFeito,
        }
      : PROGRESSO_VAZIO,
    teleaulas: u.teleaulas.map((t) => ({
      id: t.id,
      numero: t.numero,
      titulo: t.titulo,
      status: t.estudos[0]?.status ?? "A_ESTUDAR",
      anotacoes: t.estudos[0]?.anotacoes ?? null,
    })),
  }))

  const total = progressoDaMateria(unidades)
  const temResumo = unidades.some((u) => u.teleaulas.some((t) => t.anotacoes?.trim()))

  return (
    <div className="flex flex-col gap-7">
      <Link
        href="/painel/materias"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-fog transition-colors hover:text-white"
      >
        <ArrowLeft size={15} aria-hidden />
        Matérias
      </Link>

      <header
        className="acento-lateral overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 pl-7"
        style={{ ["--acento" as string]: tema.base }}
      >
        <h1 className="titulo-display text-[26px] leading-tight md:text-[32px]">
          {materia.nome}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-fog">
          <span className="flex items-center gap-2">
            <User2 size={14} className="text-greyple" aria-hidden />
            {materia.professor || <span className="italic text-greyple">Sem professor</span>}
          </span>
          <span className="flex items-center gap-2">
            <GraduationCap size={14} className="text-greyple" aria-hidden />
            {rotuloSemestre(materia.semestre.ano, materia.semestre.periodo)}
          </span>
          <span className="flex items-center gap-2">
            <Layers size={14} className="text-greyple" aria-hidden />
            {ROTULO_MODALIDADE[materia.modalidade]}
            {materia.modalidade === "PRESENCIAL" &&
              materia.diaSemana !== "A_DEFINIR" &&
              ` · ${ROTULO_DIA[materia.diaSemana]}`}
          </span>
        </div>

        {materia.anotacoes && (
          <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-fog">
            {materia.anotacoes}
          </p>
        )}

        {unidades.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-[12px] text-greyple">
              <span>Seu progresso nesta matéria</span>
              <span className="tabular-nums">
                {total.feitos} de {total.total} · {total.percentual}%
              </span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuenow={total.percentual}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso na matéria"
            >
              <div
                className="h-full rounded-full transition-[width]"
                style={{ width: `${total.percentual}%`, background: tema.base }}
              />
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="titulo-display text-[20px]">
          Unidades {unidades.length > 0 && <span className="text-greyple">· {unidades.length}</span>}
        </h2>

        <div className="flex flex-wrap gap-2">
          {temResumo && (
            <Link href={`/painel/materias/${materia.id}/revisao`} className="btn-secundario">
              <Printer size={16} aria-hidden />
              Gerar PDF de revisão
            </Link>
          )}
          {ehAdmin && (
            <DialogoUnidade
              materiaId={materia.id}
              proximoNumero={(unidades.at(-1)?.numero ?? 0) + 1}
            />
          )}
        </div>
      </div>

      {unidades.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-blurple/15 text-hover-blurple">
            <Layers size={26} aria-hidden />
          </span>
          <h3 className="titulo-display text-[22px]">Nenhuma unidade ainda</h3>
          <p className="max-w-[460px] text-[15px] leading-relaxed text-fog">
            {ehAdmin
              ? "Cadastre a Unidade I com as teleaulas dela. Cada aluno marca o próprio progresso e escreve o próprio resumo."
              : "Assim que o administrador cadastrar as unidades, você marca aqui o que já estudou."}
          </p>
          {ehAdmin && <DialogoUnidade materiaId={materia.id} proximoNumero={1} />}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {unidades.map((unidade) => (
            <PainelUnidade
              key={unidade.id}
              unidade={unidade}
              corDaMateria={tema.base}
              ehAdmin={ehAdmin}
            />
          ))}
        </div>
      )}
    </div>
  )
}
