"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { exigirAdmin } from "@/lib/autorizacao"

export type Resultado = { ok: true } | { ok: false; erro: string }

const estudoSchema = z.object({
  status: z.enum(["A_ESTUDAR", "ESTUDANDO", "REVISADO"]),
  anotacoes: z.string().trim().max(5000, "As anotações podem ter até 5000 caracteres"),
})

/**
 * Salva o acompanhamento de estudo de QUEM ESTÁ LOGADO sobre um encontro.
 *
 * Não é ação de ADMIN: cada pessoa registra o próprio estudo. O `upsert` na
 * chave (aula, usuário) garante um registro por pessoa por encontro, sem
 * precisar saber se já existia.
 */
export async function salvarEstudo(
  aulaId: string,
  dadosBrutos: unknown
): Promise<Resultado> {
  const sessao = await auth()
  if (!sessao?.user?.id) return { ok: false, erro: "Você precisa entrar no portal." }

  const validacao = estudoSchema.safeParse(dadosBrutos)
  if (!validacao.success) {
    return { ok: false, erro: validacao.error.issues[0].message }
  }

  const { status, anotacoes } = validacao.data

  const aula = await prisma.aula.findUnique({ where: { id: aulaId }, select: { id: true } })
  if (!aula) return { ok: false, erro: "Encontro não encontrado." }

  // Só carimba a revisão na primeira vez que o estudo chega em REVISADO.
  const atual = await prisma.estudo.findUnique({
    where: { aulaId_usuarioId: { aulaId, usuarioId: sessao.user.id } },
    select: { status: true, revisadoEm: true },
  })

  const revisadoEm =
    status === "REVISADO" ? (atual?.revisadoEm ?? new Date()) : null

  try {
    await prisma.estudo.upsert({
      where: { aulaId_usuarioId: { aulaId, usuarioId: sessao.user.id } },
      update: { status, anotacoes: anotacoes || null, revisadoEm },
      create: {
        aulaId,
        usuarioId: sessao.user.id,
        status,
        anotacoes: anotacoes || null,
        revisadoEm,
      },
    })
  } catch (erro) {
    console.error("Falha ao salvar estudo:", erro)
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." }
  }

  revalidatePath("/painel/cronograma")
  revalidatePath("/painel")
  return { ok: true }
}

const conteudoSchema = z
  .string()
  .trim()
  .max(2000, "O conteúdo pode ter até 2000 caracteres")

/** O que será visto no encontro — informação da turma, então só o ADMIN escreve. */
export async function salvarConteudoAula(
  aulaId: string,
  conteudoBruto: unknown
): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  const validacao = conteudoSchema.safeParse(conteudoBruto)
  if (!validacao.success) {
    return { ok: false, erro: validacao.error.issues[0].message }
  }

  try {
    await prisma.aula.update({
      where: { id: aulaId },
      data: { conteudo: validacao.data || null },
    })
  } catch (erro) {
    console.error("Falha ao salvar conteúdo:", erro)
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." }
  }

  revalidatePath("/painel/cronograma")
  return { ok: true }
}

const aulaSchema = z.object({
  materiaId: z.string().min(1, "Escolha a matéria"),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida").or(z.literal("")),
  horaFim: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida").or(z.literal("")),
  conteudo: z.string().trim().max(2000).optional().or(z.literal("")),
})

export async function criarAula(dadosBrutos: unknown): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  const validacao = aulaSchema.safeParse(dadosBrutos)
  if (!validacao.success) {
    return { ok: false, erro: validacao.error.issues[0].message }
  }

  const { materiaId, data, horaInicio, horaFim, conteudo } = validacao.data
  // Meio-dia UTC: evita que o fuso empurre a data para o dia anterior.
  const dataEncontro = new Date(`${data}T12:00:00.000Z`)

  const jaExiste = await prisma.aula.findFirst({
    where: { materiaId, data: dataEncontro },
    select: { id: true },
  })
  if (jaExiste) {
    return { ok: false, erro: "Já existe um encontro dessa matéria nessa data." }
  }

  try {
    await prisma.aula.create({
      data: {
        materiaId,
        data: dataEncontro,
        horaInicio: horaInicio || null,
        horaFim: horaFim || null,
        conteudo: conteudo || null,
      },
    })
  } catch (erro) {
    console.error("Falha ao criar encontro:", erro)
    return { ok: false, erro: "Não foi possível criar. Tente de novo." }
  }

  revalidatePath("/painel/cronograma")
  return { ok: true }
}

/** Excluir o encontro leva junto as anotações de estudo de todo mundo (cascade). */
export async function excluirAula(aulaId: string): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  try {
    await prisma.aula.delete({ where: { id: aulaId } })
  } catch (erro) {
    console.error("Falha ao excluir encontro:", erro)
    return { ok: false, erro: "Não foi possível excluir. Tente de novo." }
  }

  revalidatePath("/painel/cronograma")
  return { ok: true }
}
