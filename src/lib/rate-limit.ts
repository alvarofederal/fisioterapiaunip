// src/lib/rate-limit.ts
//
// Limitador de tentativas em memória, por instância de função.
//
// LIMITAÇÃO CONHECIDA: em serverless cada instância tem a sua própria memória,
// então o limite real é "N tentativas por instância", não "N no total". Para o
// tamanho de uma turma isso basta, e evita depender de um Redis externo. Se um
// dia o portal abrir para fora, troque por um contador compartilhado
// (Upstash/Redis) — a assinatura desta função não precisa mudar.

type Registro = { contagem: number; expiraEm: number }

const memoria = new Map<string, Registro>()

/** Remove chaves vencidas para a memória não crescer sem limite. */
function limpar(agora: number) {
  for (const [chave, registro] of memoria) {
    if (registro.expiraEm < agora) memoria.delete(chave)
  }
}

export async function checkRateLimit(
  identificador: string,
  maxTentativas = 5,
  janelaMs = 15 * 60 * 1000
): Promise<{ allowed: boolean; remaining: number }> {
  const agora = Date.now()

  if (memoria.size > 500) limpar(agora)

  const registro = memoria.get(identificador)

  if (!registro || registro.expiraEm < agora) {
    memoria.set(identificador, { contagem: 1, expiraEm: agora + janelaMs })
    return { allowed: true, remaining: maxTentativas - 1 }
  }

  registro.contagem++

  return {
    allowed: registro.contagem <= maxTentativas,
    remaining: Math.max(0, maxTentativas - registro.contagem),
  }
}

export async function resetRateLimit(identificador: string): Promise<void> {
  memoria.delete(identificador)
}
