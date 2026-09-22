"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { exigirAdmin } from "@/lib/autorizacao"

export type Resultado = { ok: true } | { ok: false; erro: string }

/**
 * Guarda contra o portal ficar sem dono.
 *
 * Um ADMIN que se desativa, se rebaixa ou se exclui perde o acesso à própria
 * tela de Usuários — e, se for o último, ninguém mais consegue liberar conta
 * nenhuma. O banco teria que ser corrigido na mão.
 */
async function impedirFicarSemAdmin(
  alvoId: string,
  meuId: string,
  acao: string
): Promise<string | null> {
  if (alvoId !== meuId) {
    // Mexer em outra pessoa só é problema se ela for o último ADMIN ativo.
    const alvo = await prisma.user.findUnique({
      where: { id: alvoId },
      select: { role: true, ativo: true },
    })
    if (alvo?.role !== "ADMIN" || !alvo.ativo) return null
  }

  const adminsAtivos = await prisma.user.count({
    where: { role: "ADMIN", ativo: true },
  })

  if (adminsAtivos <= 1) {
    return `Não dá para ${acao}: este é o único administrador ativo do portal.`
  }
  return null
}

export async function liberarAcesso(usuarioId: string): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  try {
    await prisma.user.update({ where: { id: usuarioId }, data: { ativo: true } })
  } catch (erro) {
    console.error("Falha ao liberar acesso:", erro)
    return { ok: false, erro: "Não foi possível liberar. Tente de novo." }
  }

  revalidatePath("/painel/usuarios")
  revalidatePath("/painel")
  return { ok: true }
}

export async function desativarAcesso(usuarioId: string): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  const bloqueio = await impedirFicarSemAdmin(usuarioId, permissao.usuario.id, "desativar")
  if (bloqueio) return { ok: false, erro: bloqueio }

  try {
    await prisma.user.update({ where: { id: usuarioId }, data: { ativo: false } })
  } catch (erro) {
    console.error("Falha ao desativar acesso:", erro)
    return { ok: false, erro: "Não foi possível desativar. Tente de novo." }
  }

  revalidatePath("/painel/usuarios")
  revalidatePath("/painel")
  return { ok: true }
}

const papelSchema = z.enum(["ADMIN", "ALUNO"])

export async function trocarPapel(usuarioId: string, papelBruto: unknown): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  const validacao = papelSchema.safeParse(papelBruto)
  if (!validacao.success) return { ok: false, erro: "Papel inválido." }

  if (validacao.data === "ALUNO") {
    const bloqueio = await impedirFicarSemAdmin(usuarioId, permissao.usuario.id, "rebaixar")
    if (bloqueio) return { ok: false, erro: bloqueio }
  }

  try {
    await prisma.user.update({ where: { id: usuarioId }, data: { role: validacao.data } })
  } catch (erro) {
    console.error("Falha ao trocar papel:", erro)
    return { ok: false, erro: "Não foi possível trocar o papel. Tente de novo." }
  }

  revalidatePath("/painel/usuarios")
  return { ok: true }
}

/**
 * Recusa um cadastro. Só serve para conta que nunca foi liberada — quem já
 * entrou pode ter criado matéria ou atividade, e apagar levaria isso junto.
 * Para esses, o caminho é desativar.
 */
export async function recusarCadastro(usuarioId: string): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  const alvo = await prisma.user.findUnique({
    where: { id: usuarioId },
    select: {
      ativo: true,
      _count: { select: { materiasCriadas: true, atividadesCriadas: true } },
    },
  })
  if (!alvo) return { ok: false, erro: "Conta não encontrada." }

  if (alvo.ativo) {
    return { ok: false, erro: "Esta conta já foi liberada. Desative em vez de recusar." }
  }
  if (alvo._count.materiasCriadas > 0 || alvo._count.atividadesCriadas > 0) {
    return { ok: false, erro: "Esta conta já publicou conteúdo. Desative em vez de recusar." }
  }

  try {
    await prisma.user.delete({ where: { id: usuarioId } })
  } catch (erro) {
    console.error("Falha ao recusar cadastro:", erro)
    return { ok: false, erro: "Não foi possível recusar. Tente de novo." }
  }

  revalidatePath("/painel/usuarios")
  return { ok: true }
}
