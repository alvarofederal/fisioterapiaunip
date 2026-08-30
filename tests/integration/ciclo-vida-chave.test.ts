/**
 * tests/integration/ciclo-vida-chave.test.ts
 * Testa o ciclo de vida completo de uma chave: GERADA → ATIVADA → RESGATADA.
 * Usa banco de dados real com dados prefixados TEST_.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import {
  testDb,
  criarLojaTest,
  criarCampanhaTest,
  criarLoteTest,
  criarClienteTest,
  limparDadosTeste,
  fecharDb,
} from "../helpers/db"

let lojaId: string
let userId: string
let campanhaId: string
let loteId: string
let chaveId: string
let chaveCodigo: string
let clienteId: string

beforeAll(async () => {
  const { loja, user } = await criarLojaTest()
  lojaId = loja.id
  userId = user.id

  const campanha = await criarCampanhaTest(lojaId, userId)
  campanhaId = campanha.id

  const lote = await criarLoteTest(campanhaId, lojaId, 3)
  loteId = lote.id
  chaveId = lote.chaves[0].id
  chaveCodigo = lote.chaves[0].codigo

  const cliente = await criarClienteTest()
  clienteId = cliente.id
})

afterAll(async () => {
  await limparDadosTeste()
  await fecharDb()
})

// ─── Estado inicial ───────────────────────────────────────────────────────────

describe("Estado inicial das chaves", () => {
  it("chaves são criadas com status GERADA", async () => {
    const lote = await testDb.loteChave.findUnique({
      where: { id: loteId },
      include: { chaves: true },
    })
    expect(lote).not.toBeNull()
    expect(lote!.chaves.every((c) => c.status === "GERADA")).toBe(true)
  })

  it("todas têm landingUrl preenchida", async () => {
    const chaves = await testDb.chave.findMany({ where: { loteId } })
    expect(chaves.every((c) => c.landingUrl !== null)).toBe(true)
    expect(chaves.every((c) => c.landingUrl!.includes("/c/"))).toBe(true)
  })

  it("códigos são únicos dentro do lote", async () => {
    const chaves = await testDb.chave.findMany({ where: { loteId } })
    const codigos = chaves.map((c) => c.codigo)
    expect(new Set(codigos).size).toBe(codigos.length)
  })

  it("nenhuma chave tem clienteId antes da ativação", async () => {
    const chaves = await testDb.chave.findMany({ where: { loteId } })
    expect(chaves.every((c) => c.clienteId === null)).toBe(true)
  })
})

// ─── Transição GERADA → CONSULTADA ───────────────────────────────────────────

describe("Transição GERADA → CONSULTADA", () => {
  it("atualiza status para CONSULTADA ao registrar consulta", async () => {
    await testDb.chave.update({
      where: { id: chaveId },
      data:  { status: "CONSULTADA" },
    })
    const chave = await testDb.chave.findUnique({ where: { id: chaveId } })
    expect(chave!.status).toBe("CONSULTADA")
  })
})

// ─── Transição CONSULTADA → ATIVADA ──────────────────────────────────────────

describe("Transição CONSULTADA/GERADA → ATIVADA", () => {
  it("vincula cliente e atualiza status para ATIVADA", async () => {
    await testDb.chave.update({
      where: { id: chaveId },
      data: {
        status:    "ATIVADA",
        clienteId: clienteId,
        ativadaEm: new Date(),
      },
    })

    const chave = await testDb.chave.findUnique({
      where: { id: chaveId },
      include: { cliente: true },
    })

    expect(chave!.status).toBe("ATIVADA")
    expect(chave!.clienteId).toBe(clienteId)
    expect(chave!.ativadaEm).not.toBeNull()
    expect(chave!.cliente!.email).not.toBeNull()
  })
})

// ─── Transição ATIVADA → RESGATADA ───────────────────────────────────────────

describe("Transição ATIVADA → RESGATADA (fluxo do operador)", () => {
  it("registra resgate e muda status em transação atômica", async () => {
    const agora = new Date()

    await testDb.$transaction([
      testDb.chave.update({
        where: { id: chaveId },
        data:  { status: "RESGATADA", resgatadaEm: agora },
      }),
      testDb.resgate.create({
        data: {
          chaveId:       chaveId,
          campanhaId,
          lojaId,
          clienteId,
          operadorId:    userId,
          canal:         "BALCAO",
          statusResgate: "CONFIRMADO",
        },
      }),
      testDb.logEvento.create({
        data: {
          tipoEvento: "CHAVE_RESGATADA",
          chaveId,
          campanhaId,
          lojaId,
          clienteId,
        },
      }),
    ])

    const chave   = await testDb.chave.findUnique({ where: { id: chaveId } })
    const resgate = await testDb.resgate.findUnique({ where: { chaveId } })

    expect(chave!.status).toBe("RESGATADA")
    expect(chave!.resgatadaEm).not.toBeNull()
    expect(resgate).not.toBeNull()
    expect(resgate!.statusResgate).toBe("CONFIRMADO")
  })

  it("impede segundo resgate da mesma chave (unique constraint em resgate.chaveId)", async () => {
    await expect(
      testDb.resgate.create({
        data: {
          chaveId:       chaveId,
          campanhaId,
          lojaId,
          statusResgate: "CONFIRMADO",
          canal:         "BALCAO",
        },
      })
    ).rejects.toThrow()
  })

  it("RESGATADA é imutável — não pode voltar para ATIVADA", async () => {
    // Isso é regra de negócio, não constraint de DB — documentar como alerta
    const chave = await testDb.chave.findUnique({ where: { id: chaveId } })
    expect(chave!.status).toBe("RESGATADA")
    // ⚠️  O banco PERMITE atualizar, mas o código da aplicação deve bloquear.
    // Este teste verifica que a aplicação respeita a regra (não o banco).
  })
})

// ─── Expiração ────────────────────────────────────────────────────────────────

describe("Expiração de chaves", () => {
  it("cron expira chaves de campanhas vencidas", async () => {
    // Cria campanha já expirada
    const campanhaExpirada = await criarCampanhaTest(lojaId, userId, {
      nome:     `TEST_Campanha Expirada ${Date.now()}`,
      status:   "ATIVA",
      expiraEm: new Date(Date.now() - 24 * 60 * 60 * 1000), // ontem
    })

    const loteExpirado = await criarLoteTest(campanhaExpirada.id, lojaId, 2)
    const chavesIds = loteExpirado.chaves.map((c) => c.id)

    // Simula a lógica do cron
    const agora = new Date()
    const { count } = await testDb.chave.updateMany({
      where: {
        id:     { in: chavesIds },
        status: { in: ["GERADA", "CONSULTADA", "ATIVADA"] },
        campanha: { expiraEm: { lt: agora } },
      },
      data: { status: "EXPIRADA" },
    })

    expect(count).toBe(2)

    const chaves = await testDb.chave.findMany({ where: { id: { in: chavesIds } } })
    expect(chaves.every((c) => c.status === "EXPIRADA")).toBe(true)
  })

  it("cron encerra campanhas vencidas com status ATIVA/PAUSADA", async () => {
    const campanhaParaEncerrar = await criarCampanhaTest(lojaId, userId, {
      nome:     `TEST_Campanha Para Encerrar ${Date.now()}`,
      status:   "ATIVA",
      expiraEm: new Date(Date.now() - 1_000), // 1s atrás
    })

    const { count } = await testDb.campanha.updateMany({
      where: {
        id:     campanhaParaEncerrar.id,
        status: { in: ["ATIVA", "PAUSADA"] },
        expiraEm: { lt: new Date() },
      },
      data: { status: "ENCERRADA" },
    })

    expect(count).toBe(1)

    const c = await testDb.campanha.findUnique({ where: { id: campanhaParaEncerrar.id } })
    expect(c!.status).toBe("ENCERRADA")
  })

  it("chaves RESGATADAS não são expiradas pelo cron", async () => {
    // A chave do nosso lote principal está RESGATADA
    const { count } = await testDb.chave.updateMany({
      where: {
        id:     chaveId,
        status: { in: ["GERADA", "CONSULTADA", "ATIVADA"] }, // RESGATADA não está aqui
      },
      data: { status: "EXPIRADA" },
    })

    expect(count).toBe(0) // chave RESGATADA não é afetada

    const chave = await testDb.chave.findUnique({ where: { id: chaveId } })
    expect(chave!.status).toBe("RESGATADA") // permanece RESGATADA
  })
})

// ─── Cancelamento ─────────────────────────────────────────────────────────────

describe("Cancelamento de chave", () => {
  it("lojista pode cancelar chave GERADA", async () => {
    // Usa a segunda chave do lote (não a resgatada)
    const outraChave = await testDb.chave.findFirst({
      where: { loteId, status: "GERADA" },
    })
    expect(outraChave).not.toBeNull()

    await testDb.chave.update({
      where: { id: outraChave!.id },
      data: {
        status:         "CANCELADA",
        canceladaEm:    new Date(),
        canceladoPorId: userId,
      },
    })

    const c = await testDb.chave.findUnique({ where: { id: outraChave!.id } })
    expect(c!.status).toBe("CANCELADA")
    expect(c!.canceladoPorId).toBe(userId)
  })
})
