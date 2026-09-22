import { CalendarClock, Paperclip, Lock } from "lucide-react"
import type { CorTema, TipoAtividade } from "@/generated/prisma"
import { CORES_MATERIA, TIPOS_ATIVIDADE, diasAte } from "@/lib/dominio"
import { cn } from "@/lib/utils"

/**
 * Card da vitrine pública.
 *
 * Carrega de propósito MENOS do que o card do painel: sem descrição completa,
 * sem nome de integrante e sem link de download. Nome de colega é dado pessoal
 * de quem não escolheu aparecer na web aberta, e o material do professor não é
 * nosso para distribuir. O que fica é o bastante para a turma se situar:
 * o que é, de qual matéria e quando.
 */
export type NoticiaPublica = {
  id: string
  tipo: TipoAtividade
  titulo: string
  entregaEm: Date | null
  dataInicio: Date | null
  dataFim: Date | null
  horaInicio: string | null
  qtdAnexos: number
  materia: { nome: string; cor: CorTema } | null
}

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

const dataLonga = (d: Date) =>
  d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  })

export function CardNoticia({ noticia }: { noticia: NoticiaPublica }) {
  const tipo = TIPOS_ATIVIDADE[noticia.tipo]
  const tema = noticia.materia ? CORES_MATERIA[noticia.materia.cor] : null

  const data = noticia.entregaEm ?? noticia.dataInicio
  const ehEntrega = Boolean(noticia.entregaEm)
  const info = selo(data, ehEntrega)
  const passou = data ? diasAte(data) < 0 : false

  return (
    <article
      className={cn(
        "acento-lateral relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 pl-6 transition-colors hover:border-white/20",
        passou && "opacity-65"
      )}
      style={{ ["--acento" as string]: tipo.cor }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: tipo.suave, color: tipo.cor }}
            >
              {tipo.rotulo}
            </span>

            {noticia.materia && tema && (
              <span
                className="inline-flex max-w-[280px] items-center truncate rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: tema.suave, color: tema.base, borderColor: tema.borda }}
              >
                {noticia.materia.nome}
              </span>
            )}
          </div>

          <h3 className="titulo-display text-[19px] leading-tight">{noticia.titulo}</h3>

          {data && (
            <p className="mt-2 text-[14px] text-fog">
              {ehEntrega ? "Entregar até " : ""}
              {dataLonga(data)}
              {noticia.dataFim ? ` a ${dataLonga(noticia.dataFim)}` : ""}
              {noticia.horaInicio ? ` · ${noticia.horaInicio}` : ""}
            </p>
          )}
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

      {noticia.qtdAnexos > 0 && (
        <p className="mt-3 inline-flex items-center gap-1.5 border-t border-white/[0.08] pt-3 text-[12px] text-greyple">
          <Paperclip size={12} aria-hidden />
          {noticia.qtdAnexos} {noticia.qtdAnexos === 1 ? "anexo" : "anexos"}
          <span className="mx-1">·</span>
          <Lock size={11} aria-hidden />
          entre para baixar
        </p>
      )}
    </article>
  )
}
