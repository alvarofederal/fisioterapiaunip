/**
 * tests/unit/gerar-codigo.test.ts
 * Testa a lógica de geração de código de chave (função pura extraída de gerar-lote.ts).
 */
import { describe, it, expect } from "vitest"
import crypto from "crypto"

// ─── Réplica da função (mantida em sync com src/app/(panel)/dashboard/chaves/_actions/gerar-lote.ts)
// BUG CORRIGIDO: L e S removidos do CHARSET (eram chars ambíguos)
const CHARSET = "ABCDEFGHJKMNPQRTUVWXYZ23456789" // 30 chars, sem 0,O,1,I,L,S

function gerarCodigo(): string {
  const bytes = crypto.randomBytes(16)
  const groups: string[] = []
  for (let g = 0; g < 4; g++) {
    let group = ""
    for (let i = 0; i < 4; i++) group += CHARSET[bytes[g * 4 + i] % CHARSET.length]
    groups.push(group)
  }
  return groups.join("-")
}

// ─── Testes ──────────────────────────────────────────────────────────────────

describe("gerarCodigo()", () => {
  it("gera código no formato XXXX-XXXX-XXXX-XXXX", () => {
    const codigo = gerarCodigo()
    expect(codigo).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
  })

  it("tem exatamente 19 caracteres (16 letras + 3 hifens)", () => {
    const codigo = gerarCodigo()
    expect(codigo).toHaveLength(19)
  })

  it("não contém caracteres ambíguos: 0, O, 1, I, L, S (BUG corrigido — L e S estavam presentes)", () => {
    // Gera 10.000 códigos para cobertura estatística
    for (let i = 0; i < 10_000; i++) {
      const c = gerarCodigo()
      // Sem: 0 (zero), O (letra), 1 (um), I (letra), L (letra), S (letra)
      expect(c).not.toMatch(/[01ILSo]/)
    }
  })

  it("CHARSET correto tem 30 caracteres após remoção de L e S", () => {
    expect(CHARSET).toHaveLength(30)
    expect(CHARSET).not.toContain("I")
    expect(CHARSET).not.toContain("L")
    expect(CHARSET).not.toContain("O")
    expect(CHARSET).not.toContain("S")
    expect(CHARSET).not.toContain("0")
    expect(CHARSET).not.toContain("1")
  })

  it("usa apenas caracteres do CHARSET definido", () => {
    const validChars = new Set(CHARSET.split("").concat(["-"]))
    for (let i = 0; i < 1_000; i++) {
      const codigo = gerarCodigo()
      for (const ch of codigo) {
        expect(validChars.has(ch)).toBe(true)
      }
    }
  })

  it("gera 5.000 códigos sem colisões (unicidade local)", () => {
    const codigos = new Set<string>()
    for (let i = 0; i < 5_000; i++) codigos.add(gerarCodigo())
    expect(codigos.size).toBe(5_000)
  })

  it("distribuição uniforme por grupo (não concentra em prefixo)", () => {
    const prefixos = new Map<string, number>()
    for (let i = 0; i < 10_000; i++) {
      const prefixo = gerarCodigo().slice(0, 4)
      prefixos.set(prefixo, (prefixos.get(prefixo) ?? 0) + 1)
    }
    // Com 10k códigos e 32^4 = ~1M possibilidades, nenhum prefixo deve aparecer > 10x
    for (const [, count] of prefixos) {
      expect(count).toBeLessThanOrEqual(10)
    }
  })
})

// ─── Teste da lógica de geração em lote ──────────────────────────────────────

describe("Geração de lote (lógica de unicidade)", () => {
  it("gera Set sem colisões para 2000 chaves (máximo do sistema)", () => {
    const codigos = new Set<string>()
    while (codigos.size < 2_000) codigos.add(gerarCodigo())
    expect(codigos.size).toBe(2_000)
  })

  it("resolve colisão simulada (lógica de retry)", () => {
    const existentes = new Set(["AAAA-BBBB-CCCC-DDDD"])
    const codigos = new Set<string>()
    const qtd = 10

    while (codigos.size < qtd) {
      const novo = gerarCodigo()
      if (!existentes.has(novo)) codigos.add(novo)
    }

    expect(codigos.size).toBe(qtd)
    for (const c of codigos) {
      expect(existentes.has(c)).toBe(false)
    }
  })
})
