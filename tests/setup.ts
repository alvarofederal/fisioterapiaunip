/**
 * tests/setup.ts
 * Setup global para todos os testes.
 * Carrega variáveis de ambiente e garante limpeza do banco de teste.
 */
import { config } from "dotenv"
import path from "path"

// Carrega .env da raiz do projeto
config({ path: path.resolve(process.cwd(), ".env") })
config({ path: path.resolve(process.cwd(), ".env.local"), override: true })

// Prefixo para dados de teste — facilita limpeza
process.env.TEST_PREFIX = `TEST_${Date.now()}_`
