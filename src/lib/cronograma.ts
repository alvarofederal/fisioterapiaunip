// src/lib/cronograma.ts
import { diasAte } from "./dominio"
import type { StatusEstudo } from "@/generated/prisma"

export type ItemCronograma = {
  data: Date
  meuEstudo: { status: StatusEstudo } | null
}

export type Agrupamento<T extends ItemCronograma> = {
  /** O único item que a tela destaca no topo. */
  foco: T | null
  /** Verdadeiro quando o foco é algo atrasado, e não o próximo encontro. */
  focoEhAtraso: boolean
  /** Já aconteceu e não foi revisado — sem o foco, para não repetir. */
  atrasadas: T[]
  /** Ainda vai acontecer e não foi revisado — sem o foco. */
  futuras: T[]
  /** Revisados, do mais recente para o mais antigo. */
  concluidas: T[]
  revisadas: number
  percentual: number
}

/**
 * Separa o cronograma em "o que cobra agora", "o que vem" e "o que já foi".
 *
 * Mês não é uma pergunta que alguém faz olhando o cronograma; "o que eu estudo
 * agora" é. O foco sai dos grupos para não aparecer duas vezes na tela.
 *
 * `total` é separado da lista porque o progresso é sempre do semestre inteiro,
 * mesmo quando a tela está filtrada por matéria: filtrar é para achar, não
 * para maquiar quanto falta.
 */
export function agruparCronograma<T extends ItemCronograma>(
  itens: T[],
  todosDoSemestre: ItemCronograma[] = itens,
  referencia = new Date()
): Agrupamento<T> {
  const status = (i: ItemCronograma) => i.meuEstudo?.status ?? "A_ESTUDAR"

  const atrasadas = itens
    .filter((i) => diasAte(i.data, referencia) < 0 && status(i) !== "REVISADO")
    .reverse() // a mais recente primeiro: ainda está fresca na cabeça
  const futuras = itens.filter(
    (i) => diasAte(i.data, referencia) >= 0 && status(i) !== "REVISADO"
  )
  const concluidas = itens.filter((i) => status(i) === "REVISADO").reverse()

  const focoEhAtraso = atrasadas.length > 0
  const foco = focoEhAtraso ? atrasadas[0] : (futuras[0] ?? null)

  const revisadas = todosDoSemestre.filter((i) => status(i) === "REVISADO").length
  const percentual =
    todosDoSemestre.length > 0
      ? Math.round((revisadas / todosDoSemestre.length) * 100)
      : 0

  return {
    foco,
    focoEhAtraso,
    atrasadas: focoEhAtraso ? atrasadas.slice(1) : atrasadas,
    futuras: focoEhAtraso ? futuras : futuras.slice(1),
    concluidas,
    revisadas,
    percentual,
  }
}
