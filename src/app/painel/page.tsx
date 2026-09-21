import Link from "next/link"
import { ClipboardList, BookOpen, CalendarClock } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { CardTrabalho } from "./_components/card-trabalho"

export const metadata = { title: "Início" }

export default async function MuralDaTurma() {
  const sessao = await auth()
  const ehAdmin = sessao?.user.role === "ADMIN"
  const primeiroNome = (sessao?.user.name ?? "").split(" ")[0]

  const [trabalhos, totalMaterias] = await Promise.all([
    prisma.trabalho.findMany({
      where: { arquivado: false },
      include: { materia: true, _count: { select: { anexos: true } } },
      orderBy: { criadoEm: "desc" },
      take: 40,
    }),
    prisma.materia.count({ where: { arquivada: false } }),
  ])

  const aVencer = trabalhos.filter(
    (t) => t.entregaEm && t.entregaEm.getTime() >= Date.now()
  ).length

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="titulo-display text-[30px] md:text-[38px]">
          {primeiroNome ? `E aí, ${primeiroNome}` : "Mural da turma"}
        </h1>
        <p className="mt-2 text-[15px] text-fog">
          Tudo o que a turma precisa saber, do mais recente para o mais antigo.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Resumo icone={ClipboardList} rotulo="No mural" valor={trabalhos.length} destaque />
        <Resumo icone={CalendarClock} rotulo="Entregas a vencer" valor={aVencer} />
        <Resumo icone={BookOpen} rotulo="Matérias" valor={totalMaterias} />
      </section>

      <section className="flex flex-col gap-4">
        {trabalhos.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-blurple/15 text-hover-blurple">
              <ClipboardList size={26} aria-hidden />
            </span>
            <h2 className="titulo-display text-[22px]">Mural vazio</h2>
            <p className="max-w-[460px] text-[15px] leading-relaxed text-fog">
              {ehAdmin
                ? "Cadastre a primeira matéria e publique um trabalho para a turma começar a usar."
                : "Assim que o administrador publicar um trabalho ou evento, ele aparece aqui."}
            </p>
            {ehAdmin && (
              <Link href="/painel/materias" className="btn-primario mt-1">
                Começar pelas matérias
              </Link>
            )}
          </div>
        ) : (
          trabalhos.map((trabalho) => (
            <CardTrabalho key={trabalho.id} trabalho={trabalho} />
          ))
        )}
      </section>
    </div>
  )
}

function Resumo({
  icone: Icone,
  rotulo,
  valor,
  destaque,
}: {
  icone: React.ComponentType<{ size?: number; className?: string }>
  rotulo: string
  valor: number
  destaque?: boolean
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-greyple">
        <Icone size={13} aria-hidden />
        {rotulo}
      </div>
      <p
        className={`titulo-display text-[34px] tabular-nums ${
          destaque ? "text-hover-blurple" : ""
        }`}
      >
        {valor}
      </p>
    </article>
  )
}
