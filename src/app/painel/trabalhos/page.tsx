import Link from "next/link"
import { ClipboardList, Archive } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { CardTrabalho } from "../_components/card-trabalho"

export const metadata = { title: "Trabalhos" }

export default async function PaginaTrabalhos({
  searchParams,
}: {
  searchParams: Promise<{ arquivados?: string }>
}) {
  const sessao = await auth()
  const ehAdmin = sessao?.user.role === "ADMIN"
  const { arquivados } = await searchParams
  const vendoArquivados = arquivados === "1"

  const [trabalhos, totalAtivos, totalArquivados] = await Promise.all([
    prisma.trabalho.findMany({
      where: { arquivado: vendoArquivados },
      include: { materia: true, _count: { select: { anexos: true } } },
      orderBy: vendoArquivados
        ? { arquivadoEm: "desc" }
        : [{ entregaEm: "asc" }, { criadoEm: "desc" }],
    }),
    prisma.trabalho.count({ where: { arquivado: false } }),
    prisma.trabalho.count({ where: { arquivado: true } }),
  ])

  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="titulo-display text-[30px] md:text-[38px]">Trabalhos e eventos</h1>
        <p className="mt-2 text-[15px] text-fog">
          {vendoArquivados
            ? "O que saiu do mural mas continua guardado para consulta."
            : "Tudo o que está valendo agora para a turma."}
        </p>
      </header>

      {/* Abas: ativos x arquivados */}
      <nav className="flex w-fit gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
        <Aba href="/painel/trabalhos" ativo={!vendoArquivados} contagem={totalAtivos}>
          <ClipboardList size={15} aria-hidden />
          No mural
        </Aba>
        <Aba
          href="/painel/trabalhos?arquivados=1"
          ativo={vendoArquivados}
          contagem={totalArquivados}
        >
          <Archive size={15} aria-hidden />
          Arquivados
        </Aba>
      </nav>

      {trabalhos.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-blurple/15 text-hover-blurple">
            {vendoArquivados ? <Archive size={26} aria-hidden /> : <ClipboardList size={26} aria-hidden />}
          </span>
          <h2 className="titulo-display text-[22px]">
            {vendoArquivados ? "Nada arquivado" : "Nenhum trabalho ainda"}
          </h2>
          <p className="max-w-[460px] text-[15px] leading-relaxed text-fog">
            {vendoArquivados
              ? "Quando um trabalho sair do mural, ele fica guardado aqui."
              : ehAdmin
                ? "O cadastro com anexos entra na próxima etapa do desenvolvimento."
                : "Assim que o administrador publicar, aparece aqui e no mural."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {trabalhos.map((trabalho) => (
            <CardTrabalho key={trabalho.id} trabalho={trabalho} />
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
