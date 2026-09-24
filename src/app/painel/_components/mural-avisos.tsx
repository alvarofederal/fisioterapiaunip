import Link from "next/link"
import { Megaphone, ChevronRight } from "lucide-react"

export type AvisoFixo = {
  id: string
  titulo: string
  conteudo: string
}

/**
 * Os avisos fixos, no topo da tela inicial.
 *
 * Ficam acima do mural de atividades de propósito: são recados que valem o
 * semestre, e quem entra no portal precisa ler antes de olhar prazo. Como não
 * vencem, não entram na ordenação por data das atividades — seriam empurrados
 * para o rodapé no dia seguinte.
 */
export function MuralAvisos({ avisos }: { avisos: AvisoFixo[] }) {
  if (avisos.length === 0) return null

  return (
    <section aria-label="Avisos da turma" className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ember-orange">
        <Megaphone size={13} aria-hidden />
        Avisos · {avisos.length}
      </h2>

      {avisos.map((aviso) => (
        <article
          key={aviso.id}
          className="acento-lateral overflow-hidden rounded-2xl border border-ember-orange/25 bg-ember-orange/[0.06] p-5 pl-6"
          style={{ ["--acento" as string]: "#fda220" }}
        >
          <h3 className="titulo-display text-[17px] leading-tight">{aviso.titulo}</h3>

          {/* HTML limpo por allowlist na gravação (src/lib/sanitizar.ts). */}
          <div
            className="conteudo-rico mt-2 text-[14px] leading-relaxed text-fog"
            dangerouslySetInnerHTML={{ __html: aviso.conteudo }}
          />
        </article>
      ))}

      <Link
        href="/painel/avisos"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-fog transition-colors hover:text-white"
      >
        Ver todos os avisos
        <ChevronRight size={14} aria-hidden />
      </Link>
    </section>
  )
}
