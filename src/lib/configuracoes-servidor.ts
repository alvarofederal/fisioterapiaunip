// src/lib/configuracoes-servidor.ts
import "server-only"

import { cache } from "react"
import prisma from "./prisma"
import {
  montarConfiguracoes,
  padroes,
  type ChaveConfiguracao,
} from "./configuracoes"

/**
 * Lê as chaves ligadas e desligadas.
 *
 * `cache` do React deduplica a consulta dentro da mesma requisição: o layout
 * pergunta pelo menu, a página pergunta pela própria rota, e o banco é
 * consultado uma vez só. A MySQL é compartilhada e conexão é recurso escasso.
 *
 * Falha de leitura não derruba o portal — cai no padrão. Um erro de banco
 * transformando tudo em "desligado" deixaria a turma sem menu nenhum, que é
 * pior do que a configuração estar momentaneamente desatualizada.
 */
export const lerConfiguracoes = cache(
  async (): Promise<Record<ChaveConfiguracao, boolean>> => {
    try {
      const linhas = await prisma.configuracao.findMany({
        select: { chave: true, ativo: true },
      })
      return montarConfiguracoes(linhas)
    } catch (erro) {
      console.error("Falha ao ler configurações, usando os padrões:", erro)
      return padroes()
    }
  }
)

/** Atalho para uma chave só. */
export async function configuracaoLigada(chave: ChaveConfiguracao): Promise<boolean> {
  const todas = await lerConfiguracoes()
  return todas[chave]
}
