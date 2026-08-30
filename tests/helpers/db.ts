/**
 * tests/helpers/db.ts
 * Helpers para criação e limpeza de dados de teste no banco real.
 * TODAS as entidades usam o prefixo TEST_ para não poluir dados reais.
 */
import { PrismaClient } from "@/generated/prisma"
import crypto from "crypto"

export const testDb = new PrismaClient({
  log: [], // silencia logs no output de teste
})

const PREFIX = () => process.env.TEST_PREFIX ?? `TEST_${Date.now()}_`

// ─── Geração de dados ────────────────────────────────────────────────────────

export function testEmail(suffix?: string) {
  return `${PREFIX()}${suffix ?? crypto.randomUUID()}@test.courtesyfy.internal`
}

export function uniqueId() {
  return `${PREFIX()}${crypto.randomUUID().slice(0, 8)}`
}

/** Cria uma loja de teste com usuário admin vinculado */
export async function criarLojaTest(override?: Partial<Parameters<typeof testDb.loja.create>[0]["data"]>) {
  const suffix = uniqueId()

  const user = await testDb.user.create({
    data: {
      email:         testEmail(`admin_${suffix}`),
      emailVerified: new Date(),
      name:          `Admin Test ${suffix}`,
      role:          "LOJISTA",
    },
  })

  const loja = await testDb.loja.create({
    data: {
      nome:         `Loja Test ${suffix}`,
      nomeExibicao: `Loja Test ${suffix}`,
      email:        testEmail(`loja_${suffix}`),
      plano:        "ESSENCIAL",
      status:       "ATIVA",
      ...override,
      usuarios: { connect: { id: user.id } },
    },
  })

  // Vincular lojaId ao user
  await testDb.user.update({
    where: { id: user.id },
    data:  { lojaId: loja.id },
  })

  return { loja, user }
}

/** Cria uma campanha de teste */
export async function criarCampanhaTest(
  lojaId:   string,
  userId:   string,
  override?: Record<string, unknown>
) {
  const suffix = uniqueId()
  return testDb.campanha.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      lojaId,
      criadoPorId:     userId,
      nome:            `Campanha Test ${suffix}`,
      tipoBeneficio:   "DESCONTO_PERCENTUAL",
      valorBeneficio:  10,
      quantidadeChaves: 100,
      inicioEm:        new Date(),
      expiraEm:        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
      status:          "ATIVA",
      ...override,
    } as any,
  })
}

/** Cria um lote de chaves de teste */
export async function criarLoteTest(campanhaId: string, lojaId: string, qtd = 5) {
  const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const gerarCodigo = () => {
    const bytes = crypto.randomBytes(16)
    const groups: string[] = []
    for (let g = 0; g < 4; g++) {
      let group = ""
      for (let i = 0; i < 4; i++) group += CHARSET[bytes[g * 4 + i] % CHARSET.length]
      groups.push(group)
    }
    return groups.join("-")
  }

  const codigos = new Set<string>()
  while (codigos.size < qtd) codigos.add(gerarCodigo())

  return testDb.loteChave.create({
    data: {
      campanhaId,
      lojaId,
      quantidade: qtd,
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
    include: { chaves: true },
  })
}

/** Cria um cliente de teste */
export async function criarClienteTest() {
  return testDb.cliente.create({
    data: {
      email:      testEmail("cliente"),
      nome:       `Cliente Test ${uniqueId()}`,
      telefone:   `(11) 9${Math.floor(10000000 + Math.random() * 89999999)}`,
      canalOrigem: "WEB",
    },
  })
}

// ─── Limpeza ─────────────────────────────────────────────────────────────────

/**
 * Remove os dados de teste do banco criados nesta execução de testes.
 * Usa o TEST_PREFIX único desta sessão para não apagar dados de outros workers paralelos.
 */
export async function limparDadosTeste() {
  // Usa o prefixo específico desta execução (ex: "TEST_1716220800000_")
  // Em vez de "TEST_" genérico, evitando interferência entre workers paralelos
  const prefix = process.env.TEST_PREFIX ?? "TEST_"

  // Ordem respeitando dependências (sem FK no Prisma mode)
  await testDb.logEvento.deleteMany({
    where: { loja: { email: { startsWith: prefix } } },
  }).catch(() => {})

  await testDb.resgate.deleteMany({
    where: { loja: { email: { startsWith: prefix } } },
  }).catch(() => {})

  await testDb.chave.deleteMany({
    where: { loja: { email: { startsWith: prefix } } },
  }).catch(() => {})

  await testDb.loteChave.deleteMany({
    where: { loja: { email: { startsWith: prefix } } },
  }).catch(() => {})

  await testDb.campanha.deleteMany({
    where: { loja: { email: { startsWith: prefix } } },
  }).catch(() => {})

  await testDb.authToken.deleteMany({
    where: { user: { email: { startsWith: prefix } } },
  }).catch(() => {})

  await testDb.loja.deleteMany({
    where: { email: { startsWith: prefix } },
  }).catch(() => {})

  await testDb.user.deleteMany({
    where: { email: { startsWith: prefix } },
  }).catch(() => {})

  // Clientes sem lojaId (tabela independente)
  await testDb.cliente.deleteMany({
    where: { email: { startsWith: prefix } },
  }).catch(() => {})
}

/** Fecha conexão do testDb */
export async function fecharDb() {
  await testDb.$disconnect()
}
