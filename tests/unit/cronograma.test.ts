import { describe, it, expect } from "vitest"
import {
  diasAte,
  textoDeProximidade,
  formatarMes,
  formatarDataCurta,
  ORDEM_STATUS,
  STATUS_ESTUDO,
} from "@/lib/dominio"

/** Data do cronograma, gravada como meio-dia UTC. */
const emUTC = (iso: string) => new Date(`${iso}T12:00:00.000Z`)

describe("diasAte", () => {
  const hoje = new Date("2026-09-21T09:00:00")

  it("conta zero para o próprio dia", () => {
    expect(diasAte(emUTC("2026-09-21"), hoje)).toBe(0)
  })

  it("conta positivo para data futura", () => {
    expect(diasAte(emUTC("2026-09-26"), hoje)).toBe(5)
  })

  it("conta negativo para data passada", () => {
    expect(diasAte(emUTC("2026-09-19"), hoje)).toBe(-2)
  })

  it("não se confunde com o horário do dia", () => {
    const fimDoDia = new Date("2026-09-21T23:30:00")
    expect(diasAte(emUTC("2026-09-22"), fimDoDia)).toBe(1)
  })

  it("atravessa a virada de mês", () => {
    expect(diasAte(emUTC("2026-10-17"), hoje)).toBe(26)
  })
})

describe("textoDeProximidade", () => {
  it("traduz os casos do dia a dia", () => {
    expect(textoDeProximidade(0)).toBe("hoje")
    expect(textoDeProximidade(1)).toBe("amanhã")
    expect(textoDeProximidade(-1)).toBe("ontem")
    expect(textoDeProximidade(5)).toBe("em 5 dias")
    expect(textoDeProximidade(-3)).toBe("há 3 dias")
  })
})

describe("formatação de data", () => {
  it("não desloca o dia por causa do fuso", () => {
    // O bug clássico: 17/10 gravado como meia-noite UTC vira 16/10 no Brasil.
    expect(formatarDataCurta(emUTC("2026-10-17"))).toContain("17")
    expect(formatarDataCurta(emUTC("2026-12-19"))).toContain("19")
  })

  it("monta o cabeçalho do mês com inicial maiúscula", () => {
    expect(formatarMes(emUTC("2026-10-17"))).toBe("Outubro de 2026")
  })
})

describe("vocabulário de estudo", () => {
  it("tem os três estados na ordem de progresso", () => {
    expect(ORDEM_STATUS).toEqual(["A_ESTUDAR", "ESTUDANDO", "REVISADO"])
  })

  it("todo estado tem rótulo e cor", () => {
    for (const codigo of ORDEM_STATUS) {
      expect(STATUS_ESTUDO[codigo].rotulo).toBeTruthy()
      expect(STATUS_ESTUDO[codigo].cor).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
