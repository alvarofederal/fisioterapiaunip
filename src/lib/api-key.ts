/**
 * src/lib/api-key.ts
 * Geração e verificação de API keys para integração externa (ex: PDVs, apps de loja).
 *
 * Formato:  cfy.<lojaId>.<HMAC-SHA256-base64url(lojaId, API_KEY_SECRET)>
 * Exemplo:  cfy.clxyz1234.aB3dE5fG...
 *
 * Não requer campo no banco — a key é derivada deterministicamente do lojaId.
 * Para revogar individualmente: seria necessário adicionar campo `apiKeyVersion` na Loja.
 * Para revogar todas as lojas: basta rotacionar API_KEY_SECRET no env.
 *
 * Uso:
 *   import { computeApiKey, verifyApiKey } from "@/lib/api-key"
 *
 *   const key = computeApiKey(lojaId)           // para exibir no dashboard
 *   const lojaId = verifyApiKey(bearerToken)    // null se inválida
 */
import { createHmac, timingSafeEqual } from "crypto"

function getSecret(): string {
  const s = process.env.API_KEY_SECRET
  if (!s) throw new Error("API_KEY_SECRET não configurado no ambiente")
  return s
}

/**
 * Gera a API key para uma loja.
 * Retorna uma string no formato: cfy.<lojaId>.<sig>
 */
export function computeApiKey(lojaId: string): string {
  const sig = createHmac("sha256", getSecret())
    .update(lojaId)
    .digest("base64url")
  return `cfy.${lojaId}.${sig}`
}

/**
 * Verifica uma API key e retorna o lojaId se válida.
 * Retorna null se a key for inválida, malformada ou com assinatura incorreta.
 * Usa comparação de tempo constante para evitar timing attacks.
 */
export function verifyApiKey(apiKey: string): string | null {
  if (!apiKey || typeof apiKey !== "string") return null

  // Remove prefixo "Bearer " se presente
  const raw = apiKey.startsWith("Bearer ") ? apiKey.slice(7) : apiKey

  // Formato esperado: cfy.<lojaId>.<sig>
  // lojaId é CUID (alfanumérico sem ponto), sig é base64url (alfanumérico + _-)
  const parts = raw.split(".")
  if (parts.length !== 3 || parts[0] !== "cfy") return null

  const [, lojaId, providedSig] = parts
  if (!lojaId || !providedSig) return null

  try {
    const expectedSig = createHmac("sha256", getSecret())
      .update(lojaId)
      .digest("base64url")

    const a = Buffer.from(expectedSig, "utf8")
    const b = Buffer.from(providedSig, "utf8")

    // Comprimentos diferentes → inválido (timingSafeEqual requer mesmo tamanho)
    if (a.length !== b.length) return null

    if (!timingSafeEqual(a, b)) return null

    return lojaId
  } catch {
    return null
  }
}
