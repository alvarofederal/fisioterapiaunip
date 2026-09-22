// src/lib/unidades.ts
import type { StatusEstudo } from "@/generated/prisma"

/**
 * A unidade do AVA e o que cada aluno cumpriu dentro dela.
 *
 * Regras puras, sem Prisma e sem DOM: a tela só desenha o que sai daqui, e o
 * teste cobre a contagem sem precisar de banco.
 */

/**
 * Os quatro itens que toda unidade do AVA tem.
 *
 * A tela nunca escreve "livroLido" na mão — percorre esta lista. Acrescentar
 * um quinto item é acrescentar uma linha aqui e uma coluna na tabela, nunca
 * um `if` novo espalhado pelas telas.
 */
export const ITENS_DA_UNIDADE = [
  { campo: "livroLido", rotulo: "Livro-texto", ajuda: "Leitura do capítulo da unidade" },
  { campo: "slidesVistos", rotulo: "Slides", ajuda: "Material de acompanhamento" },
  { campo: "atividadeFeita", rotulo: "Atividade Teleaula", ajuda: "Exercício obrigatório" },
  { campo: "questionarioFeito", rotulo: "Questionário", ajuda: "Exercício obrigatório" },
] as const

export type CampoDaUnidade = (typeof ITENS_DA_UNIDADE)[number]["campo"]

/** O que fica marcado por unidade, para cada aluno. */
export type ProgressoDaUnidade = Record<CampoDaUnidade, boolean>

export const PROGRESSO_VAZIO: ProgressoDaUnidade = {
  livroLido: false,
  slidesVistos: false,
  atividadeFeita: false,
  questionarioFeito: false,
}

export type TeleaulaComEstudo = {
  id: string
  numero: number
  titulo: string | null
  status: StatusEstudo
  anotacoes: string | null
}

export type UnidadeComProgresso = {
  id: string
  numero: number
  titulo: string | null
  progresso: ProgressoDaUnidade
  teleaulas: TeleaulaComEstudo[]
}

/** Numeral romano para o rótulo: Unidade I, II, III. Vai até XX e chega. */
export function romano(numero: number): string {
  if (!Number.isInteger(numero) || numero < 1 || numero > 20) return String(numero)
  const simbolos: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ]
  let resto = numero
  let texto = ""
  for (const [valor, simbolo] of simbolos) {
    while (resto >= valor) {
      texto += simbolo
      resto -= valor
    }
  }
  return texto
}

/** "Unidade III" ou "Unidade III · Sistema Nervoso" quando há título. */
export function rotuloUnidade(unidade: { numero: number; titulo: string | null }): string {
  const base = `Unidade ${romano(unidade.numero)}`
  return unidade.titulo ? `${base} · ${unidade.titulo}` : base
}


/**
 * Se sobrou conteúdo de verdade depois de tirar as tags.
 *
 * O editor devolve "<p>&nbsp;</p>" para um campo esvaziado; sem esta checagem
 * o portal acharia que existe resumo e a folha de revisão ganharia uma seção
 * com título e nada embaixo. Uma imagem sozinha conta como conteúdo — resumo
 * pode ser só o diagrama do slide.
 *
 * Mora aqui, e não em sanitizar.ts, porque é regex pura: lá dentro está o
 * DOMPurify, que arrastaria o jsdom para o bundle do navegador.
 */
export function htmlTemConteudo(html: string | null | undefined): boolean {
  if (!html) return false
  const semTags = html
    .replace(/<img\b[^>]*>/gi, "IMAGEM")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim()
  return semTags.length > 0
}

export type Contagem = { feitos: number; total: number; percentual: number }

function contar(feitos: number, total: number): Contagem {
  return { feitos, total, percentual: total === 0 ? 0 : Math.round((feitos / total) * 100) }
}

/**
 * Quanto desta unidade já foi cumprido.
 *
 * Os quatro itens e as teleaulas contam junto, porque é isso que o aluno
 * enxerga como "terminei a unidade" — assistir as quatro aulas e não fazer o
 * questionário não é unidade concluída. Teleaula conta como feita a partir de
 * ESTUDANDO: quem começou já tirou do zero, e a barra parar em 0% até a
 * revisão desanima em vez de informar.
 */
export function progressoDaUnidade(unidade: UnidadeComProgresso): Contagem {
  const itensFeitos = ITENS_DA_UNIDADE.filter(({ campo }) => unidade.progresso[campo]).length
  const aulasFeitas = unidade.teleaulas.filter((t) => t.status !== "A_ESTUDAR").length

  return contar(
    itensFeitos + aulasFeitas,
    ITENS_DA_UNIDADE.length + unidade.teleaulas.length
  )
}

/** O mesmo, somado em todas as unidades da matéria. */
export function progressoDaMateria(unidades: UnidadeComProgresso[]): Contagem {
  let feitos = 0
  let total = 0
  for (const unidade of unidades) {
    const parcial = progressoDaUnidade(unidade)
    feitos += parcial.feitos
    total += parcial.total
  }
  return contar(feitos, total)
}

/** Unidade sem nenhuma marcação e sem nenhuma teleaula tocada. */
export function unidadeIntocada(unidade: UnidadeComProgresso): boolean {
  return progressoDaUnidade(unidade).feitos === 0
}

/**
 * As anotações que vão para o PDF de revisão, na ordem de estudo.
 *
 * Teleaula sem resumo fica de fora: página de revisão com título e nada
 * embaixo só faz o aluno rolar à toa.
 */
export function anotacoesParaRevisao(unidades: UnidadeComProgresso[]): {
  unidade: string
  teleaula: string
  texto: string
}[] {
  const linhas: { unidade: string; teleaula: string; texto: string }[] = []

  for (const unidade of [...unidades].sort((a, b) => a.numero - b.numero)) {
    for (const teleaula of [...unidade.teleaulas].sort((a, b) => a.numero - b.numero)) {
      const texto = teleaula.anotacoes?.trim()
      if (!texto || !htmlTemConteudo(texto)) continue

      linhas.push({
        unidade: rotuloUnidade(unidade),
        teleaula: teleaula.titulo
          ? `Aula ${teleaula.numero} · ${teleaula.titulo}`
          : `Aula ${teleaula.numero}`,
        texto,
      })
    }
  }

  return linhas
}
