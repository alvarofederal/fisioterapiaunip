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
  const sessao = await auth()
  if (!sessao?.user?.id) return { ok: false, erro: "Você precisa entrar no portal." }

  const permissao = await permissaoNaAula(aulaId, sessao.user.id)
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

/**
 * Corrige um encontro já criado: data, horário ou matéria.
 *
 * Existe para que data errada não precise virar exclusão. Excluir apaga em
 * cascata o `Estudo` de TODA a turma naquele encontro — as anotações de
 * revisão de cada um iriam junto, por causa de um erro de digitação do ADMIN.
 * Editar preserva tudo: o vínculo é o id, não a data.
 */
export async function atualizarAula(
  aulaId: string,
  dadosBrutos: unknown
): Promise<Resultado> {
  const sessao = await auth()
  if (!sessao?.user?.id) return { ok: false, erro: "Você precisa entrar no portal." }

  const permissao = await permissaoNaAula(aulaId, sessao.user.id)
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  const validacao = aulaSchema.safeParse(dadosBrutos)
  if (!validacao.success) {
    return { ok: false, erro: validacao.error.issues[0].message }
  }

  const existente = await prisma.aula.findUnique({
    where: { id: aulaId },
    select: { id: true },
  })
  if (!existente) return { ok: false, erro: "Encontro não encontrado." }

  const { materiaId, data, horaInicio, horaFim, conteudo } = validacao.data
  const dataEncontro = new Date(`${data}T12:00:00.000Z`)

  // Mesma matéria, mesma data, outro id = duplicata.
  const conflito = await prisma.aula.findFirst({
    where: { materiaId, data: dataEncontro, NOT: { id: aulaId } },
    select: { id: true },
  })
  if (conflito) {
    return { ok: false, erro: "Já existe outro encontro dessa matéria nessa data." }
  }

  try {
    await prisma.aula.update({
      where: { id: aulaId },
      data: {
        materiaId,
        data: dataEncontro,
        horaInicio: horaInicio || null,
        horaFim: horaFim || null,
        conteudo: conteudo || null,
      },
    })
  } catch (erro) {
    console.error("Falha ao atualizar encontro:", erro)
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." }
  }

  revalidatePath("/painel/cronograma")
  revalidatePath("/painel")
  return { ok: true }
}

// ─── Cronograma EaD, de cada aluno ───────────────────────────────

/**
 * Quem pode mexer neste encontro.
 *
 * Presencial (sem dono) é da turma: só o ADMIN altera.
 * EaD tem dono: só o dono altera — nem o ADMIN, porque é a agenda de estudo
 * particular daquela pessoa.
 */
async function permissaoNaAula(aulaId: string, usuarioId: string) {
  const aula = await prisma.aula.findUnique({
    where: { id: aulaId },
    select: { id: true, donoId: true, modalidade: true },
  })
  if (!aula) return { ok: false as const, erro: "Encontro não encontrado." }

  if (aula.donoId === null) {
    const admin = await exigirAdmin()
    if (!admin.ok) {
      return { ok: false as const, erro: "Só o administrador altera o cronograma da turma." }
    }
    return { ok: true as const, aula }
  }

  if (aula.donoId !== usuarioId) {
    return { ok: false as const, erro: "Este encontro de EaD é de outro aluno." }
  }
  return { ok: true as const, aula }
}

/**
 * Registra uma sessão de estudo EaD. Não é ação de ADMIN: cada aluno monta a
 * própria agenda das matérias do AVA, e só ele enxerga o que marcou.
 */
export async function criarAulaEaD(dadosBrutos: unknown): Promise<Resultado> {
  const sessao = await auth()
  if (!sessao?.user?.id) return { ok: false, erro: "Você precisa entrar no portal." }

  const eu = await prisma.user.findUnique({
    where: { id: sessao.user.id },
    select: { ativo: true },
  })
  if (!eu?.ativo) return { ok: false, erro: "Sua conta não está ativa." }

  const validacao = aulaSchema.safeParse(dadosBrutos)
  if (!validacao.success) {
    return { ok: false, erro: validacao.error.issues[0].message }
  }

  const { materiaId, data, horaInicio, horaFim, conteudo } = validacao.data

  // Só faz sentido marcar estudo próprio em matéria EaD: o presencial já tem
  // data definida pela faculdade.
  const materia = await prisma.materia.findUnique({
    where: { id: materiaId },
    select: { modalidade: true },
  })
  if (!materia) return { ok: false, erro: "Matéria não encontrada." }
  if (materia.modalidade !== "EAD") {
    return { ok: false, erro: "Esta matéria é presencial — o cronograma dela é da turma." }
  }

  const dataEncontro = new Date(`${data}T12:00:00.000Z`)

  const jaExiste = await prisma.aula.findFirst({
    where: { materiaId, data: dataEncontro, donoId: sessao.user.id },
    select: { id: true },
  })
  if (jaExiste) {
    return { ok: false, erro: "Você já marcou estudo dessa matéria nessa data." }
  }

  try {
    await prisma.aula.create({
      data: {
        materiaId,
        data: dataEncontro,
        horaInicio: horaInicio || null,
        horaFim: horaFim || null,
        conteudo: conteudo || null,
        modalidade: "EAD",
        donoId: sessao.user.id,
      },
    })
  } catch (erro) {
    console.error("Falha ao criar estudo EaD:", erro)
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." }
  }

  revalidatePath("/painel/cronograma")
  revalidatePath("/painel")
  return { ok: true }
}
