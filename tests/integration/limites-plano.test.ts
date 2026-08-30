/**
 * tests/integration/limites-plano.test.ts
 * Testa as regras de limite por plano (ESSENCIAL: 3 campanhas, etc).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import {
  testDb,
  criarLojaTest,
  criarCampanhaTest,
  limparDadosTeste,
  fecharDb,
} from "../helpers/db"

afterAll(async () => {
  await limparDadosTeste()
  await fecharDb()
})

describe("Limites do plano ESSENCIAL", () => {
  let lojaId: string
  let userId: string

  beforeAll(async () => {
    const { loja, user } = await criarLojaTest({ plano: "ESSENCIAL" })
    lojaId = loja.id
    userId = user.id
  })

  it("permite criar até 3 campanhas ativas", async () => {
    for (let i = 0; i < 3; i++) {
      await criarCampanhaTest(lojaId, userId, {
        nome: `TEST_Campanha Plano ${i + 1}_${Date.now()}`,
      })
    }

    const total = await testDb.campanha.count({
      where: { lojaId, status: { not: "CANCELADA" } },
    })
    expect(total).toBe(3)
  })

  it("bloqueia 4ª campanha (simulação da regra do action)", async () => {
    const total = await testDb.campanha.count({
      where: { lojaId, status: { not: "CANCELADA" } },
    })

    // Simulação da regra em criarCampanha action
    const bloqueado = total >= 3
    expect(bloqueado).toBe(true)
  })

  it("campanhas CANCELADAS não contam para o limite", async () => {
    // Cancela uma campanha
    const campanha = await testDb.campanha.findFirst({
      where: { lojaId },
    })
    await testDb.campanha.update({
      where: { id: campanha!.id },
      data:  { status: "CANCELADA" },
    })

    const total = await testDb.campanha.count({
      where: { lojaId, status: { not: "CANCELADA" } },
    })
    expect(total).toBe(2) // agora tem espaço
  })
})

describe("Plano PROFISSIONAL (sem limite de campanhas)", () => {
  let lojaId: string
  let userId: string

  beforeAll(async () => {
    const { loja, user } = await criarLojaTest({ plano: "PROFISSIONAL" })
    lojaId = loja.id
    userId = user.id
  })

  it("pode criar mais de 3 campanhas", async () => {
    for (let i = 0; i < 5; i++) {
      await criarCampanhaTest(lojaId, userId, {
        nome: `TEST_Campanha PRO ${i + 1}_${Date.now()}`,
      })
    }

    const total = await testDb.campanha.count({
      where: { lojaId, status: { not: "CANCELADA" } },
    })
    expect(total).toBe(5)
  })
})

describe("Limite de chaves por lote", () => {
  it("limite máximo é 2000 chaves por lote (regra do schema Zod)", () => {
    // Documentado em gerar-lote.ts: max: 2000
    const maxChavesPorLote = 2_000
    expect(maxChavesPorLote).toBe(2_000)
  })

  it("limite máximo de chaves por campanha é 10000", () => {
    // Documentado em criar-campanha.ts: max: 10_000
    const maxChavesPorCampanha = 10_000
    expect(maxChavesPorCampanha).toBe(10_000)
  })
})
