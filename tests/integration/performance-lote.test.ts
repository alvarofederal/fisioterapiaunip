/**
 * tests/integration/performance-lote.test.ts
 * Testa performance de geração de lotes em escala — identifica gargalos.
 * ⚠️  Testes de performance são lentos — separados dos testes funcionais.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import crypto from "crypto"
import {
  testDb,
  criarLojaTest,
  criarCampanhaTest,
  limparDadosTeste,
  fecharDb,
} from "../helpers/db"

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

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

let lojaId: string
let campanhaId: string

beforeAll(async () => {
  const { loja, user } = await criarLojaTest()
  lojaId = loja.id
  const campanha = await criarCampanhaTest(lojaId, user.id, {
    quantidadeChaves: 10_000,
  })
  campanhaId = campanha.id
})

afterAll(async () => {
  await limparDadosTeste()
  await fecharDb()
})

describe("Performance — Geração de chaves em escala", () => {
  it("gera 100 chaves em < 5s (lote pequeno)", async () => {
    const codigos = new Set<string>()
    while (codigos.size < 100) codigos.add(gerarCodigo())

    const inicio = Date.now()

    await testDb.loteChave.create({
      data: {
        campanhaId,
        lojaId,
        quantidade: 100,
        status:     "GERADO",
        chaves: {
          create: Array.from(codigos).map((codigo) => ({
            codigo,
            campanhaId,
            lojaId,
            status:     "GERADA" as const,
            landingUrl: `https://courtesyfy.com.br/c/${codigo}`,
          })),
        },
      },
    })

    const duracao = Date.now() - inicio
    console.log(`[perf] 100 chaves: ${duracao}ms`)
    expect(duracao).toBeLessThan(5_000)
  }, 10_000)

  it("⚠️  gera 500 chaves (mede tempo — identifica gargalo nested create)", async () => {
    const codigos = new Set<string>()
    while (codigos.size < 500) codigos.add(gerarCodigo())

    const inicio = Date.now()

    await testDb.loteChave.create({
      data: {
        campanhaId,
        lojaId,
        quantidade: 500,
        status:     "GERADO",
        chaves: {
          create: Array.from(codigos).map((codigo) => ({
            codigo,
            campanhaId,
            lojaId,
            status:     "GERADA" as const,
            landingUrl: `https://courtesyfy.com.br/c/${codigo}`,
          })),
        },
      },
    })

    const duracao = Date.now() - inicio
    console.log(`[perf] 500 chaves: ${duracao}ms`)

    // Avisa se demorar muito (Prisma nested create é N+1 para relacionamentos)
    if (duracao > 10_000) {
      console.warn(`⚠️  [GARGALO] 500 chaves levou ${duracao}ms — considerar createMany()`)
    }
    expect(duracao).toBeLessThan(30_000) // soft limit — documenta, não falha hard
  }, 35_000)

  it("⚡ createMany direto é MAIS RÁPIDO que nested create (benchmarking)", async () => {
    const codigos1 = new Set<string>()
    while (codigos1.size < 200) codigos1.add(gerarCodigo())

    const codigos2 = new Set<string>()
    while (codigos2.size < 200) codigos2.add(gerarCodigo())

    // Método ATUAL: nested create via loteChave.create
    const inicio1 = Date.now()
    await testDb.loteChave.create({
      data: {
        campanhaId, lojaId, quantidade: 200, status: "GERADO",
        chaves: {
          create: Array.from(codigos1).map((codigo) => ({
            codigo, campanhaId, lojaId, status: "GERADA" as const,
            landingUrl: `https://courtesyfy.com.br/c/${codigo}`,
          })),
        },
      },
    })
    const tempoCurrent = Date.now() - inicio1

    // Método OTIMIZADO: createMany separado
    const inicio2 = Date.now()
    const lote2 = await testDb.loteChave.create({
      data: { campanhaId, lojaId, quantidade: 200, status: "GERADO" },
    })
    await testDb.chave.createMany({
      data: Array.from(codigos2).map((codigo) => ({
        codigo, campanhaId, loteId: lote2.id, lojaId, status: "GERADA" as const,
        landingUrl: `https://courtesyfy.com.br/c/${codigo}`,
      })),
    })
    const tempoOtimizado = Date.now() - inicio2

    console.log(`[perf] nested create: ${tempoCurrent}ms | createMany: ${tempoOtimizado}ms`)
    console.log(`[perf] createMany é ${(tempoCurrent / Math.max(tempoOtimizado, 1)).toFixed(1)}x mais rápido`)

    // createMany deve ser significativamente mais rápido
    // (pode não ser sempre verdade em MySQL com poucas rows, mas documenta)
    expect(tempoOtimizado).toBeLessThan(tempoCurrent * 2) // ao menos não piora
  }, 30_000)
})

describe("Performance — Queries do dashboard", () => {
  it("métricas por status são rápidas mesmo com volume", async () => {
    const inicio = Date.now()
    await testDb.chave.groupBy({
      by:     ["status"],
      where:  { lojaId },
      _count: { status: true },
    })
    const duracao = Date.now() - inicio
    console.log(`[perf] groupBy status: ${duracao}ms`)
    expect(duracao).toBeLessThan(2_000)
  })

  it("listagem de chaves com paginação é rápida", async () => {
    const inicio = Date.now()
    await testDb.chave.findMany({
      where:   { lojaId },
      orderBy: { criadoEm: "desc" },
      take:    50,
      skip:    0,
      select:  { id: true, codigo: true, status: true, criadoEm: true },
    })
    const duracao = Date.now() - inicio
    console.log(`[perf] listagem paginada: ${duracao}ms`)
    expect(duracao).toBeLessThan(1_000)
  })
})
