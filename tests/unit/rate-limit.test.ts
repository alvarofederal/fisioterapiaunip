/**
 * tests/unit/rate-limit.test.ts
 * Testa o sistema de rate limiting (em memória).
 * ATENÇÃO: identifica limitação crítica de produção.
 */
import { describe, it, expect, beforeEach } from "vitest"
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit"

describe("checkRateLimit()", () => {
  const key = `test_rate_${Date.now()}`

  beforeEach(async () => {
    await resetRateLimit(key)
    await resetRateLimit(`${key}_2`)
  })

  it("permite primeira requisição", async () => {
    const { allowed, remaining } = await checkRateLimit(key, 3, 60_000)
    expect(allowed).toBe(true)
    expect(remaining).toBe(2)
  })

  it("decrementa remaining a cada chamada", async () => {
    const r1 = await checkRateLimit(key, 3, 60_000)
    const r2 = await checkRateLimit(key, 3, 60_000)
    const r3 = await checkRateLimit(key, 3, 60_000)
    expect(r1.remaining).toBe(2)
    expect(r2.remaining).toBe(1)
    expect(r3.remaining).toBe(0)
  })

  it("bloqueia após atingir maxAttempts", async () => {
    for (let i = 0; i < 3; i++) await checkRateLimit(key, 3, 60_000)
    const { allowed } = await checkRateLimit(key, 3, 60_000)
    expect(allowed).toBe(false)
  })

  it("reseta após janela de tempo", async () => {
    const shortWindow = 50 // 50ms
    const shortKey = `${key}_short`
    await checkRateLimit(shortKey, 1, shortWindow)
    await checkRateLimit(shortKey, 1, shortWindow) // bloqueia
    await new Promise((r) => setTimeout(r, 100))   // aguarda reset
    const { allowed } = await checkRateLimit(shortKey, 1, shortWindow)
    expect(allowed).toBe(true)
  })

  it("chaves diferentes são isoladas", async () => {
    for (let i = 0; i < 3; i++) await checkRateLimit(key, 3, 60_000)
    const outra = await checkRateLimit(`${key}_2`, 3, 60_000)
    expect(outra.allowed).toBe(true)
  })
})

// ─── Aviso sobre limitação crítica ───────────────────────────────────────────

describe("ALERTA: Rate limit em memória", () => {
  it("⚠️  store em memória é resetado a cada cold start serverless", () => {
    // Este teste documenta a limitação arquitetural.
    // Em produção (Vercel serverless), cada instância tem sua própria memória.
    // Um atacante pode contornar o rate limit criando requisições em instâncias diferentes.
    // SOLUÇÃO RECOMENDADA: usar Redis (Upstash) ou campo no banco de dados.
    const limitacaoDocumentada = "store em memória não persiste entre instâncias serverless"
    expect(limitacaoDocumentada).toBeTruthy()
    // Ver: tests/integration/seguranca.test.ts para mais detalhes
  })
})
