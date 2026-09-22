// src/lib/porta-de-rota.ts
import "server-only"

import { redirect } from "next/navigation"
import prisma from "./prisma"
import { auth } from "./auth"
import { lerConfiguracoes } from "./configuracoes-servidor"
import type { ChaveConfiguracao } from "./configuracoes"

/**
 * Portão de entrada das rotas que o ADMIN pode desligar.
 *
 * Existe porque esconder o item do menu não é proteção: o endereço continua
 * digitável, e quem já tiver a página aberta continua navegando. A checagem
 * tem que estar na rota.
 *
 * O ADMIN nunca é barrado. Se ele desligasse "Meus estudos" e perdesse o
 * acesso junto, não teria como religar de dentro do portal.
 *
 * Devolve o id de quem está logado, que toda página em seguida usa para
 * filtrar o que é dela.
 */
export async function exigirRotaLiberada(
  chave: ChaveConfiguracao
): Promise<{ usuarioId: string; ehAdmin: boolean }> {
  const sessao = await auth()
  if (!sessao?.user?.id) redirect("/login")

  const eu = await prisma.user.findUnique({
    where: { id: sessao.user.id },
    select: { role: true },
  })

  const ehAdmin = eu?.role === "ADMIN"
  if (ehAdmin) return { usuarioId: sessao.user.id, ehAdmin }

  const ligadas = await lerConfiguracoes()
  if (!ligadas[chave]) redirect("/painel?indisponivel=1")

  return { usuarioId: sessao.user.id, ehAdmin }
}
