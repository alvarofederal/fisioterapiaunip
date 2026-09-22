import { describe, it, expect } from "vitest"
import {
  separarAtividades,
  ordenarAtividades,
  jaPassou,
  dataDeEncerramento,
  usaCarimbo,
  marcosCumpridos,
  MARCOS_DO_TRABALHO,
  TRABALHO_SEM_MARCO,
} from "@/lib/atividades"
import { dataDeEncontro } from "@/lib/datas"

const HOJE = new Date("2026-09-22T09:00:00")

type Item = {
  titulo: string
  entregaEm: Date | null
  dataInicio: Date | null
  dataFim: Date | null
  criadoEm: Date
}

/** Trabalho com prazo de entrega — o caso mais comum do mural. */
function entrega(titulo: string, iso: string, criadoEm = "2026-08-01"): Item {
  return {
    titulo,
    entregaEm: dataDeEncontro(iso),
    dataInicio: null,
    dataFim: null,
    criadoEm: dataDeEncontro(criadoEm),
  }
}

/** Evento ou congresso, que ocupa um intervalo de dias. */
function evento(titulo: string, inicio: string, fim: string): Item {
  return {
    titulo,
    entregaEm: null,
    dataInicio: dataDeEncontro(inicio),
    dataFim: dataDeEncontro(fim),
    criadoEm: dataDeEncontro("2026-08-01"),
  }
}

/** Aviso publicado sem data marcada. */
function semData(titulo: string, criadoEm: string): Item {
  return {
    titulo,
    entregaEm: null,
    dataInicio: null,
    dataFim: null,
    criadoEm: dataDeEncontro(criadoEm),
  }
}

const titulos = (itens: Item[]) => itens.map((i) => i.titulo)

describe("separarAtividades — o que passou desce", () => {
  it("o próximo a vencer abre a lista, o vencido não", () => {
    // O bug relatado: a lista ordenava só por data crescente, então a entrega
    // de 19/09, já vencida, aparecia acima da de 03/10, que é a que importa.
    const { aFazer, jaPassaram } = separarAtividades(
      [entrega("Cardiovascular", "2026-09-19"), entrega("Respiratório", "2026-10-03")],
      HOJE
    )

    expect(titulos(aFazer)).toEqual(["Respiratório"])
    expect(titulos(jaPassaram)).toEqual(["Cardiovascular"])
  })

  it("ordena o que falta do mais próximo para o mais distante", () => {
    const { aFazer } = separarAtividades(
      [
        entrega("Checklist", "2026-12-19"),
        entrega("Respiratório", "2026-10-03"),
        entrega("Seminário", "2026-11-07"),
      ],
      HOJE
    )

    expect(titulos(aFazer)).toEqual(["Respiratório", "Seminário", "Checklist"])
  })

  it("ordena o que passou do mais recente para o mais antigo", () => {
    // Quem procura o que venceu procura o último, não o do começo do semestre.
    const { jaPassaram } = separarAtividades(
      [
        entrega("Antiga", "2026-08-10"),
        entrega("Recente", "2026-09-19"),
        entrega("Do meio", "2026-09-05"),
      ],
      HOJE
    )

    expect(titulos(jaPassaram)).toEqual(["Recente", "Do meio", "Antiga"])
  })

  it("entrega de hoje ainda é a fazer", () => {
    const { aFazer, jaPassaram } = separarAtividades([entrega("Hoje", "2026-09-22")], HOJE)

    expect(titulos(aFazer)).toEqual(["Hoje"])
    expect(jaPassaram).toHaveLength(0)
  })
})

describe("separarAtividades — atividade sem data", () => {
  it("não some da lista", () => {
    // Antes as telas filtravam por `data !== null` nos dois lados: o aviso sem
    // data entrava na contagem do mural e não era renderizado em lugar nenhum.
    const itens = [entrega("Com prazo", "2026-10-03"), semData("Aviso", "2026-09-01")]
    const { aFazer, jaPassaram } = separarAtividades(itens, HOJE)

    expect(aFazer.length + jaPassaram.length).toBe(itens.length)
  })

  it("fica em a fazer, no fim do bloco", () => {
    const { aFazer } = separarAtividades(
      [semData("Aviso", "2026-09-01"), entrega("Com prazo", "2026-10-03")],
      HOJE
    )

    expect(titulos(aFazer)).toEqual(["Com prazo", "Aviso"])
  })

  it("entre dois sem data, o publicado por último vem primeiro", () => {
    const { aFazer } = separarAtividades(
      [semData("Velho", "2026-08-01"), semData("Novo", "2026-09-10")],
      HOJE
    )

    expect(titulos(aFazer)).toEqual(["Novo", "Velho"])
  })
})

describe("evento com intervalo de dias", () => {
  it("continua a fazer enquanto está acontecendo", () => {
    // Congresso de 20 a 25: no dia 22 ele está rolando. Ordenar e vencer pela
    // mesma data mandaria para o rodapé um evento em andamento.
    const { aFazer, jaPassaram } = separarAtividades(
      [evento("Congresso", "2026-09-20", "2026-09-25")],
      HOJE
    )

    expect(titulos(aFazer)).toEqual(["Congresso"])
    expect(jaPassaram).toHaveLength(0)
  })

  it("passa quando o último dia fica para trás", () => {
    const { jaPassaram } = separarAtividades(
      [evento("Congresso", "2026-09-10", "2026-09-15")],
      HOJE
    )

    expect(titulos(jaPassaram)).toEqual(["Congresso"])
  })

  it("encerra pela data de fim, mas se ordena pelo começo", () => {
    const congresso = evento("Congresso", "2026-09-20", "2026-09-25")

    expect(dataDeEncerramento(congresso)).toEqual(dataDeEncontro("2026-09-25"))
    expect(jaPassou(congresso, HOJE)).toBe(false)
  })
})

describe("ordenarAtividades", () => {
  it("devolve uma lista só, com o que passou no rodapé", () => {
    const lista = ordenarAtividades(
      [
        entrega("Cardiovascular", "2026-09-19"),
        semData("Aviso", "2026-09-01"),
        entrega("Respiratório", "2026-10-03"),
      ],
      HOJE
    )

    expect(titulos(lista)).toEqual(["Respiratório", "Aviso", "Cardiovascular"])
  })

  it("lista vazia não quebra", () => {
    expect(ordenarAtividades([], HOJE)).toEqual([])
  })
})

describe("marcos do trabalho presencial", () => {
  const presencial = { modalidade: "PRESENCIAL" as const }
  const ead = { modalidade: "EAD" as const }

  it("trabalho de matéria presencial tem carimbo e correção", () => {
    expect(usaCarimbo({ tipo: "TRABALHO_EXTRA_CLASSE", materia: presencial })).toBe(true)
  })

  it("trabalho de matéria EaD não tem — não existe folha para carimbar", () => {
    expect(usaCarimbo({ tipo: "TRABALHO_EXTRA_CLASSE", materia: ead })).toBe(false)
  })

  it("evento e congresso não têm, mesmo sendo presenciais", () => {
    expect(usaCarimbo({ tipo: "EVENTO", materia: presencial })).toBe(false)
    expect(usaCarimbo({ tipo: "CONGRESSO", materia: presencial })).toBe(false)
    expect(usaCarimbo({ tipo: "SEMINARIO", materia: presencial })).toBe(false)
  })

  it("trabalho sem matéria não quebra", () => {
    expect(usaCarimbo({ tipo: "TRABALHO_EXTRA_CLASSE", materia: null })).toBe(false)
  })

  it("conta os marcos cumpridos", () => {
    expect(marcosCumpridos(TRABALHO_SEM_MARCO)).toBe(0)
    expect(marcosCumpridos({ carimbado: true, corrigido: false })).toBe(1)
    expect(marcosCumpridos({ carimbado: true, corrigido: true })).toBe(2)
  })

  it("a ordem é a da vida real: carimbo antes de correção", () => {
    expect(MARCOS_DO_TRABALHO.map((m) => m.campo)).toEqual(["carimbado", "corrigido"])
  })
})
