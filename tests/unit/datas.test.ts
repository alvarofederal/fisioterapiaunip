import { describe, it, expect } from "vitest"
import { dataDeEncontro } from "@/lib/datas"
import { diasAte } from "@/lib/dominio"

describe("dataDeEncontro", () => {
  it("produz meia-noite UTC, que é o que a coluna @db.Date devolve", () => {
    // O bug que isto previne: construir com meio-dia e comparar com o valor
    // lido do banco (meia-noite) nunca casava, e as travas de duplicata
    // deixavam passar dois encontros no mesmo dia.
    expect(dataDeEncontro("2026-10-17").toISOString()).toBe("2026-10-17T00:00:00.000Z")
  })

  it("bate com o valor que volta do banco", () => {
    const gravado = dataDeEncontro("2026-08-08")
    const lidoDoBanco = new Date("2026-08-08T00:00:00.000Z")
    expect(gravado.getTime()).toBe(lidoDoBanco.getTime())
  })

  it("não escorrega para o dia anterior ao formatar em UTC", () => {
    // Meia-noite UTC só é segura porque toda formatação usa timeZone UTC.
    const d = dataDeEncontro("2026-12-19")
    const texto = d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "UTC",
    })
    expect(texto).toBe("19/12")
  })

  it("mantém a contagem de dias correta", () => {
    const hoje = new Date("2026-09-21T09:00:00")
    expect(diasAte(dataDeEncontro("2026-09-21"), hoje)).toBe(0)
    expect(diasAte(dataDeEncontro("2026-09-26"), hoje)).toBe(5)
    expect(diasAte(dataDeEncontro("2026-09-19"), hoje)).toBe(-2)
  })

  it("atravessa a virada de ano sem erro", () => {
    const fimDeAno = new Date("2026-12-31T22:00:00")
    expect(diasAte(dataDeEncontro("2027-01-01"), fimDeAno)).toBe(1)
  })
})
