import Link from "next/link"
import { BookOpen, User2, Archive } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { ABREVIACAO_DIA, CORES_MATERIA, ORDEM_DIAS } from "@/lib/dominio"
import { DialogoMateria } from "./_components/dialogo-materia"
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

  const [materias, totalAtivas, totalArquivadas] = await Promise.all([
    prisma.materia.findMany({
      where: { arquivada: vendoArquivadas },
      include: { _count: { select: { atividades: true } } },
    }),
    prisma.materia.count({ where: { arquivada: false } }),
    prisma.materia.count({ where: { arquivada: true } }),
  ])

  const ordenadas = [...materias].sort((a, b) => {
    const posicao = ORDEM_DIAS.indexOf(a.diaSemana) - ORDEM_DIAS.indexOf(b.diaSemana)
    return posicao !== 0 ? posicao : a.nome.localeCompare(b.nome, "pt-BR")
  })

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="titulo-display text-[30px] md:text-[38px]">Matérias</h1>
          <p className="mt-2 text-[15px] text-fog">
            {totalAtivas === 0
              ? "Nenhuma matéria cadastrada"
              : `${totalAtivas} ${totalAtivas === 1 ? "matéria" : "matérias"} no semestre`}
          </p>
        </div>
        {ehAdmin && <DialogoMateria />}
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

      {ordenadas.length === 0 ? (
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
                ? "Cadastre a primeira matéria do semestre. Depois é só publicar as atividades dela."
                : "Assim que o administrador cadastrar as matérias, elas aparecem aqui."}
          </p>
          {ehAdmin && !vendoArquivadas && <DialogoMateria />}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ordenadas.map((materia) => {
            const tema = CORES_MATERIA[materia.cor]
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
                      materia={{
                        id: materia.id,
                        nome: materia.nome,
                        professor: materia.professor,
                        diaSemana: materia.diaSemana,
                        anotacoes: materia.anotacoes,
                        cor: materia.cor,
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
