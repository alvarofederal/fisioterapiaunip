"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { exigirAdmin } from "@/lib/autorizacao"
import { ehChaveValida } from "@/lib/configuracoes"

export type Resultado = { ok: true } | { ok: false; erro: string }

/**
 * Liga ou desliga uma chave. Só o ADMIN — é o controle da turma inteira.
 *
 * A chave é validada contra o vocabulário antes de tocar no banco: sem isso,
 * um POST forjado encheria a tabela de linhas que nenhuma tela lê.
 */
export async function alternarConfiguracao(
  chave: string,
  ativo: boolean
): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  if (!ehChaveValida(chave)) {
    return { ok: false, erro: "Opção desconhecida." }
  }

  if (typeof ativo !== "boolean") {
    return { ok: false, erro: "Valor inválido." }
  }

  try {
    await prisma.configuracao.upsert({
      where: { chave },
      update: { ativo },
      create: { chave, ativo },
    })
  } catch (erro) {
    console.error("Falha ao salvar configuração:", erro)
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." }
  }

  // O menu vive no layout do painel, então toda rota sob ele precisa ser
  // revalidada — senão a opção só apareceria no próximo acesso direto.
  revalidatePath("/painel", "layout")
  revalidatePath("/noticias")
  revalidatePath("/register")
  return { ok: true }
}
