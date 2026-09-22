import { describe, it, expect } from "vitest"
import { agruparCronograma, type ItemCronograma } from "@/lib/cronograma"
import type { StatusEstudo } from "@/generated/prisma"

const HOJE = new Date("2026-09-21T09:00:00")

/** Encontro de teste. A data é gravada como meio-dia UTC, como no banco. */
function encontro(iso: string, status?: StatusEstudo): ItemCronograma & { iso: string } {
  return {
    iso,
    data: new Date(`${iso}T12:00:00.000Z`),
    meuEstudo: status ? { status } : null,
  }
}

describe("agruparCronograma", () => {
  it("põe o atraso mais recente no foco, não o mais antigo", () => {
    // Quem tem três atrasos começa pelo que ainda está fresco na cabeça.
    const itens = [
      encontro("2026-08-08"),
      encontro("2026-08-22"),
      encontro("2026-09-19"),
    ]
    const r = agruparCronograma(itens, itens, HOJE)

    expect(r.focoEhAtraso).toBe(true)
    expect(r.foco?.iso).toBe("2026-09-19")
  })

  it("não repete o foco dentro dos grupos", () => {
    const itens = [
      encontro("2026-09-19"),
      encontro("2026-09-12"),
      encontro("2026-09-26"),
    ]
    const r = agruparCronograma(itens, itens, HOJE)

    const listados = [...r.atrasadas, ...r.futuras, ...r.concluidas].map((i) => i.iso)
    expect(listados).not.toContain(r.foco?.iso)
    expect(listados).toHaveLength(itens.length - 1)
  })

  it("sem atraso, o foco é o próximo encontro e sai de 'vem aí'", () => {
    const itens = [encontro("2026-09-26"), encontro("2026-10-10")]
    const r = agruparCronograma(itens, itens, HOJE)

    expect(r.focoEhAtraso).toBe(false)
    expect(r.foco?.iso).toBe("2026-09-26")
    expect(r.futuras.map((i) => i.iso)).toEqual(["2026-10-10"])
    expect(r.atrasadas).toHaveLength(0)
  })

  it("revisado sai de 'estude isto' mesmo tendo passado", () => {
    const itens = [encontro("2026-08-08", "REVISADO"), encontro("2026-09-19")]
    const r = agruparCronograma(itens, itens, HOJE)

    expect(r.foco?.iso).toBe("2026-09-19")
    expect(r.concluidas.map((i) => i.iso)).toEqual(["2026-08-08"])
    expect(r.atrasadas).toHaveLength(0)
  })

  it("'estudando' ainda cobra — só REVISADO tira da lista", () => {
    const itens = [encontro("2026-08-08", "ESTUDANDO")]
    const r = agruparCronograma(itens, itens, HOJE)

    expect(r.focoEhAtraso).toBe(true)
    expect(r.foco?.iso).toBe("2026-08-08")
    expect(r.concluidas).toHaveLength(0)
  })

  it("encontro de hoje conta como futuro, não como atraso", () => {
    const itens = [encontro("2026-09-21")]
    const r = agruparCronograma(itens, itens, HOJE)

    expect(r.focoEhAtraso).toBe(false)
    expect(r.foco?.iso).toBe("2026-09-21")
  })

  it("tudo revisado: sem foco e sem grupos pendentes", () => {
    const itens = [
      encontro("2026-08-08", "REVISADO"),
      encontro("2026-09-19", "REVISADO"),
    ]
    const r = agruparCronograma(itens, itens, HOJE)

    expect(r.foco).toBeNull()
    expect(r.atrasadas).toHaveLength(0)
    expect(r.futuras).toHaveLength(0)
    expect(r.percentual).toBe(100)
  })

  it("lista vazia não quebra nem divide por zero", () => {
    const r = agruparCronograma([], [], HOJE)
    expect(r.foco).toBeNull()
    expect(r.percentual).toBe(0)
  })

  it("filtrar por matéria não muda o progresso do semestre", () => {
    // Filtrar é para achar, não para parecer que falta menos.
    const semestre = [
      encontro("2026-08-08", "REVISADO"),
      encontro("2026-08-15"),
      encontro("2026-08-22"),
      encontro("2026-08-29"),
    ]
    const soUmaMateria = [semestre[0], semestre[2]]

    const r = agruparCronograma(soUmaMateria, semestre, HOJE)

    expect(r.revisadas).toBe(1)
    expect(r.percentual).toBe(25) // 1 de 4 do semestre, não 1 de 2 da matéria
  })

  it("concluídas vêm do mais recente para o mais antigo", () => {
    const itens = [
      encontro("2026-08-08", "REVISADO"),
      encontro("2026-08-22", "REVISADO"),
      encontro("2026-09-19", "REVISADO"),
    ]
    const r = agruparCronograma(itens, itens, HOJE)

    expect(r.concluidas.map((i) => i.iso)).toEqual([
      "2026-09-19",
      "2026-08-22",
      "2026-08-08",
    ])
  })
})
