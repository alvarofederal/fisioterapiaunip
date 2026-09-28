// src/lib/atividades.ts
import type { Modalidade, TipoAtividade } from "@/generated/prisma"
import { dataQueImporta, diasAte } from "./dominio"
import { diasAteNoBrasil } from "./datas"

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

// ─── Situação do trabalho ────────────────────────────────────────

/** "19 de dez." — o formato que o selo do trabalho sempre usou. */
const dataCurta = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })

export type TrabalhoComDatas = {
  passadaEm: Date | null
  entregaEm: Date | null
}

/**
 * Em que pé está o trabalho, do ponto de vista da turma.
 *
 * São dois momentos distintos: o professor passa numa aula, a turma junta
 * tudo, e a entrega é uma só, no fim do semestre. Cada situação diz a data
 * que importa naquele momento — a entrega enquanto se espera por ela, o dia
 * da aula enquanto o trabalho nem foi passado.
 *
 * Sem `passadaEm` o selo mostra só o prazo, como sempre mostrou. Uma versão
 * anterior dizia "Ainda não passado" nesse caso, e isso afirmava algo que o
 * sistema não sabe: a data só estava em branco.
 */
export const SITUACOES_DO_TRABALHO = {
  SERA_PASSADO: {
    texto: (t: TrabalhoComDatas) =>
      t.passadaEm ? `Será passado em ${dataCurta(t.passadaEm)}` : "Será passado em sala",
    cor: "#babcd9",
    suave: "rgba(186, 188, 217, 0.12)",
  },
  AGUARDANDO_ENTREGA: {
    texto: (t: TrabalhoComDatas) =>
      t.entregaEm
        ? `Aguardar entrega do relatório · ${dataCurta(t.entregaEm)}`
        : "Aguardar entrega do relatório",
    cor: "#fda220",
    suave: "rgba(253, 162, 32, 0.16)",
  },
  SO_PRAZO: {
    texto: (t: TrabalhoComDatas) =>
      t.entregaEm ? `Entregar até ${dataCurta(t.entregaEm)}` : "Sem prazo definido",
    cor: "#babcd9",
    suave: "rgba(186, 188, 217, 0.12)",
  },
  ENCERRADO: {
    texto: () => "Prazo de entrega encerrado",
    cor: "#99aab5",
    suave: "rgba(153, 170, 181, 0.12)",
  },
} as const

export type SituacaoDoTrabalho = keyof typeof SITUACOES_DO_TRABALHO

/**
 * A situação sai das duas datas, nesta ordem de decisão:
 *
 * entrega no passado        → encerrado, não importa quando foi passado
 * passado em sala até hoje  → aguardando a entrega
 * data de passar no futuro  → será passado
 * sem data de passar        → só o prazo, que é tudo o que se sabe
 *
 * Os dias são contados no fuso da turma: a data de encontro está gravada
 * como meia-noite UTC, e o agora em UTC já é o dia seguinte às 21h daqui.
 */
export function situacaoDoTrabalho(
  trabalho: TrabalhoComDatas,
  referencia = new Date()
): SituacaoDoTrabalho {
  if (trabalho.entregaEm && diasAteNoBrasil(trabalho.entregaEm, referencia) < 0) {
    return "ENCERRADO"
  }
  if (trabalho.passadaEm) {
    return diasAteNoBrasil(trabalho.passadaEm, referencia) <= 0
      ? "AGUARDANDO_ENTREGA"
      : "SERA_PASSADO"
  }
  return "SO_PRAZO"
}

export type SeloDoTrabalho = {
  situacao: SituacaoDoTrabalho
  texto: string
  cor: string
  suave: string
}

/**
 * O selo que o card mostra.
 *
 * Na última semana antes da entrega o prazo passa na frente de tudo, com a
 * contagem e a cor de urgência — é o que a turma precisa ver para não chegar
 * no sábado sem a folha. Fora dela, vale o texto da situação.
 *
 * Mora aqui, e não nos cards, para o painel e a vitrine pública mostrarem
 * exatamente a mesma coisa.
 */
export function seloDoTrabalho(
  trabalho: TrabalhoComDatas,
  referencia = new Date()
): SeloDoTrabalho {
  const situacao = situacaoDoTrabalho(trabalho, referencia)

  if (situacao !== "ENCERRADO" && trabalho.entregaEm) {
    const dias = diasAteNoBrasil(trabalho.entregaEm, referencia)
    const urgente = { cor: "#de2761", suave: "rgba(222, 39, 97, 0.18)" }
    const perto = { cor: "#fda220", suave: "rgba(253, 162, 32, 0.16)" }

    if (dias === 0) return { situacao, texto: "Entrega hoje", ...urgente }
    if (dias === 1) return { situacao, texto: "Entrega amanhã", ...urgente }
    if (dias <= 7) return { situacao, texto: `Faltam ${dias} dias para entregar`, ...perto }
  }

  const info = SITUACOES_DO_TRABALHO[situacao]
  return { situacao, texto: info.texto(trabalho), cor: info.cor, suave: info.suave }
}
