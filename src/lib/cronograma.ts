// src/lib/cronograma.ts
import { diasAte } from "./dominio"
import type { Modalidade, StatusEstudo } from "@/generated/prisma"

export type ItemCronograma = {
  data: Date
  modalidade: Modalidade
  meuEstudo: { status: StatusEstudo } | null
}

export type Agrupamento<T extends ItemCronograma> = {
  /** O próximo encontro, destacado no topo. */
  foco: T | null
  /** Ainda vai acontecer — presencial da turma. */
  presenciais: T[]
  /** Ainda vai acontecer — EaD, registrado pelo próprio aluno. */
  ead: T[]
  /** Já passou e foi revisado. */
  feitas: T[]
  /** Já passou sem estudo — continua acessível para refazer. */
  naoFeitas: T[]
  revisadas: number
  percentual: number
}

/**
 * Separa o cronograma pela regra combinada: data passada sai da lista
 * principal sozinha, sem depender de clique.
 *
 * O que já aconteceu vira histórico — seja porque foi estudado, seja porque
 * não foi. Deixar o passado misturado com o que vem transforma a tela numa
 * lista de cobrança que só cresce. As não estudadas continuam lá, separadas e
 * com cor própria, para quem quiser voltar e fazer.
 *
 * `todosDoSemestre` fica separado da lista porque o progresso é sempre do
 * semestre inteiro, mesmo com a tela filtrada: filtrar é para achar, não para
 * parecer que falta menos.
 */
export function agruparCronograma<T extends ItemCronograma>(
  itens: T[],
  todosDoSemestre: ItemCronograma[] = itens,
  referencia = new Date()
): Agrupamento<T> {
  const status = (i: ItemCronograma) => i.meuEstudo?.status ?? "A_ESTUDAR"
  const jaPassou = (i: ItemCronograma) => diasAte(i.data, referencia) < 0

  const futuros = itens.filter((i) => !jaPassou(i))
  const passados = itens.filter(jaPassou)

  // Presencial é da turma e EaD é de cada um — não se misturam na tela.
  const presenciais = futuros.filter((i) => i.modalidade === "PRESENCIAL")
  const ead = futuros.filter((i) => i.modalidade === "EAD")

  // Histórico do mais recente para o mais antigo: é o que ainda interessa.
  const feitas = passados.filter((i) => status(i) === "REVISADO").reverse()
  const naoFeitas = passados.filter((i) => status(i) !== "REVISADO").reverse()

  const foco = futuros[0] ?? null

  const revisadas = todosDoSemestre.filter((i) => status(i) === "REVISADO").length
  const percentual =
    todosDoSemestre.length > 0
      ? Math.round((revisadas / todosDoSemestre.length) * 100)
      : 0

  return {
    foco,
    // O foco já aparece em destaque; repetir na lista seria ruído.
    presenciais: presenciais.filter((i) => i !== foco),
    ead: ead.filter((i) => i !== foco),
    feitas,
    naoFeitas,
    revisadas,
    percentual,
  }
}
