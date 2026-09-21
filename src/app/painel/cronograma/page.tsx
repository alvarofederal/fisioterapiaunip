import Link from "next/link"
import { redirect } from "next/navigation"
import { CalendarDays, CircleAlert, CheckCircle2, Clock } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { diasAte, formatarMes, textoDeProximidade } from "@/lib/dominio"
import { CardAula, type AulaDoCronograma } from "./_components/card-aula"
import { DialogoAula } from "./_components/dialogo-aula"

export const metadata = { title: "Cronograma" }

type Filtro = "proximos" | "todos" | "pendentes"

export default async function PaginaCronograma({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>
}) {
  const sessao = await auth()
  if (!sessao?.user?.id) redirect("/login")

  const { filtro: filtroBruto } = await searchParams
  const filtro: Filtro =
    filtroBruto === "todos" ? "todos" : filtroBruto === "pendentes" ? "pendentes" : "proximos"

  const [eu, materias, aulas] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessao.user.id },
      select: { role: true },
    }),
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

  const hoje = todas.filter((a) => diasAte(a.data) === 0)
  const futuras = todas.filter((a) => diasAte(a.data) > 0)
  const atrasadas = todas.filter(
    (a) => diasAte(a.data) < 0 && (a.meuEstudo?.status ?? "A_ESTUDAR") === "A_ESTUDAR"
  )
  const revisadas = todas.filter((a) => a.meuEstudo?.status === "REVISADO")
  const proxima = [...hoje, ...futuras][0] ?? null

  const listadas =
    filtro === "todos"
      ? todas
      : filtro === "pendentes"
        ? todas.filter((a) => (a.meuEstudo?.status ?? "A_ESTUDAR") !== "REVISADO")
        : [...hoje, ...futuras]

  // Agrupa por mês para o cronograma não virar uma parede de cards.
  const porMes = new Map<string, AulaDoCronograma[]>()
  for (const aula of listadas) {
    const chave = formatarMes(aula.data)
    const grupo = porMes.get(chave) ?? []
    grupo.push(aula)
    porMes.set(chave, grupo)
  }

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="titulo-display text-[30px] md:text-[38px]">Cronograma</h1>
          <p className="mt-2 text-[15px] text-fog">
            Os encontros do semestre e o seu andamento em cada um.
          </p>
        </div>
        {ehAdmin && materias.length > 0 && <DialogoAula materias={materias} />}
      </header>

      {/* O que cobra atenção agora */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-greyple">
            <Clock size={13} aria-hidden />
            Próximo encontro
          </div>
          {proxima ? (
            <>
              <p className="titulo-display text-[22px] leading-tight text-hover-blurple">
                {proxima.data.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  timeZone: "UTC",
                })}
              </p>
              <p className="mt-1 line-clamp-1 text-[13px] text-fog">{proxima.materia.nome}</p>
              <p className="text-[12px] text-greyple">{textoDeProximidade(diasAte(proxima.data))}</p>
            </>
          ) : (
            <p className="titulo-display text-[22px] text-greyple">—</p>
          )}
        </article>

        <article
          className={cn(
            "rounded-2xl border p-5",
            atrasadas.length > 0
              ? "border-ekko-red/40 bg-ekko-red/[0.07]"
              : "border-white/10 bg-white/[0.04]"
          )}
        >
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-greyple">
            <CircleAlert size={13} aria-hidden />
            Atrasados
          </div>
          <p
            className={cn(
              "titulo-display text-[34px] tabular-nums",
              atrasadas.length > 0 && "text-ekko-red"
            )}
          >
            {atrasadas.length}
          </p>
          <p className="mt-1 text-[12px] text-greyple">
            {atrasadas.length === 0
              ? "Nada pendente para trás"
              : "Encontros que já passaram e você ainda não estudou"}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-greyple">
            <CheckCircle2 size={13} aria-hidden />
            Revisados
          </div>
          <p className="titulo-display text-[34px] tabular-nums text-spring-green">
            {revisadas.length}
            <span className="text-[18px] text-greyple">/{todas.length}</span>
          </p>
          <p className="mt-1 text-[12px] text-greyple">Prontos para a prova</p>
        </article>
      </section>

      {todas.length > 0 && (
        <nav className="flex w-fit flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
          <Aba href="/painel/cronograma" ativo={filtro === "proximos"} contagem={hoje.length + futuras.length}>
            A vir
          </Aba>
          <Aba
            href="/painel/cronograma?filtro=pendentes"
            ativo={filtro === "pendentes"}
            contagem={todas.filter((a) => (a.meuEstudo?.status ?? "A_ESTUDAR") !== "REVISADO").length}
          >
            Falta estudar
          </Aba>
          <Aba href="/painel/cronograma?filtro=todos" ativo={filtro === "todos"} contagem={todas.length}>
            Todos
          </Aba>
        </nav>
      )}

      {listadas.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-blurple/15 text-hover-blurple">
            <CalendarDays size={26} aria-hidden />
          </span>
          <h2 className="titulo-display text-[22px]">
            {todas.length === 0 ? "Cronograma vazio" : "Nada por aqui"}
          </h2>
          <p className="max-w-[460px] text-[15px] leading-relaxed text-fog">
            {todas.length === 0
              ? ehAdmin
                ? "Monte o cronograma acrescentando os encontros de cada matéria."
                : "Assim que o administrador montar o cronograma, ele aparece aqui."
              : filtro === "pendentes"
                ? "Tudo revisado. Bom trabalho."
                : "Não há encontros futuros — veja em Todos."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {[...porMes.entries()].map(([mes, doMes]) => (
            <section key={mes} className="flex flex-col gap-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-greyple">
                {mes} · {doMes.length} {doMes.length === 1 ? "encontro" : "encontros"}
              </h2>
              {doMes.map((aula) => (
                <CardAula key={aula.id} aula={aula} ehAdmin={ehAdmin} />
              ))}
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
