import { describe, it, expect } from "vitest"
import { agruparCronograma, type ItemCronograma } from "@/lib/cronograma"
import type { Modalidade, StatusEstudo } from "@/generated/prisma"

const HOJE = new Date("2026-09-21T09:00:00")

function encontro(
  iso: string,
  opcoes: { status?: StatusEstudo; modalidade?: Modalidade } = {}
): ItemCronograma & { iso: string } {
  return {
    iso,
    data: new Date(`${iso}T12:00:00.000Z`),
    modalidade: opcoes.modalidade ?? "PRESENCIAL",
    meuEstudo: opcoes.status ? { status: opcoes.status } : null,
  }
}

describe("agruparCronograma — o passado sai sozinho da lista", () => {
  it("encontro que passou não aparece em presenciais nem em ead", () => {
    const itens = [encontro("2026-08-08"), encontro("2026-10-17")]
    const r = agruparCronograma(itens, itens, HOJE)

    const naListaPrincipal = [...r.presenciais, ...r.ead, r.foco].map((i) => i?.iso)
    expect(naListaPrincipal).not.toContain("2026-08-08")
  })

  it("arquiva sem depender de clique: não estudado vai para naoFeitas", () => {
    const itens = [encontro("2026-08-08")]
    const r = agruparCronograma(itens, itens, HOJE)

    expect(r.naoFeitas.map((i) => i.iso)).toEqual(["2026-08-08"])
    expect(r.feitas).toHaveLength(0)
    expect(r.foco).toBeNull()
  })

  it("separa o que foi feito do que não foi", () => {
    const itens = [
      encontro("2026-08-08", { status: "REVISADO" }),
      encontro("2026-08-22"),
      encontro("2026-09-19", { status: "ESTUDANDO" }),
    ]
    const r = agruparCronograma(itens, itens, HOJE)

    expect(r.feitas.map((i) => i.iso)).toEqual(["2026-08-08"])
    // "Estudando" não é "feito" — continua como pendente no histórico.
    expect(r.naoFeitas.map((i) => i.iso)).toEqual(["2026-09-19", "2026-08-22"])
  })

  it("encontro de hoje continua na lista, não vai para o histórico", () => {
    const itens = [encontro("2026-09-21")]
    const r = agruparCronograma(itens, itens, HOJE)

    expect(r.foco?.iso).toBe("2026-09-21")
    expect(r.naoFeitas).toHaveLength(0)
  })
})

describe("agruparCronograma — presencial e EaD são separados", () => {
  it("cada modalidade na sua lista", () => {
    const itens = [
      encontro("2026-10-17", { modalidade: "PRESENCIAL" }),
      encontro("2026-10-18", { modalidade: "EAD" }),
      encontro("2026-10-24", { modalidade: "PRESENCIAL" }),
    ]
    const r = agruparCronograma(itens, itens, HOJE)

    // O primeiro futuro vira foco e sai das listas.
    expect(r.foco?.iso).toBe("2026-10-17")
    expect(r.presenciais.map((i) => i.iso)).toEqual(["2026-10-24"])
    expect(r.ead.map((i) => i.iso)).toEqual(["2026-10-18"])
  })

  it("EaD pode ser o próximo encontro", () => {
    const itens = [
      encontro("2026-09-26", { modalidade: "EAD" }),
      encontro("2026-10-17", { modalidade: "PRESENCIAL" }),
    ]
    const r = agruparCronograma(itens, itens, HOJE)

    expect(r.foco?.iso).toBe("2026-09-26")
    expect(r.foco?.modalidade).toBe("EAD")
    expect(r.ead).toHaveLength(0)
  })

  it("o foco nunca se repete nas listas", () => {
    const itens = [
      encontro("2026-10-17", { modalidade: "PRESENCIAL" }),
      encontro("2026-10-18", { modalidade: "EAD" }),
    ]
    const r = agruparCronograma(itens, itens, HOJE)

    const listados = [...r.presenciais, ...r.ead].map((i) => i.iso)
    expect(listados).not.toContain(r.foco?.iso)
  })
})

describe("agruparCronograma — progresso", () => {
  it("filtrar por matéria não muda o percentual do semestre", () => {
    // Filtrar é para achar, não para parecer que falta menos.
    const semestre = [
      encontro("2026-08-08", { status: "REVISADO" }),
      encontro("2026-08-15"),
      encontro("2026-08-22"),
      encontro("2026-08-29"),
    ]
    const soUmaMateria = [semestre[0], semestre[2]]

    const r = agruparCronograma(soUmaMateria, semestre, HOJE)

    expect(r.revisadas).toBe(1)
    expect(r.percentual).toBe(25)
  })

  it("lista vazia não divide por zero", () => {
    const r = agruparCronograma([], [], HOJE)
    expect(r.foco).toBeNull()
    expect(r.percentual).toBe(0)
  })

  it("tudo revisado dá 100%", () => {
    const itens = [
      encontro("2026-08-08", { status: "REVISADO" }),
      encontro("2026-09-19", { status: "REVISADO" }),
    ]
    const r = agruparCronograma(itens, itens, HOJE)
    expect(r.percentual).toBe(100)
  })
})
