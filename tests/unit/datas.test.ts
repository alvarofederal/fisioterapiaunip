import { describe, it, expect } from "vitest"
import { dataDeEncontro, hojeNoBrasil, diasAteNoBrasil } from "@/lib/datas"
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

describe("hojeNoBrasil", () => {
  it("sábado de manhã é sábado", () => {
    // 10h em Brasília = 13h UTC.
    const agora = new Date("2026-10-17T13:00:00.000Z")
    expect(hojeNoBrasil(agora).toISOString()).toBe("2026-10-17T00:00:00.000Z")
  })

  it("sexta às 22h ainda é sexta, mesmo já sendo sábado em UTC", () => {
    // O instante que quebrava a "próxima aula": 01h UTC de sábado.
    const agora = new Date("2026-10-17T01:00:00.000Z")
    expect(hojeNoBrasil(agora).toISOString()).toBe("2026-10-16T00:00:00.000Z")
  })

  it("sábado às 23h30 continua sábado", () => {
    // 02h30 UTC de domingo.
    const agora = new Date("2026-10-18T02:30:00.000Z")
    expect(hojeNoBrasil(agora).toISOString()).toBe("2026-10-17T00:00:00.000Z")
  })

  it("a aula do dia fica dentro de um filtro gte", () => {
    // É a comparação que a consulta faz: data >= hoje.
    const aulaDeSabado = dataDeEncontro("2026-10-17")
    const sabadoDeManha = new Date("2026-10-17T13:00:00.000Z")
    expect(aulaDeSabado.getTime()).toBeGreaterThanOrEqual(hojeNoBrasil(sabadoDeManha).getTime())
    // Com new Date() direto, a mesma aula ficaria de fora:
    expect(aulaDeSabado.getTime()).toBeLessThan(sabadoDeManha.getTime())
  })
})

describe("diasAteNoBrasil", () => {
  const aula = dataDeEncontro("2026-10-17")

  it("no dia da aula é zero, de manhã ou de noite", () => {
    expect(diasAteNoBrasil(aula, new Date("2026-10-17T13:00:00.000Z"))).toBe(0)
    expect(diasAteNoBrasil(aula, new Date("2026-10-18T02:30:00.000Z"))).toBe(0)
  })

  it("sexta à noite a aula de sábado é amanhã, não hoje", () => {
    // 22h de Brasília, que já é sábado em UTC.
    expect(diasAteNoBrasil(aula, new Date("2026-10-17T01:00:00.000Z"))).toBe(1)
  })

  it("conta a semana inteira", () => {
    expect(diasAteNoBrasil(aula, new Date("2026-10-10T15:00:00.000Z"))).toBe(7)
  })

  it("aula passada dá negativo", () => {
    expect(diasAteNoBrasil(aula, new Date("2026-10-20T15:00:00.000Z"))).toBe(-3)
  })
})
