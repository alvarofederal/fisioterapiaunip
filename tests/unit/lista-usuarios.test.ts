import { describe, it, expect } from "vitest"
import {
  filtrarPorSituacao,
  ordenarUsuarios,
  parametrosDaTabela,
  type UsuarioDaTabela,
} from "@/lib/lista-usuarios"

function usuario(nome: string, extra: Partial<UsuarioDaTabela> = {}): UsuarioDaTabela {
  return {
    id: nome,
    nome,
    email: `${nome.toLowerCase()}@exemplo.com`,
    ra: "0000000",
    role: "ALUNO",
    ativo: true,
    ultimoAcesso: null,
    ...extra,
  }
}

const ana = usuario("Ana", { ultimoAcesso: new Date("2026-10-16T12:00:00.000Z") })
const bruno = usuario("bruno", { ultimoAcesso: new Date("2026-10-01T12:00:00.000Z") })
const celia = usuario("Célia") // aprovada, nunca entrou
const davi = usuario("Davi", { ativo: false }) // aguardando
const ze = usuario("Zé", { ultimoAcesso: new Date("2026-10-15T12:00:00.000Z") })
const todos = [ze, celia, davi, bruno, ana]

const nomes = (lista: UsuarioDaTabela[]) => lista.map((u) => u.nome)

describe("ordenarUsuarios", () => {
  it("padrão: quem aguarda primeiro, depois por nome sem ligar para maiúscula e acento", () => {
    expect(nomes(ordenarUsuarios(todos, "padrao"))).toEqual(["Davi", "Ana", "bruno", "Célia", "Zé"])
  })

  it("nome: A→Z e Z→A", () => {
    expect(nomes(ordenarUsuarios(todos, "nome"))).toEqual(["Ana", "bruno", "Célia", "Davi", "Zé"])
    expect(nomes(ordenarUsuarios(todos, "nome", "desc"))).toEqual(["Zé", "Davi", "Célia", "bruno", "Ana"])
  })

  it("login: mais recente primeiro, e quem nunca entrou no fim", () => {
    expect(nomes(ordenarUsuarios(todos, "login"))).toEqual(["Ana", "Zé", "bruno", "Célia", "Davi"])
  })

  it("login ao contrário: mais antigo primeiro, e quem nunca entrou continua no fim", () => {
    expect(nomes(ordenarUsuarios(todos, "login", "asc"))).toEqual(["bruno", "Zé", "Ana", "Célia", "Davi"])
  })

  it("não altera a lista recebida", () => {
    const original = [...todos]
    ordenarUsuarios(todos, "nome", "desc")
    expect(todos).toEqual(original)
  })
})

describe("filtrarPorSituacao", () => {
  it("separa quem aguarda de quem tem acesso", () => {
    expect(nomes(filtrarPorSituacao(todos, "aguardando"))).toEqual(["Davi"])
    expect(filtrarPorSituacao(todos, "ativos")).toHaveLength(4)
    expect(filtrarPorSituacao(todos, "todos")).toHaveLength(5)
  })
})

describe("parametrosDaTabela", () => {
  it("lê os valores válidos da URL", () => {
    expect(parametrosDaTabela.parse({ situacao: "aguardando", ordem: "login", dir: "asc" })).toEqual({
      situacao: "aguardando",
      ordem: "login",
      dir: "asc",
    })
  })

  it("valor desconhecido ou repetido volta para o padrão em vez de quebrar a página", () => {
    expect(parametrosDaTabela.parse({ situacao: "x", ordem: ["nome", "login"], dir: "lado" })).toEqual({
      situacao: "todos",
      ordem: "padrao",
      dir: undefined,
    })
    expect(parametrosDaTabela.parse({})).toEqual({ situacao: "todos", ordem: "padrao", dir: undefined })
  })
})
