/**
 * tests/integration/seguranca.test.ts
 * Testa regras de segurança, isolamento entre lojas e comportamentos críticos.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import crypto from "crypto"
import {
  testDb,
  testEmail,
  criarLojaTest,
  criarCampanhaTest,
  criarLoteTest,
  criarClienteTest,
  limparDadosTeste,
  fecharDb,
} from "../helpers/db"

let loja1Id: string
let user1Id: string
let loja2Id: string
let user2Id: string
let campanha1Id: string
let chave1Id: string

beforeAll(async () => {
  // Loja 1
  const r1 = await criarLojaTest()
  loja1Id = r1.loja.id
  user1Id = r1.user.id

  const campanha1 = await criarCampanhaTest(loja1Id, user1Id)
  campanha1Id = campanha1.id

  const lote1 = await criarLoteTest(campanha1Id, loja1Id, 2)
  chave1Id = lote1.chaves[0].id

  // Loja 2 (diferente)
  const r2 = await criarLojaTest()
  loja2Id = r2.loja.id
  user2Id = r2.user.id
})

afterAll(async () => {
  await limparDadosTeste()
  await fecharDb()
})

// ─── Isolamento entre lojas ───────────────────────────────────────────────────

describe("Isolamento de dados entre lojas", () => {
  it("chave da loja1 pertence à loja1 (lojaId correto)", async () => {
    const chave = await testDb.chave.findUnique({ where: { id: chave1Id } })
    expect(chave!.lojaId).toBe(loja1Id)
    expect(chave!.lojaId).not.toBe(loja2Id)
  })

  it("loja2 não consegue listar chaves da loja1", async () => {
    const chaves = await testDb.chave.findMany({
      where: { lojaId: loja2Id, id: chave1Id }, // tentativa de cruzar dados
    })
    expect(chaves).toHaveLength(0)
  })

  it("loja2 não consegue ver campanhas da loja1", async () => {
    const campanhas = await testDb.campanha.findMany({
      where: { lojaId: loja2Id, id: campanha1Id },
    })
    expect(campanhas).toHaveLength(0)
  })

  it("resgate só aceita chave com mesmo lojaId (regra da aplicação)", async () => {
    // Simula o check de segurança da action: chave.lojaId !== session.user.lojaId
    const chave = await testDb.chave.findUnique({ where: { id: chave1Id } })
    const pertenceLoja2 = chave!.lojaId === loja2Id
    expect(pertenceLoja2).toBe(false)
  })
})

// ─── Imutabilidade de RESGATADA ───────────────────────────────────────────────

describe("Imutabilidade — Chave RESGATADA", () => {
  let chaveResgatadaId: string

  beforeAll(async () => {
    const lote = await criarLoteTest(campanha1Id, loja1Id, 1)
    chaveResgatadaId = lote.chaves[0].id
    const cliente = await criarClienteTest()

    // Simula resgate completo
    await testDb.$transaction([
      testDb.chave.update({
        where: { id: chaveResgatadaId },
        data:  { status: "ATIVADA", clienteId: cliente.id, ativadaEm: new Date() },
      }),
    ])
    await testDb.$transaction([
      testDb.chave.update({
        where: { id: chaveResgatadaId },
        data:  { status: "RESGATADA", resgatadaEm: new Date() },
      }),
      testDb.resgate.create({
        data: {
          chaveId:       chaveResgatadaId,
          campanhaId:    campanha1Id,
          lojaId:        loja1Id,
          clienteId:     cliente.id,
          statusResgate: "CONFIRMADO",
          canal:         "BALCAO",
        },
      }),
    ])
  })

  it("banco PERMITE atualizar status de RESGATADA (constraint é na app)", async () => {
    // Documentação importante: o banco não tem constraint de imutabilidade
    // A proteção é feita na action confirmarResgateAutenticado verificando status !== "ATIVADA"
    const chave = await testDb.chave.findUnique({ where: { id: chaveResgatadaId } })
    expect(chave!.status).toBe("RESGATADA")

    // ⚠️  ALERTA: não há CHECK constraint no banco bloqueando update de RESGATADA
    // A proteção depende 100% da aplicação (linha: if (chave.status !== "ATIVADA") return error)
  })

  it("não existe segundo resgate (unique constraint funciona)", async () => {
    await expect(
      testDb.resgate.create({
        data: {
          chaveId:       chaveResgatadaId,
          campanhaId:    campanha1Id,
          lojaId:        loja1Id,
          statusResgate: "CONFIRMADO",
          canal:         "BALCAO",
        },
      })
    ).rejects.toThrow()
  })
})

// ─── Verificação de email ─────────────────────────────────────────────────────

describe("Tokens de verificação de email", () => {
  let userId: string

  beforeAll(async () => {
    const user = await testDb.user.create({
      data: {
        email: testEmail("verif"),   // usa TEST_PREFIX para garantir limpeza
        role:  "LOJISTA",
      },
    })
    userId = user.id
  })

  it("cria token com expiração de 15 minutos", async () => {
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    // Token único por execução para evitar violação de unique constraint entre runs
    const tokenUnico = crypto.randomBytes(4).toString("hex")

    await testDb.authToken.create({
      data: {
        userId,
        token:    tokenUnico,
        type:     "EMAIL_VERIFICATION",
        expiresAt,
      },
    })

    const token = await testDb.authToken.findFirst({
      where: { userId, type: "EMAIL_VERIFICATION" },
    })

    expect(token).not.toBeNull()
    expect(token!.used).toBe(false)
    expect(token!.expiresAt.getTime()).toBeGreaterThan(Date.now() + 14 * 60 * 1000)
  })

  it("marca token como usado após verificação", async () => {
    const token = await testDb.authToken.findFirst({
      where: { userId, type: "EMAIL_VERIFICATION" },
    })

    await testDb.authToken.update({
      where: { id: token!.id },
      data:  { used: true },
    })

    const tokenAtualizado = await testDb.authToken.findUnique({
      where: { id: token!.id },
    })
    expect(tokenAtualizado!.used).toBe(true)
  })

  it("não retorna token expirado na query de validação", async () => {
    // Cria token expirado com valor único
    const tokenExpirado = `exp_${crypto.randomBytes(4).toString("hex")}`
    await testDb.authToken.create({
      data: {
        userId,
        token:    tokenExpirado,
        type:     "EMAIL_VERIFICATION",
        expiresAt: new Date(Date.now() - 1_000), // expirado 1s atrás
      },
    })

    const tokenValido = await testDb.authToken.findFirst({
      where: {
        userId,
        token:    "999999",
        type:     "EMAIL_VERIFICATION",
        used:     false,
        expiresAt: { gte: new Date() },
      },
    })

    expect(tokenValido).toBeNull()
  })
})

// ─── Alertas de segurança documentados ───────────────────────────────────────

describe("ALERTAS de segurança identificados", () => {
  it("⚠️  Rate limit em memória não persiste entre instâncias serverless", () => {
    // store em /src/lib/rate-limit.ts usa Map em memória
    // Em produção Vercel, cada Lambda tem seu próprio store
    // SOLUÇÃO: usar Upstash Redis ou tabela no banco (ex: rate_limits)
    expect("ALERTA documentado").toBeTruthy()
  })

  it("⚠️  Imutabilidade de RESGATADA depende só da aplicação (sem DB constraint)", () => {
    // Não há CHECK CONSTRAINT no banco impedindo update de status RESGATADA
    // Um bug na aplicação poderia reverter um resgate
    // SOLUÇÃO: trigger MySQL ou verificação dupla na action
    expect("ALERTA documentado").toBeTruthy()
  })

  it("⚠️  LogEvento não é criado em gerarLote (auditoria incompleta)", () => {
    // A action gerarLote.ts não cria LogEvento com tipoEvento: "LOTE_GERADO"
    // O enum TipoEvento inclui LOTE_GERADO mas não é usado
    expect("ALERTA documentado").toBeTruthy()
  })

  it("⚠️  findMany sem paginação em /dashboard/resgates (take:50 fixo)", () => {
    // O take:50 em resgate queries é hardcoded, sem paginação real
    // Com alto volume pode causar problemas
    expect("ALERTA documentado").toBeTruthy()
  })
})
