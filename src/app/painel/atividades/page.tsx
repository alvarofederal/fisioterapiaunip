import Link from "next/link"
import { redirect } from "next/navigation"
import { ListChecks, Archive } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import {
  ORDEM_TIPOS_ATIVIDADE,
  TIPOS_ATIVIDADE,
  dataQueImporta,
  diasAte,
} from "@/lib/dominio"
import type { TipoAtividade } from "@/generated/prisma"
import { CardAtividade, type AtividadeDoMural } from "../_components/card-atividade"
import { DialogoAtividade } from "./_components/dialogo-atividade"
import { AcoesAtividade } from "./_components/acoes-atividade"

export const metadata = { title: "Atividades" }

const TIPOS_VALIDOS = new Set<string>(ORDEM_TIPOS_ATIVIDADE)

export default async function PaginaAtividades({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; arquivadas?: string }>
}) {
  const sessao = await auth()
  if (!sessao?.user?.id) redirect("/login")

  const { tipo: tipoBruto, arquivadas } = await searchParams
  const tipoFiltro = tipoBruto && TIPOS_VALIDOS.has(tipoBruto) ? (tipoBruto as TipoAtividade) : null
  const vendoArquivadas = arquivadas === "1"

  const [eu, materias, atividades, contagens, totalArquivadas] = await Promise.all([
    prisma.user.findUnique({ where: { id: sessao.user.id }, select: { role: true } }),
    prisma.materia.findMany({
      where: { arquivada: false },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.atividade.findMany({
      where: {
        arquivada: vendoArquivadas,
        ...(tipoFiltro ? { tipo: tipoFiltro } : {}),
      },
      include: {
        materia: { select: { id: true, nome: true, cor: true } },
        _count: { select: { anexos: true } },
      },
    }),
    prisma.atividade.groupBy({
      by: ["tipo"],
      where: { arquivada: false },
      _count: true,
    }),
    prisma.atividade.count({ where: { arquivada: true } }),
  ])

  const ehAdmin = eu?.role === "ADMIN"
  const totalAtivas = contagens.reduce((soma, linha) => soma + linha._count, 0)
  const contagemPorTipo = new Map(contagens.map((c) => [c.tipo, c._count]))

  const ordenadas: AtividadeDoMural[] = [...atividades].sort((a, b) => {
    const da = dataQueImporta(a)
    const db = dataQueImporta(b)
    if (!da && !db) return b.criadoEm.getTime() - a.criadoEm.getTime()
    if (!da) return 1
    if (!db) return -1
    return da.getTime() - db.getTime()
  })

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="titulo-display text-[30px] md:text-[38px]">Atividades</h1>
          <p className="mt-2 text-[15px] text-fog">
            Trabalhos extra classe, seminários, eventos e congressos da turma.
          </p>
        </div>
        {ehAdmin && <DialogoAtividade materias={materias} />}
      </header>

      {/* Filtro por tipo — cada aba explica o que é, ao passar o mouse */}
      <nav className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
        <Aba href="/painel/atividades" ativo={!tipoFiltro && !vendoArquivadas} contagem={totalAtivas}>
          Todas
        </Aba>
        {ORDEM_TIPOS_ATIVIDADE.map((codigo) => {
          const info = TIPOS_ATIVIDADE[codigo]
          const ativo = tipoFiltro === codigo && !vendoArquivadas
          return (
            <Aba
              key={codigo}
              href={`/painel/atividades?tipo=${codigo}`}
              ativo={ativo}
              contagem={contagemPorTipo.get(codigo) ?? 0}
              cor={info.cor}
              suave={info.suave}
              titulo={info.explicacao}
            >
              {info.curto}
            </Aba>
          )
        })}
        {totalArquivadas > 0 && (
          <Aba
            href="/painel/atividades?arquivadas=1"
            ativo={vendoArquivadas}
            contagem={totalArquivadas}
          >
            <Archive size={14} aria-hidden />
            Arquivadas
          </Aba>
        )}
      </nav>

      {/* O que é cada tipo, quando um filtro está ligado */}
      {tipoFiltro && !vendoArquivadas && (
        <p
          className="rounded-xl border px-4 py-3 text-[14px]"
          style={{
            background: TIPOS_ATIVIDADE[tipoFiltro].suave,
            borderColor: TIPOS_ATIVIDADE[tipoFiltro].cor + "55",
            color: TIPOS_ATIVIDADE[tipoFiltro].cor,
          }}
        >
          {TIPOS_ATIVIDADE[tipoFiltro].explicacao}
        </p>
      )}

      {ordenadas.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-blurple/15 text-hover-blurple">
            {vendoArquivadas ? <Archive size={26} aria-hidden /> : <ListChecks size={26} aria-hidden />}
          </span>
          <h2 className="titulo-display text-[22px]">
            {vendoArquivadas ? "Nada arquivado" : "Nenhuma atividade aqui"}
          </h2>
          <p className="max-w-[460px] text-[15px] leading-relaxed text-fog">
            {vendoArquivadas
              ? "Atividades arquivadas saem do mural e ficam guardadas aqui."
              : ehAdmin
                ? "Publique a primeira e ela aparece na tela inicial para a turma."
                : "Assim que o administrador publicar, aparece aqui e no mural."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {ordenadas.map((atividade) => {
            const data = dataQueImporta(atividade)
            const passou = data ? diasAte(data) < 0 : false
            return (
              <CardAtividade
                key={atividade.id}
                atividade={atividade}
                acoes={
                  ehAdmin ? (
                    <AcoesAtividade
                      materias={materias}
                      arquivada={atividade.arquivada}
                      atividade={{
                        id: atividade.id,
                        tipo: atividade.tipo,
                        titulo: atividade.titulo,
                        descricao: atividade.descricao,
                        materiaId: atividade.materiaId,
                        entregaEm: atividade.entregaEm,
                        dataInicio: atividade.dataInicio,
                        dataFim: atividade.dataFim,
                        horaInicio: atividade.horaInicio,
                        horaFim: atividade.horaFim,
                        local: atividade.local,
                        linkExterno: atividade.linkExterno,
                        cargaHoraria: atividade.cargaHoraria,
                        integrantes: atividade.integrantes,
                      }}
                    />
                  ) : undefined
                }
              />
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
  cor,
  suave,
  titulo,
}: {
  href: string
  ativo: boolean
  contagem: number
  children: React.ReactNode
  cor?: string
  suave?: string
  titulo?: string
}) {
  return (
    <Link
      href={href}
      title={titulo}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[14px] font-medium transition-colors",
        ativo
          ? cor
            ? ""
            : "bg-blurple text-white"
          : "text-fog hover:bg-white/[0.06] hover:text-white"
      )}
      style={ativo && cor ? { background: suave, color: cor } : undefined}
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
