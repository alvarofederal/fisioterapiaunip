import { Paperclip, CalendarClock } from "lucide-react"
import type { Materia, Trabalho } from "@/generated/prisma"
import { CORES_MATERIA, ROTULO_TIPO_POST } from "@/lib/dominio"

type TrabalhoDoMural = Trabalho & {
  materia: Materia
  _count: { anexos: number }
}

/** Situação da entrega — decide o selo mostrado no card. */
function situacaoDaEntrega(entregaEm: Date | null) {
  if (!entregaEm) return null

  const umDia = 24 * 60 * 60 * 1000
  const diasRestantes = Math.ceil((entregaEm.getTime() - Date.now()) / umDia)

  if (diasRestantes < 0) return { texto: "Prazo encerrado", classe: "bg-[#f5f5f5] text-[#737373]" }
  if (diasRestantes === 0) return { texto: "Entrega hoje", classe: "bg-[#fef2f2] text-[#dc2626]" }
  if (diasRestantes === 1) return { texto: "Entrega amanhã", classe: "bg-[#fef2f2] text-[#dc2626]" }
  if (diasRestantes <= 7)
    return { texto: `Faltam ${diasRestantes} dias`, classe: "bg-[#fff7ed] text-[#ea580c]" }

  return {
    texto: entregaEm.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    classe: "bg-[#f5f5f5] text-[#525252]",
  }
}

export function CardTrabalho({ trabalho }: { trabalho: TrabalhoDoMural }) {
  const tema = CORES_MATERIA[trabalho.materia.cor]
  const entrega = situacaoDaEntrega(trabalho.entregaEm)
  const vencido = Boolean(
    trabalho.entregaEm && trabalho.entregaEm.getTime() < Date.now()
  )

  return (
    <article
      className={`acento-lateral relative overflow-hidden rounded-xl border border-[#e5e5e5] bg-white p-4 pl-5 transition-colors hover:border-[#d4d4d4] ${
        vencido ? "opacity-60" : ""
      }`}
      style={{ ["--acento" as string]: tema.base }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
              style={{
                background: tema.suave,
                color: tema.base,
                borderColor: tema.borda,
              }}
            >
              {trabalho.materia.nome}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-[#737373]">
              {ROTULO_TIPO_POST[trabalho.tipo]}
            </span>
          </div>
          <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.01em] text-[#171717]">
            {trabalho.titulo}
          </h3>
        </div>

        {entrega && (
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${entrega.classe}`}
          >
            <CalendarClock size={12} aria-hidden />
            {entrega.texto}
          </span>
        )}
      </div>

      {trabalho.descricao && (
        <p className="mt-2 line-clamp-3 whitespace-pre-line text-[14px] leading-relaxed text-[#525252]">
          {trabalho.descricao}
        </p>
      )}

      <div className="mt-3 flex items-center gap-4 border-t border-[#e5e5e5] pt-2.5 text-[12px] text-[#737373]">
        <span>
          Publicado em{" "}
          {trabalho.criadoEm.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
        {trabalho._count.anexos > 0 && (
          <span className="inline-flex items-center gap-1.5 font-medium text-[#2563eb]">
            <Paperclip size={12} aria-hidden />
            {trabalho._count.anexos}{" "}
            {trabalho._count.anexos === 1 ? "anexo" : "anexos"}
          </span>
        )}
      </div>
    </article>
  )
}
