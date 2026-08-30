import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma"

const db = new PrismaClient()

async function main() {
  const tables = await db.$queryRaw<{TABLE_NAME: string}[]>`
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_NAME
  `
  console.log("TABLES:", tables.map(t => t.TABLE_NAME).join(", "))

  const idx = await db.$queryRaw<{Non_unique: number, Key_name: string, Column_name: string}[]>`
    SHOW INDEX FROM chaves WHERE Column_name = 'codigo'
  `
  console.log("INDEX codigo:", JSON.stringify(idx[0]))

  const authTokenCols = await db.$queryRaw<{TABLE_NAME: string}[]>`
    SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE '%token%' OR TABLE_NAME LIKE '%auth%'
  `
  console.log("Auth tables:", authTokenCols.map(t => t.TABLE_NAME))
}

main().catch(console.error).finally(() => db.$disconnect())
