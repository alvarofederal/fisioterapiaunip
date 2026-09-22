import Link from "next/link"
import { ListChecks, CalendarDays, CircleAlert } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { dataQueImporta, diasAte, textoDeProximidade } from "@/lib/dominio"
import { CardAtividade, type AtividadeDoMural } from "./_components/card-atividade"

export const metadata = { title: "Início" }

export default async function MuralDaTurma() {
  const sessao = await auth()
  const primeiroNome = (sessao?.user.name ?? "").split(" ")[0]

  const eu = sessao?.user?.id
    ? await prisma.user.findUnique({
        where: { id: sessao.user.id },
        select: { role: true },
      })
    : null
  const ehAdmin = eu?.role === "ADMIN"

  const [atividades, proximoPresencial] = await Promise.all([
    prisma.atividade.findMany({
      where: { arquivada: false },
      include: {
        materia: { select: { id: true, nome: true, cor: true } },
        _count: { select: { anexos: true } },
      },
      take: 60,
    }),
    // Encontro presencial da turma: dono nulo é o que separa do EaD de cada um.
    prisma.aula.findFirst({
      where: { modalidade: "PRESENCIAL", donoId: null, data: { gte: new Date() } },
      include: { materia: { select: { nome: true } } },
      orderBy: { data: "asc" },
    }),
  ])

  // Ordena pela data que importa (prazo ou dia do evento); sem data vai para o fim.
  const ordenadas: AtividadeDoMural[] = [...atividades].sort((a, b) => {
    const da = dataQueImporta(a)
    const db = dataQueImporta(b)
    if (!da && !db) return b.criadoEm.getTime() - a.criadoEm.getTime()
    if (!da) return 1
    if (!db) return -1
    return da.getTime() - db.getTime()
  })

  const aVencer = ordenadas.filter((a) => {
    const data = dataQueImporta(a)
    return data !== null && diasAte(data) >= 0
  })
  const vencidas = ordenadas.filter((a) => {
    const data = dataQueImporta(a)
    return data !== null && diasAte(data) < 0
  })
  const urgentes = aVencer.filter((a) => {
    const data = dataQueImporta(a)!
    return diasAte(data) <= 7
  })

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="titulo-display text-[30px] md:text-[38px]">
          {primeiroNome ? `E aí, ${primeiroNome}` : "Mural da turma"}
        </h1>
        <p className="mt-2 text-[15px] text-fog">
          Tudo o que a turma precisa fazer e acompanhar, do mais próximo para o mais distante.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-greyple">
            <CalendarDays size={13} aria-hidden />
            Próxima aula presencial
          </div>
          {proximoPresencial ? (
            <>
              <p className="titulo-display text-[22px] leading-tight text-hover-blurple">
                {proximoPresencial.data.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  timeZone: "UTC",
                })}
              </p>
              <p className="mt-1 line-clamp-1 text-[13px] text-fog">
                {proximoPresencial.materia.nome}
              </p>
              <p className="text-[12px] text-greyple">
                {textoDeProximidade(diasAte(proximoPresencial.data))}
                {proximoPresencial.horaInicio ? ` · ${proximoPresencial.horaInicio}` : ""}
              </p>
            </>
          ) : (
            <p className="titulo-display text-[22px] text-greyple">—</p>
          )}
        </article>

        <article
          className={`rounded-2xl border p-5 ${
            urgentes.length > 0
              ? "border-ember-orange/40 bg-ember-orange/[0.07]"
              : "border-white/10 bg-white/[0.04]"
          }`}
        >
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-greyple">
            <CircleAlert size={13} aria-hidden />
            Nos próximos 7 dias
          </div>
          <p
            className={`titulo-display text-[34px] tabular-nums ${
              urgentes.length > 0 ? "text-ember-orange" : ""
            }`}
          >
            {urgentes.length}
          </p>
          <p className="mt-1 text-[12px] text-greyple">
            {urgentes.length === 0 ? "Nada apertado por agora" : "Atividades com data chegando"}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-greyple">
            <ListChecks size={13} aria-hidden />
            No mural
          </div>
          <p className="titulo-display text-[34px] tabular-nums text-hover-blurple">
            {ordenadas.length}
          </p>
          <p className="mt-1 text-[12px] text-greyple">Atividades publicadas</p>
        </article>
      </section>

      {ordenadas.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-blurple/15 text-hover-blurple">
            <ListChecks size={26} aria-hidden />
          </span>
          <h2 className="titulo-display text-[22px]">Mural vazio</h2>
          <p className="max-w-[460px] text-[15px] leading-relaxed text-fog">
            {ehAdmin
              ? "Publique o primeiro trabalho, seminário, evento ou congresso para a turma se guiar."
              : "Assim que o administrador publicar alguma atividade, ela aparece aqui."}
          </p>
          {ehAdmin && (
            <Link href="/painel/atividades" className="btn-primario mt-1">
              Publicar atividade
            </Link>
          )}
        </div>
      ) : (
        <>
          {aVencer.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-greyple">
                A fazer · {aVencer.length}
              </h2>
              {aVencer.map((atividade) => (
                <CardAtividade key={atividade.id} atividade={atividade} />
              ))}
            </section>
          )}

          {vencidas.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-greyple">
                Já passou · {vencidas.length}
              </h2>
              {vencidas.map((atividade) => (
                <CardAtividade key={atividade.id} atividade={atividade} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
