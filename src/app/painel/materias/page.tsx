import Link from "next/link"
import { BookOpen, User2, Archive, Layers, ChevronRight } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import {
  ABREVIACAO_DIA,
  CORES_MATERIA,
  ORDEM_DIAS,
  ROTULO_MODALIDADE,
  rotuloSemestre,
} from "@/lib/dominio"
import { DialogoMateria, type SemestreOpcao } from "./_components/dialogo-materia"
import { DialogoSemestre } from "./_components/dialogo-semestre"
import { AcoesMateria } from "./_components/acoes-materia"

export const metadata = { title: "Matérias" }

export default async function PaginaMaterias({
  searchParams,
}: {
  searchParams: Promise<{ arquivadas?: string }>
}) {
  const sessao = await auth()
  const { arquivadas } = await searchParams
  const vendoArquivadas = arquivadas === "1"

  // O papel vem do banco, não do token — ver src/lib/autorizacao.ts.
  const eu = sessao?.user?.id
    ? await prisma.user.findUnique({
        where: { id: sessao.user.id },
        select: { role: true },
      })
    : null
  const ehAdmin = eu?.role === "ADMIN"

  const [materias, semestres, totalAtivas, totalArquivadas] = await Promise.all([
    prisma.materia.findMany({
      where: { arquivada: vendoArquivadas },
      include: {
        semestre: { select: { id: true, ano: true, periodo: true } },
        _count: { select: { atividades: true, unidades: true } },
      },
    }),
    // Do mais recente para o mais antigo: é o semestre em curso que interessa,
    // e é ele que vira o padrão da matéria nova.
    prisma.semestre.findMany({
      orderBy: [{ ano: "desc" }, { periodo: "desc" }],
      select: { id: true, ano: true, periodo: true },
    }),
    prisma.materia.count({ where: { arquivada: false } }),
    prisma.materia.count({ where: { arquivada: true } }),
  ])

  const opcoesSemestre: SemestreOpcao[] = semestres

  // Um grupo por semestre, na ordem dos semestres. A matéria fica sob o
  // semestre dela; a listagem plana misturava períodos assim que a turma
  // avançasse.
  const grupos = semestres
    .map((s) => ({
      semestre: s,
      materias: materias
        .filter((m) => m.semestreId === s.id)
        .sort((a, b) => {
          const posicao = ORDEM_DIAS.indexOf(a.diaSemana) - ORDEM_DIAS.indexOf(b.diaSemana)
          return posicao !== 0 ? posicao : a.nome.localeCompare(b.nome, "pt-BR")
        }),
    }))
    .filter((g) => g.materias.length > 0)

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="titulo-display text-[30px] md:text-[38px]">Matérias</h1>
          <p className="mt-2 text-[15px] text-fog">
            {totalAtivas === 0
              ? "Nenhuma matéria cadastrada"
              : `${totalAtivas} ${totalAtivas === 1 ? "matéria" : "matérias"} no curso`}
          </p>
        </div>
        {ehAdmin && (
          <div className="flex flex-wrap gap-2">
            <DialogoSemestre />
            <DialogoMateria semestres={opcoesSemestre} />
          </div>
        )}
      </header>

      {totalArquivadas > 0 && (
        <nav className="flex w-fit gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
          <Aba href="/painel/materias" ativo={!vendoArquivadas} contagem={totalAtivas}>
            <BookOpen size={15} aria-hidden />
            Ativas
          </Aba>
          <Aba
            href="/painel/materias?arquivadas=1"
            ativo={vendoArquivadas}
            contagem={totalArquivadas}
          >
            <Archive size={15} aria-hidden />
            Arquivadas
          </Aba>
        </nav>
      )}

      {grupos.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-ember-orange/15 text-ember-orange">
            <BookOpen size={26} aria-hidden />
          </span>
          <h2 className="titulo-display text-[22px]">
            {vendoArquivadas ? "Nada arquivado" : "Nenhuma matéria ainda"}
          </h2>
          <p className="max-w-[460px] text-[15px] leading-relaxed text-fog">
            {vendoArquivadas
              ? "Matérias arquivadas ficam guardadas aqui."
              : ehAdmin
                ? semestres.length === 0
                  ? "Cadastre primeiro o semestre. Depois as matérias entram dentro dele."
                  : "Cadastre a primeira matéria do semestre. Depois é só publicar as atividades dela."
                : "Assim que o administrador cadastrar as matérias, elas aparecem aqui."}
          </p>
          {ehAdmin &&
            !vendoArquivadas &&
            (semestres.length === 0 ? (
              <DialogoSemestre />
            ) : (
              <DialogoMateria semestres={opcoesSemestre} />
            ))}
        </div>
      ) : (
        <div className="flex flex-col gap-9">
          {grupos.map(({ semestre, materias: doSemestre }) => (
            <section key={semestre.id} className="flex flex-col gap-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-greyple">
                {rotuloSemestre(semestre.ano, semestre.periodo)} · {doSemestre.length}
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {doSemestre.map((materia) => {
                  const tema = CORES_MATERIA[materia.cor]
                  const ehEad = materia.modalidade === "EAD"

                  return (
                    <article
                      key={materia.id}
                      className={cn(
                        "acento-lateral relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 pl-6 transition-colors hover:border-white/20",
                        materia.arquivada && "opacity-65"
                      )}
                      style={{ ["--acento" as string]: tema.base }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="titulo-display text-[18px] leading-tight">
                          <Link
                            href={`/painel/materias/${materia.id}`}
                            className="transition-colors hover:text-hover-blurple"
                          >
                            {materia.nome}
                          </Link>
                        </h3>
                        <span
                          className="inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                          style={{
                            background: tema.suave,
                            color: tema.base,
                            borderColor: tema.borda,
                          }}
                        >
                          {ehEad ? ROTULO_MODALIDADE.EAD : ABREVIACAO_DIA[materia.diaSemana]}
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

                      <Link
                        href={`/painel/materias/${materia.id}`}
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-hover-blurple transition-colors hover:text-white"
                      >
                        <Layers size={14} aria-hidden />
                        {materia._count.unidades === 0
                          ? "Abrir matéria"
                          : `${materia._count.unidades} ${
                              materia._count.unidades === 1 ? "unidade" : "unidades"
                            }`}
                        <ChevronRight size={14} aria-hidden />
                      </Link>

                      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] pt-3">
                        <p className="text-[12px] text-greyple">
                          {materia._count.atividades === 0
                            ? "Nenhuma atividade"
                            : `${materia._count.atividades} ${
                                materia._count.atividades === 1 ? "atividade" : "atividades"
                              }`}
                        </p>
                        {ehAdmin && (
                          <AcoesMateria
                            semestres={opcoesSemestre}
                            materia={{
                              id: materia.id,
                              nome: materia.nome,
                              professor: materia.professor,
                              diaSemana: materia.diaSemana,
                              anotacoes: materia.anotacoes,
                              cor: materia.cor,
                              modalidade: materia.modalidade,
                              semestreId: materia.semestreId,
                            }}
                            arquivada={materia.arquivada}
                            temAtividades={materia._count.atividades > 0}
                          />
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function Aba({
  href,
  ativo,
  contagem,
  children,
}: {
  href: string
  ativo: boolean
  contagem: number
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[14px] font-medium transition-colors",
        ativo ? "bg-blurple text-white" : "text-fog hover:bg-white/[0.06] hover:text-white"
      )}
    >
      {children}
      <span
        className={cn(
          "rounded-full px-1.5 text-[11px] tabular-nums",
          ativo ? "bg-white/20" : "bg-white/10"
        )}
      >
        {contagem}
      </span>
    </Link>
  )
}
