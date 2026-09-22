import { describe, it, expect } from "vitest"
import {
  romano,
  rotuloUnidade,
  progressoDaUnidade,
  progressoDaMateria,
  unidadeIntocada,
  anotacoesParaRevisao,
  ITENS_DA_UNIDADE,
  PROGRESSO_VAZIO,
  type UnidadeComProgresso,
  type TeleaulaComEstudo,
} from "@/lib/unidades"
import type { StatusEstudo } from "@/generated/prisma"

function teleaula(
  numero: number,
  status: StatusEstudo = "A_ESTUDAR",
  anotacoes: string | null = null,
  titulo: string | null = null
): TeleaulaComEstudo {
  return { id: "t" + numero, numero, titulo, status, anotacoes }
}

function unidade(
  numero: number,
  opcoes: {
    marcados?: Partial<typeof PROGRESSO_VAZIO>
    teleaulas?: TeleaulaComEstudo[]
    titulo?: string | null
    ehPropria?: boolean
  } = {}
): UnidadeComProgresso {
  return {
    id: "u" + numero,
    numero,
    titulo: opcoes.titulo ?? null,
    ehPropria: opcoes.ehPropria ?? false,
    progresso: { ...PROGRESSO_VAZIO, ...opcoes.marcados },
    teleaulas: opcoes.teleaulas ?? [],
  }
}

describe("romano", () => {
  it("cobre os números de unidade que aparecem de verdade", () => {
    expect([1, 2, 3, 4, 5].map(romano)).toEqual(["I", "II", "III", "IV", "V"])
  })

  it("vai até XX", () => {
    expect(romano(9)).toBe("IX")
    expect(romano(14)).toBe("XIV")
    expect(romano(20)).toBe("XX")
  })

  it("devolve o próprio número quando sai da faixa, em vez de quebrar", () => {
    expect(romano(0)).toBe("0")
    expect(romano(21)).toBe("21")
    expect(romano(1.5)).toBe("1.5")
  })
})

describe("rotuloUnidade", () => {
  it("usa só o número quando não há título", () => {
    expect(rotuloUnidade({ numero: 3, titulo: null })).toBe("Unidade III")
  })

  it("junta o título quando existe", () => {
    expect(rotuloUnidade({ numero: 1, titulo: "Bioquímica celular" })).toBe(
      "Unidade I · Bioquímica celular"
    )
  })
})

describe("progressoDaUnidade", () => {
  it("unidade zerada é 0%", () => {
    const u = unidade(1, { teleaulas: [teleaula(1), teleaula(2)] })
    expect(progressoDaUnidade(u)).toEqual({ feitos: 0, total: 6, percentual: 0 })
  })

  it("conta os quatro itens junto com as teleaulas", () => {
    // O aluno só considera a unidade pronta quando assistiu as aulas E fez os
    // exercícios — por isso as duas coisas entram na mesma conta.
    const u = unidade(1, {
      marcados: { livroLido: true, slidesVistos: true },
      teleaulas: [teleaula(1, "REVISADO"), teleaula(2)],
    })
    expect(progressoDaUnidade(u)).toEqual({ feitos: 3, total: 6, percentual: 50 })
  })

  it("teleaula em ESTUDANDO já conta", () => {
    // Barra parada em 0% depois de o aluno ter começado desanima em vez de
    // informar.
    const u = unidade(1, { teleaulas: [teleaula(1, "ESTUDANDO")] })
    expect(progressoDaUnidade(u).feitos).toBe(1)
  })

  it("chega a 100% com tudo marcado", () => {
    const u = unidade(1, {
      marcados: {
        livroLido: true,
        slidesVistos: true,
        atividadeFeita: true,
        questionarioFeito: true,
      },
      teleaulas: [teleaula(1, "REVISADO"), teleaula(2, "REVISADO")],
    })
    expect(progressoDaUnidade(u).percentual).toBe(100)
  })

  it("unidade sem teleaula ainda conta os quatro itens", () => {
    const u = unidade(1, { marcados: { livroLido: true } })
    expect(progressoDaUnidade(u)).toEqual({
      feitos: 1,
      total: ITENS_DA_UNIDADE.length,
      percentual: 25,
    })
  })
})

describe("progressoDaMateria", () => {
  it("soma as unidades", () => {
    const a = unidade(1, {
      marcados: { livroLido: true, slidesVistos: true },
      teleaulas: [teleaula(1, "REVISADO"), teleaula(2, "REVISADO")],
    })
    const b = unidade(2, { teleaulas: [teleaula(1), teleaula(2)] })

    expect(progressoDaMateria([a, b])).toEqual({ feitos: 4, total: 12, percentual: 33 })
  })

  it("matéria sem unidade nenhuma é 0%, não divisão por zero", () => {
    expect(progressoDaMateria([])).toEqual({ feitos: 0, total: 0, percentual: 0 })
  })
})

describe("unidadeIntocada", () => {
  it("reconhece a unidade em que nada foi feito", () => {
    expect(unidadeIntocada(unidade(1, { teleaulas: [teleaula(1)] }))).toBe(true)
  })

  it("uma marcação só já tira do intocado", () => {
    expect(unidadeIntocada(unidade(1, { marcados: { questionarioFeito: true } }))).toBe(false)
  })
})

describe("anotacoesParaRevisao", () => {
  it("devolve os resumos na ordem de estudo, mesmo se vierem embaralhados", () => {
    const linhas = anotacoesParaRevisao([
      unidade(2, { teleaulas: [teleaula(1, "REVISADO", "Resumo U2A1")] }),
      unidade(1, {
        teleaulas: [
          teleaula(2, "REVISADO", "Resumo U1A2"),
          teleaula(1, "REVISADO", "Resumo U1A1"),
        ],
      }),
    ])

    expect(linhas.map((l) => l.texto)).toEqual(["Resumo U1A1", "Resumo U1A2", "Resumo U2A1"])
  })

  it("pula teleaula sem resumo", () => {
    // Página de revisão com título e nada embaixo só faz rolar à toa.
    const linhas = anotacoesParaRevisao([
      unidade(1, {
        teleaulas: [
          teleaula(1, "REVISADO", "Tem resumo"),
          teleaula(2, "REVISADO", null),
          teleaula(3, "REVISADO", "   "),
        ],
      }),
    ])

    expect(linhas).toHaveLength(1)
    expect(linhas[0].texto).toBe("Tem resumo")
  })

  it("identifica de onde veio cada resumo", () => {
    const linhas = anotacoesParaRevisao([
      unidade(1, {
        titulo: "Bioquímica celular",
        teleaulas: [teleaula(2, "REVISADO", "Meu resumo", "Enzimas")],
      }),
    ])

    expect(linhas[0].unidade).toBe("Unidade I · Bioquímica celular")
    expect(linhas[0].teleaula).toBe("Aula 2 · Enzimas")
  })

  it("matéria sem nenhum resumo devolve lista vazia", () => {
    expect(anotacoesParaRevisao([unidade(1, { teleaulas: [teleaula(1)] })])).toEqual([])
  })
})
