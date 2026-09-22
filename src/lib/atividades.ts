// src/lib/atividades.ts
import type { Modalidade, TipoAtividade } from "@/generated/prisma"
import { dataQueImporta, diasAte } from "./dominio"

/**
 * Ordem em que a turma lê o mural.
 *
 * A regra é uma só, e mora aqui: o que ainda vai acontecer fica em cima, do
 * mais próximo para o mais distante; o que já passou desce, do mais recente
 * para o mais antigo. Antes cada tela ordenava por conta própria e a de
 * Atividades ordenava só por data crescente — uma entrega vencida ontem
 * abria a lista, na frente da que vence semana que vem.
 */

export type AtividadeOrdenavel = {
  entregaEm: Date | null
  dataInicio: Date | null
  dataFim: Date | null
  criadoEm: Date
}

/**
 * A data em que a atividade deixa de ser cobrável.
 *
 * Não é a mesma que ordena. Um congresso de 20 a 25 ainda está acontecendo no
 * dia 22: ele se ordena pelo começo, mas só "passa" quando termina. Usar
 * `dataQueImporta` para as duas coisas mandaria para o rodapé um evento que
 * está rolando naquele instante.
 */
export function dataDeEncerramento(atividade: AtividadeOrdenavel): Date | null {
  return atividade.entregaEm ?? atividade.dataFim ?? atividade.dataInicio ?? null
}

/** Sem data nenhuma não passou: é aviso em aberto, não coisa vencida. */
export function jaPassou(atividade: AtividadeOrdenavel, referencia = new Date()): boolean {
  const fim = dataDeEncerramento(atividade)
  return fim !== null && diasAte(fim, referencia) < 0
}

/** O mais próximo primeiro; sem data vai para o fim, por publicação recente. */
function porProximidade(a: AtividadeOrdenavel, b: AtividadeOrdenavel): number {
  const da = dataQueImporta(a)
  const db = dataQueImporta(b)
  if (!da && !db) return b.criadoEm.getTime() - a.criadoEm.getTime()
  if (!da) return 1
  if (!db) return -1
  return da.getTime() - db.getTime()
}

/** Quem procura o que venceu procura o último, não o mais antigo do semestre. */
function doMaisRecente(a: AtividadeOrdenavel, b: AtividadeOrdenavel): number {
  const da = dataDeEncerramento(a)?.getTime() ?? 0
  const db = dataDeEncerramento(b)?.getTime() ?? 0
  return db - da
}

/**
 * Divide em dois blocos já ordenados, para a tela dar título a cada um.
 *
 * Atividade sem data cai em `aFazer`, no fim do bloco: não dá para chamar de
 * urgente, mas continua pendente. Quando as telas filtravam por
 * `data !== null` nos dois lados, ela sumia das duas listas — aparecia na
 * contagem do mural e não era renderizada em lugar nenhum.
 */
export function separarAtividades<T extends AtividadeOrdenavel>(
  itens: T[],
  referencia = new Date()
): { aFazer: T[]; jaPassaram: T[] } {
  const aFazer: T[] = []
  const jaPassaram: T[] = []

  for (const item of itens) {
    if (jaPassou(item, referencia)) jaPassaram.push(item)
    else aFazer.push(item)
  }

  aFazer.sort(porProximidade)
  jaPassaram.sort(doMaisRecente)

  return { aFazer, jaPassaram }
}

/** Uma lista só, para quem não separa em seções. */
export function ordenarAtividades<T extends AtividadeOrdenavel>(
  itens: T[],
  referencia = new Date()
): T[] {
  const { aFazer, jaPassaram } = separarAtividades(itens, referencia)
  return [...aFazer, ...jaPassaram]
}

// ─── Marcos do trabalho presencial ───────────────────────────────

/**
 * Carimbo e correção, na ordem em que acontecem.
 *
 * A tela percorre esta lista em vez de citar a coluna na mão, pelo mesmo
 * motivo de `ITENS_DA_UNIDADE`: um marco novo é uma linha aqui, não um `if`
 * espalhado.
 */
export const MARCOS_DO_TRABALHO = [
  { campo: "carimbado", rotulo: "Carimbo", ajuda: "O professor carimbou na entrega" },
  { campo: "corrigido", rotulo: "Correção", ajuda: "Voltou corrigido" },
] as const

export type MarcoDoTrabalho = (typeof MARCOS_DO_TRABALHO)[number]["campo"]

/** O que fica marcado por trabalho, para cada aluno. */
export type ProgressoDoTrabalho = Record<MarcoDoTrabalho, boolean>

export const TRABALHO_SEM_MARCO: ProgressoDoTrabalho = {
  carimbado: false,
  corrigido: false,
}

/**
 * Se este trabalho tem carimbo e correção para marcar.
 *
 * Só faz sentido em trabalho que se entrega em mão: o aluno leva a folha, o
 * professor carimba e devolve corrigida. Em matéria EaD não há folha nem
 * carimbo. A regra sai da modalidade da matéria, que já é dado — citar
 * "Anatomia" pelo nome quebraria na primeira matéria presencial nova.
 */
export function usaCarimbo(atividade: {
  tipo: TipoAtividade
  materia: { modalidade: Modalidade } | null
}): boolean {
  return (
    atividade.tipo === "TRABALHO_EXTRA_CLASSE" &&
    atividade.materia?.modalidade === "PRESENCIAL"
  )
}

/** Quantos marcos deste trabalho o aluno já cumpriu. */
export function marcosCumpridos(progresso: ProgressoDoTrabalho): number {
  return MARCOS_DO_TRABALHO.filter(({ campo }) => progresso[campo]).length
}
