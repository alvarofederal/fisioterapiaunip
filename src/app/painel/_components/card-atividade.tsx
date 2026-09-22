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
  FileText,
  Download,
  ChevronDown,
  CalendarPlus,
} from "lucide-react"
import type { Anexo, Atividade, Materia } from "@/generated/prisma"
import {
  CORES_MATERIA,
  TIPOS_ATIVIDADE,
  dataQueImporta,
  diasAte,
  formatarTamanho,
} from "@/lib/dominio"
import { cn } from "@/lib/utils"

export type AtividadeDoMural = Atividade & {
  materia: Pick<Materia, "id" | "nome" | "cor"> | null
  anexos: Anexo[]
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

const dataLonga = (d: Date) =>
  d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })

function Detalhe({
  icone: Icone,
  rotulo,
  children,
}: {
  icone: React.ComponentType<{ size?: number; className?: string }>
  rotulo: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icone size={15} className="mt-0.5 shrink-0 text-greyple" aria-hidden />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-greyple">
          {rotulo}
        </p>
        <p className="text-[14px] leading-snug text-white">{children}</p>
      </div>
    </div>
  )
}

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

  // Se não há nada além do cabeçalho, abrir não mostraria nada — o card fica
  // estático em vez de prometer conteúdo que não existe.
  const temDetalhes =
    Boolean(atividade.descricao) ||
    atividade.anexos.length > 0 ||
    Boolean(atividade.local) ||
    Boolean(atividade.integrantes) ||
    Boolean(atividade.linkExterno) ||
    atividade.cargaHoraria !== null ||
    Boolean(atividade.horaInicio) ||
    Boolean(atividade.dataFim) ||
    Boolean(acoes)

  const classesCartao = cn(
    "acento-lateral relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition-colors hover:border-white/20",
    (passou || atividade.arquivada) && "opacity-65"
  )

  const cabecalho = (
    <>
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
            className="inline-flex max-w-[280px] items-center truncate rounded-full border px-2.5 py-1 text-[11px] font-semibold"
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
    </>
  )

  const corpo = (
    <div className="flex flex-col gap-4 pt-4">
      {atividade.descricao && (
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-fog">
          {atividade.descricao}
        </p>
      )}

      {/* Datas e detalhes, cada tipo mostrando só o que usa */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/[0.08] bg-black/20 p-3.5 sm:grid-cols-2">
        {atividade.entregaEm && (
          <Detalhe icone={CalendarClock} rotulo="Entregar até">
            {dataLonga(atividade.entregaEm)}
          </Detalhe>
        )}

        {atividade.dataInicio && (
          <Detalhe icone={CalendarClock} rotulo={atividade.dataFim ? "Começa" : "Acontece em"}>
            {dataLonga(atividade.dataInicio)}
          </Detalhe>
        )}

        {atividade.dataFim && (
          <Detalhe icone={CalendarClock} rotulo="Termina">
            {dataLonga(atividade.dataFim)}
          </Detalhe>
        )}

        {(atividade.horaInicio || atividade.horaFim) && (
          <Detalhe icone={Clock} rotulo="Horário">
            {atividade.horaInicio}
            {atividade.horaFim ? ` às ${atividade.horaFim}` : ""}
          </Detalhe>
        )}

        {atividade.local && (
          <Detalhe icone={MapPin} rotulo="Local">
            {atividade.local}
          </Detalhe>
        )}

        {atividade.integrantes && (
          <Detalhe icone={Users} rotulo="Integrantes">
            {atividade.integrantes}
          </Detalhe>
        )}

        {atividade.cargaHoraria !== null && (
          <Detalhe icone={Award} rotulo="Carga horária">
            {atividade.cargaHoraria} horas de certificado
          </Detalhe>
        )}

        <Detalhe icone={CalendarPlus} rotulo="Publicada em">
          {dataLonga(atividade.criadoEm)}
        </Detalhe>
      </div>

      {atividade.linkExterno && (
        <Link
          href={atividade.linkExterno}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-hover-blurple/40 bg-blurple/10 px-4 py-2.5 text-[14px] font-medium text-hover-blurple transition-colors hover:bg-blurple/20"
        >
          <ExternalLink size={15} aria-hidden />
          Abrir link
        </Link>
      )}

      {/* Anexos — é o material que a turma veio buscar */}
      {atividade.anexos.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-greyple">
            <Paperclip size={12} aria-hidden />
            {atividade.anexos.length}{" "}
            {atividade.anexos.length === 1 ? "anexo" : "anexos"}
          </p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {atividade.anexos.map((anexo) => (
              <li key={anexo.id}>
                <a
                  href={anexo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={anexo.nome}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2 transition-colors hover:border-white/25 hover:bg-white/[0.06]"
                >
                  {anexo.tipo === "IMAGEM" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={anexo.url}
                      alt=""
                      className="size-10 shrink-0 rounded-lg object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-vivid-cerulean/15 text-vivid-cerulean">
                      <FileText size={18} aria-hidden />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-white">
                      {anexo.nome}
                    </span>
                    <span className="block text-[11px] text-greyple">
                      {formatarTamanho(anexo.tamanho)} · baixar
                    </span>
                  </span>
                  <Download size={15} className="shrink-0 text-greyple" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ações do ADMIN ficam no corpo, nunca no <summary>: botão dentro de
          summary rouba o clique que deveria abrir o accordion. */}
      {acoes && (
        <div className="flex flex-wrap items-center gap-1 border-t border-white/[0.08] pt-3">
          {acoes}
        </div>
      )}
    </div>
  )

  if (!temDetalhes) {
    return (
      <article
        className={cn(classesCartao, "p-5 pl-6")}
        style={{ ["--acento" as string]: tipo.cor }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">{cabecalho}</div>
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
      </article>
    )
  }

  return (
    <details
      className={cn(classesCartao, "group")}
      style={{ ["--acento" as string]: tipo.cor }}
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 p-5 pl-6 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          {cabecalho}

          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-greyple">
            <span className="inline-flex items-center gap-1 font-medium text-hover-blurple group-open:hidden">
              <ChevronDown size={13} aria-hidden />
              Ver detalhes
            </span>
            <span className="hidden items-center gap-1 font-medium text-hover-blurple group-open:inline-flex">
              <ChevronDown size={13} className="rotate-180" aria-hidden />
              Fechar
            </span>

            {atividade.anexos.length > 0 && (
              <span className="inline-flex items-center gap-1 text-vivid-cerulean">
                <Paperclip size={11} aria-hidden />
                {atividade.anexos.length}{" "}
                {atividade.anexos.length === 1 ? "anexo" : "anexos"}
              </span>
            )}

            {atividade.local && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} aria-hidden />
                {atividade.local}
              </span>
            )}

            {atividade.dataInicio && atividade.dataFim && (
              <span className="inline-flex items-center gap-1">
                <CalendarClock size={11} aria-hidden />
                {dataCurta(atividade.dataInicio)} a {dataCurta(atividade.dataFim)}
              </span>
            )}
          </p>
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
      </summary>

      <div className="border-t border-white/[0.08] px-5 pb-5 pl-6">{corpo}</div>
    </details>
  )
}
