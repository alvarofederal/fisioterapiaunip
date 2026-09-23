import Link from "next/link"
import { CalendarDays, Target, ChevronDown, Users, CircleSlash } from "lucide-react"
import prisma from "@/lib/prisma"
import { exigirRotaLiberada } from "@/lib/porta-de-rota"
import { cn } from "@/lib/utils"
import { CORES_MATERIA } from "@/lib/dominio"
import { agruparCronograma } from "@/lib/cronograma"
import { CardAula, type AulaDoCronograma } from "./_components/card-aula"
import { DialogoAula } from "./_components/dialogo-aula"

export const metadata = { title: "Cronograma" }

export default async function PaginaCronograma({
  searchParams,
}: {
  searchParams: Promise<{ materia?: string }>
}) {
  const { usuarioId, ehAdmin } = await exigirRotaLiberada("menu_cronograma")

  const { materia: materiaFiltro } = await searchParams

  const [materias, aulas] = await Promise.all([
    prisma.materia.findMany({
      where: { arquivada: false },
      select: { id: true, nome: true, cor: true, modalidade: true },
      orderBy: { nome: "asc" },
    }),
    prisma.aula.findMany({
      // O cronograma é só do presencial da turma. O EaD saiu daqui e virou
      // Unidades e Teleaulas dentro da matéria, onde ele tem a forma do AVA.
      where: { donoId: null },
      include: {
        materia: { select: { id: true, nome: true, cor: true, professor: true } },
        estudos: {
          where: { usuarioId },
          select: { status: true, anotacoes: true },
        },
      },
      orderBy: { data: "asc" },
    }),
  ])

  const materiasPresenciais = materias.filter((m) => m.modalidade === "PRESENCIAL")

  const todas: AulaDoCronograma[] = aulas.map((aula) => ({
    id: aula.id,
    data: aula.data,
    modalidade: aula.modalidade,
    ehMeu: aula.donoId !== null,
    horaInicio: aula.horaInicio,
    horaFim: aula.horaFim,
    titulo: aula.titulo,
    conteudo: aula.conteudo,
    materia: aula.materia,
    meuEstudo: aula.estudos[0] ?? null,
  }))

  const visiveis = materiaFiltro
    ? todas.filter((a) => a.materia.id === materiaFiltro)
    : todas

  // Regras em src/lib/cronograma.ts, com teste: o que já passou sai da lista
  // principal sozinho, sem depender de clique.
  const { foco, presenciais, feitas, naoFeitas, revisadas, percentual } =
    agruparCronograma(visiveis, todas)

  const materiaAtual = materias.find((m) => m.id === materiaFiltro)
  const historico = [...naoFeitas, ...feitas]

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="titulo-display text-[28px] md:text-[34px]">Cronograma</h1>
          <p className="mt-1.5 text-[15px] text-fog">
            {todas.length} encontros · {revisadas} revisados
          </p>
        </div>
        {ehAdmin && materiasPresenciais.length > 0 && (
          <DialogoAula materias={materiasPresenciais} />
        )}
      </header>

      {todas.length > 0 && (
        <section aria-label="Progresso do semestre">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[13px] text-fog">Seu progresso</span>
            <span className="titulo-display text-[18px] text-spring-green">{percentual}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-spring-green transition-[width] duration-500"
              style={{ width: `${percentual}%` }}
            />
          </div>
        </section>
      )}

      {foco && (
        <section className="rounded-2xl border border-blurple/40 bg-blurple/[0.08] p-4">
          <p className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-hover-blurple">
            <Target size={13} aria-hidden />
            Próximo encontro
          </p>
          <CardAula aula={foco} ehAdmin={ehAdmin} destaque materias={materias} />
        </section>
      )}

      {materias.length > 1 && (
        <nav className="flex flex-wrap gap-1.5">
          <Chip href="/painel/cronograma" ativo={!materiaFiltro}>
            Todas
          </Chip>
          {materias.map((m) => {
            const tema = CORES_MATERIA[m.cor]
            const quantas = todas.filter((a) => a.materia.id === m.id).length
            if (quantas === 0) return null
            return (
              <Chip
                key={m.id}
                href={`/painel/cronograma?materia=${m.id}`}
                ativo={materiaFiltro === m.id}
                cor={tema.base}
                suave={tema.suave}
                borda={tema.borda}
              >
                {m.nome.length > 28 ? `${m.nome.slice(0, 28)}…` : m.nome}
                <span className="ml-1.5 opacity-70">{quantas}</span>
              </Chip>
            )
          })}
        </nav>
      )}

      {todas.length === 0 ? (
        <Vazio ehAdmin={ehAdmin} />
      ) : (
        <div className="flex flex-col gap-7">
          <Secao
            icone={Users}
            titulo="Presencial"
            sublinha="Datas da turma, iguais para todo mundo"
            aulas={presenciais}
            ehAdmin={ehAdmin}
            materias={materias}
            cor="#5865f2"
          />

          {/* O que passou, arquivado sozinho. Não estudadas primeiro, com cor
              própria, porque ainda dá para voltar e fazer. */}
          {historico.length > 0 && (
            <details className="group">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-greyple hover:text-white">
                <ChevronDown
                  size={14}
                  className="transition-transform group-open:rotate-180"
                  aria-hidden
                />
                Já passou · {historico.length}
                {naoFeitas.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ember-orange/15 px-2 py-0.5 text-[10px] text-ember-orange">
                    <CircleSlash size={10} aria-hidden />
                    {naoFeitas.length} sem estudo
                  </span>
                )}
              </summary>

              <div className="mt-3 flex flex-col gap-4">
                {naoFeitas.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    <p className="text-[12px] text-ember-orange">
                      A aula passou e você não marcou estudo — dá para fazer agora.
                    </p>
                    {naoFeitas.map((aula) => (
                      <CardAula
                        key={aula.id}
                        aula={aula}
                        ehAdmin={ehAdmin}
                        materias={materias}
                        naoFeita
                      />
                    ))}
                  </div>
                )}

                {feitas.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    <p className="text-[12px] text-greyple">Revisados · {feitas.length}</p>
                    {feitas.map((aula) => (
                      <CardAula
                        key={aula.id}
                        aula={aula}
                        ehAdmin={ehAdmin}
                        materias={materias}
                      />
                    ))}
                  </div>
                )}
              </div>
            </details>
          )}

          {presenciais.length === 0 && !foco && (
            <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-8 text-center text-[15px] text-fog">
              {materiaAtual
                ? "Nada marcado para o futuro nesta matéria."
                : "Nenhum encontro pela frente. Veja o histórico acima."}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Secao({
  icone: Icone,
  titulo,
  sublinha,
  aulas,
  ehAdmin,
  materias,
  cor,
  vazio,
}: {
  icone: React.ComponentType<{ size?: number; className?: string }>
  titulo: string
  sublinha: string
  aulas: AulaDoCronograma[]
  ehAdmin: boolean
  materias: { id: string; nome: string }[]
  cor: string
  vazio?: string
}) {
  if (aulas.length === 0 && !vazio) return null

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-baseline gap-x-2.5">
        <h2
          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: cor }}
        >
          <Icone size={12} aria-hidden />
          {titulo} · {aulas.length}
        </h2>
        <span className="text-[12px] text-greyple">{sublinha}</span>
      </div>

      {aulas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-4 py-5 text-center text-[14px] text-greyple">
          {vazio}
        </p>
      ) : (
        aulas.map((aula) => (
          <CardAula key={aula.id} aula={aula} ehAdmin={ehAdmin} materias={materias} />
        ))
      )}
    </section>
  )
}

function Vazio({ ehAdmin }: { ehAdmin: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-blurple/15 text-hover-blurple">
        <CalendarDays size={26} aria-hidden />
      </span>
      <h2 className="titulo-display text-[20px]">Cronograma vazio</h2>
      <p className="max-w-[420px] text-[15px] leading-relaxed text-fog">
        {ehAdmin
          ? "Monte o cronograma presencial da turma. O EaD fica nas Unidades de cada matéria."
          : "Aparece quando o administrador montar. O EaD fica nas Unidades de cada matéria."}
      </p>
    </div>
  )
}

function Chip({
  href,
  ativo,
  children,
  cor,
  suave,
  borda,
}: {
  href: string
  ativo: boolean
  children: React.ReactNode
  cor?: string
  suave?: string
  borda?: string
}) {
  return (
    <Link
      href={href}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
        ativo
          ? cor
            ? ""
            : "border-transparent bg-blurple text-white"
          : "border-white/10 bg-white/[0.04] text-fog hover:border-white/25 hover:text-white"
      )}
      style={ativo && cor ? { background: suave, color: cor, borderColor: borda } : undefined}
    >
      {children}
    </Link>
  )
}
