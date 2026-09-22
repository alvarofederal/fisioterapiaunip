import Link from "next/link"
import {
  Paperclip,
  CalendarClock,
  MapPin,
  Users,
  Clock,
  Award,
  ExternalLink,
  Archive,
} from "lucide-react"
import type { Atividade, Materia } from "@/generated/prisma"
import { CORES_MATERIA, TIPOS_ATIVIDADE, dataQueImporta, diasAte } from "@/lib/dominio"
import { cn } from "@/lib/utils"

export type AtividadeDoMural = Atividade & {
  materia: Pick<Materia, "id" | "nome" | "cor"> | null
  _count: { anexos: number }
}

/** Selo de prazo: muda de cor conforme a urgência. */
function selo(data: Date | null, ehEntrega: boolean) {
  if (!data) return null
  const dias = diasAte(data)

  if (dias < 0)
    return { texto: ehEntrega ? "Prazo encerrado" : "Já aconteceu", cor: "#99aab5", fundo: "rgba(153,170,181,0.12)" }
  if (dias === 0)
    return { texto: ehEntrega ? "Entrega hoje" : "É hoje", cor: "#de2761", fundo: "rgba(222,39,97,0.18)" }
  if (dias === 1)
    return { texto: ehEntrega ? "Entrega amanhã" : "É amanhã", cor: "#de2761", fundo: "rgba(222,39,97,0.18)" }
  if (dias <= 7)
    return { texto: `Faltam ${dias} dias`, cor: "#fda220", fundo: "rgba(253,162,32,0.16)" }

  return {
    texto: data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }),
    cor: "#babcd9",
    fundo: "rgba(186,188,217,0.12)",
  }
}

const dataCurta = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })

export function CardAtividade({
  atividade,
  acoes,
}: {
  atividade: AtividadeDoMural
  acoes?: React.ReactNode
}) {
  const tipo = TIPOS_ATIVIDADE[atividade.tipo]
  const temaMateria = atividade.materia ? CORES_MATERIA[atividade.materia.cor] : null

  const data = dataQueImporta(atividade)
  const ehEntrega = Boolean(atividade.entregaEm)
  const info = selo(data, ehEntrega)
  const passou = data ? diasAte(data) < 0 : false

  return (
    <article
      className={cn(
        "acento-lateral relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 pl-6 transition-colors hover:border-white/20",
        (passou || atividade.arquivada) && "opacity-65"
      )}
      style={{ ["--acento" as string]: tipo.cor }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {/* O tipo vem primeiro: é o que diz o que a pessoa tem que fazer */}
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: tipo.suave, color: tipo.cor }}
            >
              {tipo.rotulo}
            </span>

            {atividade.materia && temaMateria && (
              <span
                className="inline-flex max-w-[240px] items-center truncate rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  background: temaMateria.suave,
                  color: temaMateria.base,
                  borderColor: temaMateria.borda,
                }}
              >
                {atividade.materia.nome}
              </span>
            )}

            {atividade.arquivada && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-greyple">
                <Archive size={11} aria-hidden />
                Arquivada
              </span>
            )}
          </div>

          <h3 className="titulo-display text-[19px] leading-tight">{atividade.titulo}</h3>
        </div>

        {info && (
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
            style={{ background: info.fundo, color: info.cor }}
          >
            <CalendarClock size={13} aria-hidden />
            {info.texto}
          </span>
        )}
      </div>

      {atividade.descricao && (
        <p className="mt-3 line-clamp-3 whitespace-pre-line text-[15px] leading-relaxed text-fog">
          {atividade.descricao}
        </p>
      )}

      {/* Só aparece o que o tipo realmente usa */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-fog">
        {atividade.dataInicio && atividade.dataFim && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock size={13} className="text-greyple" aria-hidden />
            {dataCurta(atividade.dataInicio)} a {dataCurta(atividade.dataFim)}
          </span>
        )}

        {(atividade.horaInicio || atividade.horaFim) && (
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} className="text-greyple" aria-hidden />
            {atividade.horaInicio}
            {atividade.horaFim ? ` às ${atividade.horaFim}` : ""}
          </span>
        )}

        {atividade.local && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} className="text-greyple" aria-hidden />
            {atividade.local}
          </span>
        )}

        {atividade.cargaHoraria !== null && (
          <span className="inline-flex items-center gap-1.5">
            <Award size={13} className="text-greyple" aria-hidden />
            {atividade.cargaHoraria}h de certificado
          </span>
        )}

        {atividade.integrantes && (
          <span className="inline-flex items-center gap-1.5">
            <Users size={13} className="text-greyple" aria-hidden />
            {atividade.integrantes}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/[0.08] pt-3 text-[12px] text-greyple">
        {atividade.linkExterno && (
          <Link
            href={atividade.linkExterno}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-hover-blurple hover:underline"
          >
            <ExternalLink size={12} aria-hidden />
            Abrir link
          </Link>
        )}

        {atividade._count.anexos > 0 && (
          <span className="inline-flex items-center gap-1.5 font-medium text-vivid-cerulean">
            <Paperclip size={12} aria-hidden />
            {atividade._count.anexos} {atividade._count.anexos === 1 ? "anexo" : "anexos"}
          </span>
        )}

        <span>
          Publicada em{" "}
          {atividade.criadoEm.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>

        {acoes && <span className="ml-auto flex items-center gap-1">{acoes}</span>}
      </div>
    </article>
  )
}
