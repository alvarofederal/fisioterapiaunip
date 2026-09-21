import { Paperclip, CalendarClock, Archive } from "lucide-react"
import type { Materia, Trabalho } from "@/generated/prisma"
import { CORES_MATERIA, ROTULO_TIPO_POST } from "@/lib/dominio"
import { Badge } from "@/components/ui/badge"

type TrabalhoDoMural = Trabalho & {
  materia: Materia
  _count: { anexos: number }
}

/** Situação da entrega — decide o selo mostrado no card. */
function situacaoDaEntrega(entregaEm: Date | null) {
  if (!entregaEm) return null

  const umDia = 24 * 60 * 60 * 1000
  const dias = Math.ceil((entregaEm.getTime() - Date.now()) / umDia)

  if (dias < 0)
    return { texto: "Prazo encerrado", cor: "#99aab5", fundo: "rgba(153,170,181,0.12)" }
  if (dias === 0)
    return { texto: "Entrega hoje", cor: "#de2761", fundo: "rgba(222,39,97,0.18)" }
  if (dias === 1)
    return { texto: "Entrega amanhã", cor: "#de2761", fundo: "rgba(222,39,97,0.18)" }
  if (dias <= 7)
    return { texto: `Faltam ${dias} dias`, cor: "#fda220", fundo: "rgba(253,162,32,0.16)" }

  return {
    texto: entregaEm.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    cor: "#babcd9",
    fundo: "rgba(186,188,217,0.12)",
  }
}

export function CardTrabalho({
  trabalho,
  acoes,
}: {
  trabalho: TrabalhoDoMural
  acoes?: React.ReactNode
}) {
  const tema = CORES_MATERIA[trabalho.materia.cor]
  const entrega = situacaoDaEntrega(trabalho.entregaEm)
  const vencido = Boolean(trabalho.entregaEm && trabalho.entregaEm.getTime() < Date.now())

  return (
    <article
      className={`acento-lateral relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 pl-6 transition-colors hover:border-white/20 ${
        vencido || trabalho.arquivado ? "opacity-65" : ""
      }`}
      style={{ ["--acento" as string]: tema.base }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: tema.suave, color: tema.base, borderColor: tema.borda }}
            >
              {trabalho.materia.nome}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-greyple">
              {ROTULO_TIPO_POST[trabalho.tipo]}
            </span>
            {trabalho.arquivado && (
              <Badge variant="outline" className="gap-1 border-white/20 text-greyple">
                <Archive size={11} aria-hidden />
                Arquivado
              </Badge>
            )}
          </div>

          <h3 className="titulo-display text-[19px] leading-tight">{trabalho.titulo}</h3>
        </div>

        {entrega && (
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
            style={{ background: entrega.fundo, color: entrega.cor }}
          >
            <CalendarClock size={13} aria-hidden />
            {entrega.texto}
          </span>
        )}
      </div>

      {trabalho.descricao && (
        <p className="mt-3 line-clamp-3 whitespace-pre-line text-[15px] leading-relaxed text-fog">
          {trabalho.descricao}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/[0.08] pt-3 text-[12px] text-greyple">
        <span>
          Publicado em{" "}
          {trabalho.criadoEm.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
        {trabalho._count.anexos > 0 && (
          <span className="inline-flex items-center gap-1.5 font-medium text-vivid-cerulean">
            <Paperclip size={12} aria-hidden />
            {trabalho._count.anexos} {trabalho._count.anexos === 1 ? "anexo" : "anexos"}
          </span>
        )}
        {acoes && <span className="ml-auto flex items-center gap-1">{acoes}</span>}
      </div>
    </article>
  )
}
