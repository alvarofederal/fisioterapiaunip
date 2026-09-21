import Link from "next/link"
import { ClipboardList, BookOpen, CalendarClock } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { CardTrabalho } from "./_components/card-trabalho"

export const metadata = { title: "Início" }

export default async function MuralDaTurma() {
  const sessao = await auth()
  const ehAdmin = sessao?.user.role === "ADMIN"

  const [trabalhos, totalMaterias] = await Promise.all([
    prisma.trabalho.findMany({
      where: { publicado: true },
      include: { materia: true, _count: { select: { anexos: true } } },
      orderBy: [{ criadoEm: "desc" }],
      take: 30,
    }),
    prisma.materia.count({ where: { arquivada: false } }),
  ])

  const aVencer = trabalhos.filter(
    (t) => t.entregaEm && t.entregaEm.getTime() >= Date.now()
  ).length

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-[24px] font-medium tracking-[-0.01em] text-[#171717]">
          Mural da turma
        </h1>
        <p className="mt-1 text-[14px] text-[#737373]">
          Tudo o que foi publicado, do mais recente para o mais antigo.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Resumo
          icone={ClipboardList}
          rotulo="Publicações"
          valor={trabalhos.length}
          destaque
        />
        <Resumo icone={CalendarClock} rotulo="Entregas a vencer" valor={aVencer} />
        <Resumo icone={BookOpen} rotulo="Matérias ativas" valor={totalMaterias} />
      </section>

      <section className="flex flex-col gap-4">
        {trabalhos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#d4d4d4] bg-[#f5f5f5] px-6 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-[#e5e5e5] bg-white text-[#737373]">
              <ClipboardList size={22} aria-hidden />
            </span>
            <h2 className="text-[16px] font-semibold text-[#171717]">
              Nada publicado ainda
            </h2>
            <p className="max-w-[420px] text-[14px] text-[#525252]">
              {ehAdmin
                ? "Cadastre a primeira matéria e depois publique um trabalho ou evento para a turma."
                : "Assim que o administrador publicar um trabalho ou evento, ele aparece aqui."}
            </p>
            {ehAdmin && (
              <Link
                href="/painel/materias"
                className="mt-2 inline-flex h-10 items-center rounded-lg bg-black px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#262626]"
              >
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
    <article className="flex flex-col gap-1 rounded-xl border border-[#e5e5e5] bg-white p-4">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[#737373]">
        <Icone size={13} aria-hidden />
        {rotulo}
      </div>
      <p
        className={`text-[30px] font-medium leading-tight tracking-[-0.02em] tabular-nums ${
          destaque ? "text-[#2563eb]" : "text-[#171717]"
        }`}
      >
        {valor}
      </p>
    </article>
  )
}
