import type { TipoAtividade } from "@/generated/prisma"
import { TIPOS_ATIVIDADE } from "@/lib/dominio"
import { aceitaParticipacao, textoDaListaDeParticipantes } from "@/lib/atividades"
import { ParticipacaoEvento } from "./participacao-evento"

/** O que as telas pedem ao banco para montar a participação (ver INCLUIR_PARTICIPACOES). */
type AtividadeComParticipacoes = {
  id: string
  tipo: TipoAtividade
  titulo: string
  pedeParticipacao: boolean
  arquivada: boolean
  dataInicio: Date | null
  participacoes: { usuarioId: string; usuario: { nome: string; ra: string } }[]
}

/** O `include` das participações: na ordem em que confirmaram. */
export const INCLUIR_PARTICIPACOES = {
  select: { usuarioId: true, usuario: { select: { nome: true, ra: true } } },
  orderBy: { criadoEm: "asc" as const },
}

/**
 * A participação para o card, ou nada quando o evento não pede confirmação.
 * Mural e Atividades montam igual. Nome e RA de quem vai só seguem para o
 * navegador do ADMIN.
 */
export function participacaoDoCard(
  atividade: AtividadeComParticipacoes,
  usuarioId: string | undefined,
  ehAdmin: boolean
) {
  if (!TIPOS_ATIVIDADE[atividade.tipo].campos.usaParticipacao || !atividade.pedeParticipacao) {
    return undefined
  }

  const vou = Boolean(usuarioId) && atividade.participacoes.some((p) => p.usuarioId === usuarioId)
  const total = atividade.participacoes.length
  const lista = ehAdmin
    ? atividade.participacoes.map((p) => ({ nome: p.usuario.nome, ra: p.usuario.ra }))
    : undefined

  return {
    vou,
    total,
    conteudo: (
      <ParticipacaoEvento
        atividadeId={atividade.id}
        vou={vou}
        total={total}
        aberta={aceitaParticipacao(atividade)}
        lista={lista}
        textoParaCopiar={lista ? textoDaListaDeParticipantes(atividade, lista) : undefined}
      />
    ),
  }
}
