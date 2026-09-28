import { CalendarDays, Clock, Mic } from "lucide-react"
import { CORES_MATERIA, textoDeProximidade } from "@/lib/dominio"
import { diasAteNoBrasil } from "@/lib/datas"
import type { ProximaAulaPublica } from "@/lib/aulas-publicas"

const diaDaSemana = (d: Date) =>
  d.toLocaleDateString("pt-BR", { weekday: "long", timeZone: "UTC" })

const diaEMes = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", timeZone: "UTC" })

/**
 * A próxima aula presencial, em destaque na página inicial.
 *
 * O bloco da data vem à esquerda e grande porque é a pergunta que a pessoa
 * traz — "quando é a próxima?". Tema e professor respondem a segunda — "do
 * que é, e com quem?".
 */
export function CardProximaAula({ aula }: { aula: ProximaAulaPublica }) {
  const tema = CORES_MATERIA[aula.materia.cor]
  // Mesma régua da consulta: hoje no fuso da turma, não o agora em UTC.
  const dias = diasAteNoBrasil(aula.data)
  const ehHoje = dias === 0

  return (
    <article
      className="acento-lateral flex flex-col gap-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 pl-6 text-left sm:flex-row sm:items-center"
      style={{ ["--acento" as string]: tema.base }}
    >
      <div
        className="flex shrink-0 flex-col items-center justify-center rounded-2xl px-5 py-3 text-center sm:min-w-[132px]"
        style={{ background: tema.suave, color: tema.base }}
      >
        <span className="text-[12px] font-semibold uppercase tracking-wide">
          {ehHoje ? "É hoje" : textoDeProximidade(dias)}
        </span>
        <span className="titulo-display mt-0.5 text-[22px] leading-tight">{diaEMes(aula.data)}</span>
        <span className="text-[12px] capitalize opacity-80">{diaDaSemana(aula.data)}</span>
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: tema.base }}
        >
          {aula.materia.nome}
        </p>

        <h3 className="titulo-display mt-1 text-[20px] leading-tight">
          {aula.tema || "Tema ainda não informado"}
        </h3>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[14px] text-fog">
          {aula.horaInicio && (
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} className="text-greyple" aria-hidden />
              {aula.horaInicio}
              {aula.horaFim && ` às ${aula.horaFim}`}
            </span>
          )}
          {aula.professor && (
            <span className="inline-flex items-center gap-1.5">
              <Mic size={14} className="text-greyple" aria-hidden />
              {aula.professor}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} className="text-greyple" aria-hidden />
            Presencial
          </span>
        </div>
      </div>
    </article>
  )
}
