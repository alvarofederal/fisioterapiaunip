"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { exigirAdmin } from "@/lib/autorizacao"
import { materiaSchema } from "@/lib/validators/materia"

export type Resultado =
  | { ok: true }
  | { ok: false; erro: string; campo?: string }

/**
 * Toda ação aqui é exclusiva do ADMIN e valida a entrada com Zod antes de
 * tocar no banco. O aluno só lê.
 */

export async function criarMateria(dadosBrutos: unknown): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  const validacao = materiaSchema.safeParse(dadosBrutos)
  if (!validacao.success) {
    const primeiro = validacao.error.issues[0]
    return { ok: false, erro: primeiro.message, campo: String(primeiro.path[0] ?? "") }
  }

  const { nome, professor, diaSemana, anotacoes, cor } = validacao.data

  // Duas matérias com o mesmo nome confundem na hora de publicar trabalho.
  const jaExiste = await prisma.materia.findFirst({
    where: { nome, arquivada: false },
    select: { id: true },
  })
  if (jaExiste) {
    return { ok: false, erro: "Já existe uma matéria com esse nome.", campo: "nome" }
  }

  try {
    await prisma.materia.create({
      data: {
        nome,
        professor: professor || null,
        diaSemana,
        anotacoes: anotacoes || null,
        cor,
        criadoPorId: permissao.usuario.id,
      },
    })
  } catch (erro) {
    console.error("Falha ao criar matéria:", erro)
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." }
  }

  revalidatePath("/painel/materias")
  revalidatePath("/painel")
  return { ok: true }
}

export async function atualizarMateria(
  id: string,
  dadosBrutos: unknown
): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  const validacao = materiaSchema.safeParse(dadosBrutos)
  if (!validacao.success) {
    const primeiro = validacao.error.issues[0]
    return { ok: false, erro: primeiro.message, campo: String(primeiro.path[0] ?? "") }
  }

  const existente = await prisma.materia.findUnique({ where: { id }, select: { id: true } })
  if (!existente) return { ok: false, erro: "Matéria não encontrada." }

  const { nome, professor, diaSemana, anotacoes, cor } = validacao.data

  const duplicada = await prisma.materia.findFirst({
    where: { nome, arquivada: false, NOT: { id } },
    select: { id: true },
  })
  if (duplicada) {
    return { ok: false, erro: "Já existe outra matéria com esse nome.", campo: "nome" }
  }

  try {
    await prisma.materia.update({
      data: {
        nome,
        professor: professor || null,
        diaSemana,
        anotacoes: anotacoes || null,
        cor,
      },
      where: { id },
    })
  } catch (erro) {
    console.error("Falha ao atualizar matéria:", erro)
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." }
  }

  revalidatePath("/painel/materias")
  revalidatePath("/painel")
  return { ok: true }
}

/** Arquivar tira da lista sem apagar — as atividades ligadas continuam intactas. */
export async function arquivarMateria(id: string, arquivar: boolean): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  try {
    await prisma.materia.update({
      data: { arquivada: arquivar },
      where: { id },
    })
  } catch (erro) {
    console.error("Falha ao arquivar matéria:", erro)
    return { ok: false, erro: "Não foi possível arquivar. Tente de novo." }
  }

  revalidatePath("/painel/materias")
  revalidatePath("/painel")
  return { ok: true }
}

/**
 * Excluir de verdade. Só passa se não houver trabalho ligado: apagar a matéria
 * levaria junto o histórico da turma, e isso não se desfaz.
 */
export async function excluirMateria(id: string): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  const materia = await prisma.materia.findUnique({
    where: { id },
    select: { _count: { select: { atividades: true } } },
  })
  if (!materia) return { ok: false, erro: "Matéria não encontrada." }

  if (materia._count.atividades > 0) {
    return {
      ok: false,
      erro: `Esta matéria tem ${materia._count.atividades} ${
        materia._count.atividades === 1 ? "atividade publicada" : "atividades publicadas"
      }. Arquive em vez de excluir, para não perder o histórico.`,
    }
  }

  try {
    await prisma.materia.delete({ where: { id } })
  } catch (erro) {
    console.error("Falha ao excluir matéria:", erro)
    return { ok: false, erro: "Não foi possível excluir. Tente de novo." }
  }

  revalidatePath("/painel/materias")
  revalidatePath("/painel")
  return { ok: true }
}
