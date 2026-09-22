import { describe, it, expect } from "vitest"
import {
  CONFIGURACOES,
  ORDEM_GRUPOS,
  montarConfiguracoes,
  padroes,
  ehChaveValida,
} from "@/lib/configuracoes"

describe("montarConfiguracoes", () => {
  it("tabela vazia devolve os padrões, não tudo desligado", () => {
    // O erro que isto previne: tratar "nunca foi mexido" como "desligado"
    // apagaria o menu inteiro da turma antes de o ADMIN salvar qualquer coisa.
    const mapa = montarConfiguracoes([])
    expect(mapa).toEqual(padroes())
    expect(mapa.menu_materias).toBe(true)
    expect(mapa.menu_atividades).toBe(true)
  })

  it("o que está no banco vence o padrão", () => {
    const mapa = montarConfiguracoes([{ chave: "menu_atividades", ativo: false }])
    expect(mapa.menu_atividades).toBe(false)
    // As outras seguem no padrão delas.
    expect(mapa.menu_materias).toBe(true)
  })

  it("desliga uma chave cujo padrão é ligado", () => {
    expect(padroes().noticias_publicas).toBe(true)
    const mapa = montarConfiguracoes([{ chave: "noticias_publicas", ativo: false }])
    expect(mapa.noticias_publicas).toBe(false)
  })

  it("ignora chave que saiu do vocabulário", () => {
    // Linha órfã no banco não pode virar propriedade que nenhuma tela lê.
    const mapa = montarConfiguracoes([{ chave: "menu_inexistente", ativo: true }])
    expect(mapa).toEqual(padroes())
    expect("menu_inexistente" in mapa).toBe(false)
  })

  it("devolve todas as chaves do vocabulário, sempre", () => {
    const mapa = montarConfiguracoes([{ chave: "menu_materias", ativo: false }])
    for (const opcao of CONFIGURACOES) {
      expect(typeof mapa[opcao.chave]).toBe("boolean")
    }
  })
})

describe("ehChaveValida", () => {
  it("aceita o que está no vocabulário", () => {
    for (const opcao of CONFIGURACOES) {
      expect(ehChaveValida(opcao.chave)).toBe(true)
    }
  })

  it("recusa qualquer outra coisa", () => {
    // A ação usa isto antes de gravar: sem a checagem, um POST forjado encheria
    // a tabela de linhas sem efeito.
    expect(ehChaveValida("")).toBe(false)
    expect(ehChaveValida("admin")).toBe(false)
    expect(ehChaveValida("menu_materias ")).toBe(false)
  })
})

describe("vocabulário de configurações", () => {
  it("não tem chave repetida", () => {
    const chaves = CONFIGURACOES.map((c) => c.chave)
    expect(new Set(chaves).size).toBe(chaves.length)
  })

  it("todo grupo declarado aparece na ordem de exibição", () => {
    // Grupo fora da ordem simplesmente não seria renderizado, e a opção
    // sumiria da tela sem erro nenhum.
    for (const opcao of CONFIGURACOES) {
      expect(ORDEM_GRUPOS).toContain(opcao.grupo)
    }
  })

  it("toda opção tem rótulo e descrição para o ADMIN decidir", () => {
    for (const opcao of CONFIGURACOES) {
      expect(opcao.rotulo.length).toBeGreaterThan(0)
      expect(opcao.descricao.length).toBeGreaterThan(20)
    }
  })

  it("o que é essencial para a turma nasce ligado", () => {
    const essenciais = ["menu_materias", "menu_cronograma", "menu_atividades"]
    for (const chave of essenciais) {
      expect(padroes()[chave as keyof ReturnType<typeof padroes>]).toBe(true)
    }
  })
})
