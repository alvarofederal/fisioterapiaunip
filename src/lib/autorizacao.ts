// src/lib/autorizacao.ts
import "server-only"

import { auth } from "./auth"
import prisma from "./prisma"

export type Autorizado = {
  id: string
  nome: string
  role: "ADMIN" | "ALUNO"
}

/**
 * Confere quem está pedindo a ação, lendo o papel do BANCO.
 *
 * Nunca confie no papel gravado no JWT para autorizar escrita: o token carrega
 * o papel de quando a pessoa entrou. Um admin rebaixado — ou uma conta
 * desativada — continuaria passando até o token expirar, em 30 dias.
 */
export async function exigirAdmin(): Promise<
  { ok: true; usuario: Autorizado } | { ok: false; erro: string }
> {
  const sessao = await auth()
  if (!sessao?.user?.id) return { ok: false, erro: "Você precisa entrar no portal." }

  const usuario = await prisma.user.findUnique({
    where: { id: sessao.user.id },
    select: { id: true, nome: true, role: true, ativo: true },
  })

  if (!usuario?.ativo) return { ok: false, erro: "Sua conta não está ativa." }
  if (usuario.role !== "ADMIN") {
    return { ok: false, erro: "Só o administrador da turma pode fazer isso." }
  }

  return { ok: true, usuario: { id: usuario.id, nome: usuario.nome, role: usuario.role } }
}
