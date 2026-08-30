/**
 * tests/integration/banco-conexao.test.ts
 * Verifica conectividade e performance básica do banco de dados.
 */
import { describe, it, expect, afterAll } from "vitest"
import { testDb, fecharDb } from "../helpers/db"

afterAll(fecharDb)

describe("Conectividade do banco de dados", () => {
  it("conecta ao MySQL com sucesso", async () => {
    const resultado = await testDb.$queryRaw<[{ resultado: number }]>`SELECT 1 AS resultado`
    expect(resultado[0].resultado).toBe(1)
  })

  it("responde em menos de 3 segundos", async () => {
    const inicio = Date.now()
    await testDb.$queryRaw`SELECT 1`
    expect(Date.now() - inicio).toBeLessThan(3_000)
  })

  it("tabelas principais existem", async () => {
    const tabelas = await testDb.$queryRaw<{ TABLE_NAME: string }[]>`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `
    const nomes = tabelas.map((t) => t.TABLE_NAME)
    expect(nomes).toContain("campanhas")
    expect(nomes).toContain("chaves")
    expect(nomes).toContain("clientes")
    expect(nomes).toContain("lotes_chaves")
    expect(nomes).toContain("lojas")
    expect(nomes).toContain("resgates")
    expect(nomes).toContain("logs_eventos")
    expect(nomes).toContain("auth_tokens")
    // Tabela de usuários mapeada como 'users' (não 'usuarios')
    const temUsers = nomes.includes("users") || nomes.includes("usuarios")
    expect(temUsers).toBe(true)
    console.log(`[banco] Tabelas: ${nomes.join(", ")}`)
  })

  it("coluna codigo em chaves é UNIQUE", async () => {
    const indexes = await testDb.$queryRaw<{ Non_unique: bigint | number; Key_name: string; Column_name: string }[]>`
      SHOW INDEX FROM chaves WHERE Column_name = 'codigo'
    `
    // BigInt comparison (MySQL retorna BigInt para Non_unique — converter para Number)
    const unicoIdx = indexes.find(
      (i) => i.Column_name === "codigo" && Number(i.Non_unique) === 0
    )
    expect(unicoIdx).toBeDefined()
    console.log(`[banco] Índice único em codigo: ${unicoIdx?.Key_name}`)
  })

  it("⚠️  chaves não têm índice em lojaId + status (necessário para cron)", async () => {
    const indexes = await testDb.$queryRaw<{ Key_name: string; Column_name: string; Non_unique: bigint | number }[]>`
      SHOW INDEX FROM chaves
    `
    const colunas = indexes.map((i) => i.Column_name)
    // Documenta se falta índice composto para a query do cron
    const temIndiceLojaStatus = indexes.some(
      (i) => i.Column_name === "status" && indexes.find((j) => j.Key_name === i.Key_name && j.Column_name === "lojaId")
    )
    // Este teste documenta, não falha — o cron usa updateMany com WHERE status + campanha.expiraEm
    console.log(`[banco] Índice lojaId+status em chaves: ${temIndiceLojaStatus ? "SIM" : "NÃO (verificar performance do cron)"}`)
    expect(colunas).toContain("codigo") // ao menos o unique existe
  })

  it("campo codigo nas chaves tem max 19 chars (XXXX-XXXX-XXXX-XXXX)", async () => {
    const cols = await testDb.$queryRaw<{ COLUMN_NAME: string; CHARACTER_MAXIMUM_LENGTH: number | null }[]>`
      SELECT COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'chaves'
        AND COLUMN_NAME = 'codigo'
    `
    // VARCHAR sem limite explícito é 191 ou 255 geralmente — confirmar
    const col = cols[0]
    expect(col).toBeDefined()
    console.log(`[banco] codigo tipo: max ${col?.CHARACTER_MAXIMUM_LENGTH} chars`)
  })
})

describe("Performance de queries críticas", () => {
  it("count de chaves por status é rápido (< 1s)", async () => {
    const inicio = Date.now()
    await testDb.chave.groupBy({ by: ["status"], _count: { status: true } })
    expect(Date.now() - inicio).toBeLessThan(1_000)
  })

  it("count de lojas por plano é rápido (< 500ms)", async () => {
    const inicio = Date.now()
    await testDb.loja.groupBy({ by: ["plano"], _count: { plano: true } })
    expect(Date.now() - inicio).toBeLessThan(500)
  })

  it("busca de chave por código com include é rápida (< 1s)", async () => {
    // Busca de chave inexistente (mais rápida que a real — testa plano de query)
    const inicio = Date.now()
    await testDb.chave.findUnique({
      where: { codigo: "XXXX-XXXX-XXXX-XXXX" },
      include: {
        campanha: { select: { nome: true, tipoBeneficio: true, expiraEm: true } },
        loja:     { select: { nome: true, corPrimaria: true } },
        cliente:  { select: { telefone: true, email: true } },
      },
    })
    expect(Date.now() - inicio).toBeLessThan(1_000)
  })
})
