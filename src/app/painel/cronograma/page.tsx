import Link from "next/link"
import { redirect } from "next/navigation"
import { CalendarDays, Target, ChevronDown } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { CORES_MATERIA, diasAte, textoDeProximidade } from "@/lib/dominio"
import { agruparCronograma } from "@/lib/cronograma"
import { CardAula, type AulaDoCronograma } from "./_components/card-aula"
import { DialogoAula } from "./_components/dialogo-aula"

export const metadata = { title: "Cronograma" }

export default async function PaginaCronograma({
  searchParams,
}: {
  searchParams: Promise<{ materia?: string }>
}) {
  const sessao = await auth()
  if (!sessao?.user?.id) redirect("/login")

  const { materia: materiaFiltro } = await searchParams

  const [eu, materias, aulas] = await Promise.all([
    prisma.user.findUnique({ where: { id: sessao.user.id }, select: { role: true } }),
    prisma.materia.findMany({
      where: { arquivada: false },
      select: { id: true, nome: true, cor: true },
      orderBy: { nome: "asc" },
    }),
    prisma.aula.findMany({
      include: {
        materia: { select: { id: true, nome: true, cor: true, professor: true } },
        estudos: {
          where: { usuarioId: sessao.user.id },
          select: { status: true, anotacoes: true },
        },
      },
      orderBy: { data: "asc" },
    }),
  ])

  const ehAdmin = eu?.role === "ADMIN"

  const todas: AulaDoCronograma[] = aulas.map((aula) => ({
    id: aula.id,
    data: aula.data,
    horaInicio: aula.horaInicio,
    horaFim: aula.horaFim,
    conteudo: aula.conteudo,
    materia: aula.materia,
    meuEstudo: aula.estudos[0] ?? null,
  }))

  const visiveis = materiaFiltro
    ? todas.filter((a) => a.materia.id === materiaFiltro)
    : todas

  // A separação em foco / atrasadas / futuras / concluídas mora em
  // src/lib/cronograma.ts, com teste. O `todas` como segundo argumento é o que
  // mantém o progresso referente ao semestre inteiro, mesmo filtrando.
  const { foco, focoEhAtraso, atrasadas, futuras, concluidas, revisadas, percentual } =
    agruparCronograma(visiveis, todas)

  const materiaAtual = materias.find((m) => m.id === materiaFiltro)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="titulo-display text-[28px] md:text-[34px]">Cronograma</h1>
          <p className="mt-1.5 text-[15px] text-fog">
            {todas.length} encontros no semestre · {revisadas} revisados
          </p>
        </div>
        {ehAdmin && materias.length > 0 && <DialogoAula materias={materias} />}
      </header>

      {/* Progresso: uma barra vale mais que "0/17" */}
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

      {/* Um foco por vez */}
      {foco && (
        <section
          className={cn(
            "rounded-2xl border p-4",
            focoEhAtraso
              ? "border-ekko-red/40 bg-ekko-red/[0.07]"
              : "border-blurple/40 bg-blurple/[0.08]"
          )}
        >
          <p
            className={cn(
              "mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]",
              focoEhAtraso ? "text-ekko-red" : "text-hover-blurple"
            )}
          >
            <Target size={13} aria-hidden />
            {focoEhAtraso ? "Comece por aqui" : "Próximo encontro"}
          </p>
          <CardAula aula={foco} ehAdmin={ehAdmin} destaque materias={materias} />
        </section>
      )}

      {/* Filtro por matéria, com a cor de cada uma */}
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

      {visiveis.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-14 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-blurple/15 text-hover-blurple">
            <CalendarDays size={26} aria-hidden />
          </span>
          <h2 className="titulo-display text-[20px]">
            {materiaAtual ? "Nada nesta matéria" : "Cronograma vazio"}
          </h2>
          <p className="max-w-[420px] text-[15px] leading-relaxed text-fog">
            {materiaAtual
              ? "Esta matéria ainda não tem encontro marcado."
              : ehAdmin
                ? "Monte o cronograma acrescentando os encontros de cada matéria."
                : "Assim que o administrador montar o cronograma, ele aparece aqui."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-7">
          <Grupo
            titulo="Estude isto"
            sublinha="Já aconteceu e você ainda não revisou"
            aulas={atrasadas}
            ehAdmin={ehAdmin}
            cor="#de2761"
            materias={materias}
          />
          <Grupo
            titulo="Vem aí"
            sublinha={
              futuras[0]
                ? `O próximo é ${textoDeProximidade(diasAte(futuras[0].data))}`
                : undefined
            }
            aulas={futuras}
            ehAdmin={ehAdmin}
            cor="#5865f2"
            materias={materias}
          />

          {/* Concluídos saem da frente, mas continuam a um clique */}
          {concluidas.length > 0 && (
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-greyple hover:text-white">
                <ChevronDown
                  size={14}
                  className="transition-transform group-open:rotate-180"
                  aria-hidden
                />
                Revisados · {concluidas.length}
              </summary>
              <div className="mt-3 flex flex-col gap-2.5">
                {concluidas.map((aula) => (
                  <CardAula key={aula.id} aula={aula} ehAdmin={ehAdmin} materias={materias} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

function Grupo({
  titulo,
  sublinha,
  aulas,
  ehAdmin,
  cor,
  materias,
}: {
  titulo: string
  sublinha?: string
  aulas: AulaDoCronograma[]
  ehAdmin: boolean
  cor: string
  materias: { id: string; nome: string }[]
}) {
  if (aulas.length === 0) return null

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-baseline gap-x-2.5">
        <h2
          className="text-[11px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: cor }}
        >
          {titulo} · {aulas.length}
        </h2>
        {sublinha && <span className="text-[12px] text-greyple">{sublinha}</span>}
      </div>
      {aulas.map((aula) => (
        <CardAula key={aula.id} aula={aula} ehAdmin={ehAdmin} materias={materias} />
      ))}
    </section>
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
