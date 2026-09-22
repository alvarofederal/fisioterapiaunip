"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { exigirAdmin } from "@/lib/autorizacao"
import {
  unidadeSchema,
  teleaulaSchema,
  progressoUnidadeSchema,
  estudoTeleaulaSchema,
  progressoAtividadeSchema,
} from "@/lib/validators/unidade"
import { sanitizarHtml } from "@/lib/sanitizar"
import { htmlTemConteudo } from "@/lib/unidades"
import { configuracaoLigada } from "@/lib/configuracoes-servidor"

export type Resultado = { ok: true } | { ok: false; erro: string }

/**
 * Duas famílias de ação convivem neste arquivo, e a diferença é o ponto todo
 * do modelo:
 *
 * Unidade e teleaula são ESTRUTURA — vêm da UNIP, valem para a turma inteira
 * e só o ADMIN mexe.
 *
 * Progresso e resumo são de QUEM ESTÁ LOGADO. Não passam por `exigirAdmin`,
 * e nenhuma delas aceita um id de usuário vindo do cliente: o dono é sempre a
 * sessão. Aceitar `usuarioId` de fora deixaria um aluno marcar a unidade de
 * outro.
 */

function revalidar(materiaId: string) {
  revalidatePath(`/painel/materias/${materiaId}`)
  revalidatePath(`/painel/materias/${materiaId}/revisao`)
  revalidatePath("/painel/materias")
}

// ─── Estrutura: da turma ou de cada aluno ────────────────────────

/**
 * Quem pode mexer nesta unidade.
 *
 * Sem dono é currículo da turma: só o ADMIN altera, todo mundo enxerga.
 * Com dono é organização de estudo particular: só o dono altera — nem o
 * ADMIN, pelo mesmo motivo pelo qual ele não edita o resumo de ninguém.
 *
 * A teleaula não tem dono próprio: herda o da unidade em que está. Por isso
 * toda checagem de teleaula passa por aqui, pela unidade dela.
 */
async function permissaoNaUnidade(unidadeId: string, usuarioId: string) {
  const unidade = await prisma.unidade.findUnique({
    where: { id: unidadeId },
    select: { id: true, donoId: true, materiaId: true },
  })
  if (!unidade) return { ok: false as const, erro: "Unidade não encontrada." }

  if (unidade.donoId === null) {
    const admin = await exigirAdmin()
    if (!admin.ok) {
      return { ok: false as const, erro: "Só o administrador altera as unidades da turma." }
    }
    return { ok: true as const, unidade }
  }

  if (unidade.donoId !== usuarioId) {
    return { ok: false as const, erro: "Esta unidade é de outro aluno." }
  }
  return { ok: true as const, unidade }
}

/**
 * Cria a unidade. ADMIN cria a da turma; aluno cria a dele.
 *
 * Não é ação exclusiva de ADMIN de propósito: o aluno monta as próprias
 * unidades dentro das matérias que o ADMIN cadastrou. O que ele cria nasce
 * com dono e não aparece para mais ninguém.
 */
export async function criarUnidade(dadosBrutos: unknown): Promise<Resultado> {
  const quem = await alunoAtivo()
  if (!quem.ok) return { ok: false, erro: quem.erro }

  const validacao = unidadeSchema.safeParse(dadosBrutos)
  if (!validacao.success) return { ok: false, erro: validacao.error.issues[0].message }

  const { materiaId, numero, titulo, quantidadeTeleaulas } = validacao.data

  const admin = await exigirAdmin()
  const ehAdmin = admin.ok

  // Aluno só monta a própria estrutura se o ADMIN deixou ligado.
  if (!ehAdmin && !(await configuracaoLigada("aluno_cria_unidades"))) {
    return { ok: false, erro: "O administrador desligou a criação de unidades próprias." }
  }

  const materia = await prisma.materia.findUnique({
    where: { id: materiaId },
    select: { id: true },
  })
  if (!materia) return { ok: false, erro: "Matéria não encontrada." }

  const donoId = ehAdmin ? null : quem.usuarioId

  const jaExiste = await prisma.unidade.findFirst({
    where: { materiaId, numero, donoId },
    select: { id: true },
  })
  if (jaExiste) {
    return {
      ok: false,
      erro: ehAdmin
        ? `Já existe a Unidade ${numero} da turma nesta matéria.`
        : `Você já tem a Unidade ${numero} nesta matéria.`,
    }
  }

  try {
    // As teleaulas nascem junto: a unidade do AVA praticamente nunca vem
    // vazia, e criar uma a uma seria digitar quatro vezes o óbvio.
    await prisma.unidade.create({
      data: {
        materiaId,
        numero,
        titulo: titulo || null,
        donoId,
        teleaulas: {
          create: Array.from({ length: quantidadeTeleaulas }, (_, i) => ({ numero: i + 1 })),
        },
      },
    })
  } catch (erro) {
    console.error("Falha ao criar unidade:", erro)
    return { ok: false, erro: "Não foi possível criar. Tente de novo." }
  }

  revalidar(materiaId)
  return { ok: true }
}

export async function atualizarUnidade(
  unidadeId: string,
  titulo: string
): Promise<Resultado> {
  const quem = await alunoAtivo()
  if (!quem.ok) return { ok: false, erro: quem.erro }

  const permissao = await permissaoNaUnidade(unidadeId, quem.usuarioId)
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  const limpo = String(titulo ?? "").trim()
  if (limpo.length > 120) return { ok: false, erro: "O título pode ter no máximo 120 caracteres" }

  try {
    await prisma.unidade.update({ where: { id: unidadeId }, data: { titulo: limpo || null } })
  } catch (erro) {
    console.error("Falha ao atualizar unidade:", erro)
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." }
  }

  revalidar(permissao.unidade.materiaId)
  return { ok: true }
}

/**
 * Excluir a unidade leva junto as teleaulas e os resumos escritos nelas.
 *
 * Na unidade da turma isso atinge TODA a turma; na unidade própria, só o
 * dono. A tela avisa qual dos dois casos é antes de confirmar.
 */
export async function excluirUnidade(unidadeId: string): Promise<Resultado> {
  const quem = await alunoAtivo()
  if (!quem.ok) return { ok: false, erro: quem.erro }

  const permissao = await permissaoNaUnidade(unidadeId, quem.usuarioId)
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  try {
    await prisma.unidade.delete({ where: { id: unidadeId } })
  } catch (erro) {
    console.error("Falha ao excluir unidade:", erro)
    return { ok: false, erro: "Não foi possível excluir. Tente de novo." }
  }

  revalidar(permissao.unidade.materiaId)
  return { ok: true }
}

export async function criarTeleaula(dadosBrutos: unknown): Promise<Resultado> {
  const quem = await alunoAtivo()
  if (!quem.ok) return { ok: false, erro: quem.erro }

  const validacao = teleaulaSchema.safeParse(dadosBrutos)
  if (!validacao.success) return { ok: false, erro: validacao.error.issues[0].message }

  const { unidadeId, numero, titulo } = validacao.data

  // A teleaula herda o dono da unidade, então a permissão é a da unidade.
  const permissao = await permissaoNaUnidade(unidadeId, quem.usuarioId)
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  const jaExiste = await prisma.teleaula.findFirst({
    where: { unidadeId, numero },
    select: { id: true },
  })
  if (jaExiste) return { ok: false, erro: `Já existe a Teleaula ${numero} nesta unidade.` }

  try {
    await prisma.teleaula.create({ data: { unidadeId, numero, titulo: titulo || null } })
  } catch (erro) {
    console.error("Falha ao criar teleaula:", erro)
    return { ok: false, erro: "Não foi possível criar. Tente de novo." }
  }

  revalidar(permissao.unidade.materiaId)
  return { ok: true }
}

/** Excluir a teleaula apaga o resumo escrito nela. */
export async function excluirTeleaula(teleaulaId: string): Promise<Resultado> {
  const quem = await alunoAtivo()
  if (!quem.ok) return { ok: false, erro: quem.erro }

  const teleaula = await prisma.teleaula.findUnique({
    where: { id: teleaulaId },
    select: { unidadeId: true },
  })
  if (!teleaula) return { ok: false, erro: "Teleaula não encontrada." }

  const permissao = await permissaoNaUnidade(teleaula.unidadeId, quem.usuarioId)
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  try {
    await prisma.teleaula.delete({ where: { id: teleaulaId } })
  } catch (erro) {
    console.error("Falha ao excluir teleaula:", erro)
    return { ok: false, erro: "Não foi possível excluir. Tente de novo." }
  }

  revalidar(permissao.unidade.materiaId)
  return { ok: true }
}

// ─── Progresso (de cada aluno) ───────────────────────────────────

/** A sessão ativa, ou o motivo de não poder gravar. */
async function alunoAtivo() {
  const sessao = await auth()
  if (!sessao?.user?.id) return { ok: false as const, erro: "Você precisa entrar no portal." }

  const eu = await prisma.user.findUnique({
    where: { id: sessao.user.id },
    select: { id: true, ativo: true },
  })
  if (!eu?.ativo) return { ok: false as const, erro: "Sua conta não está ativa." }

  return { ok: true as const, usuarioId: eu.id }
}

export async function salvarProgressoUnidade(
  unidadeId: string,
  dadosBrutos: unknown
): Promise<Resultado> {
  const quem = await alunoAtivo()
  if (!quem.ok) return { ok: false, erro: quem.erro }

  const validacao = progressoUnidadeSchema.safeParse(dadosBrutos)
  if (!validacao.success) return { ok: false, erro: validacao.error.issues[0].message }

  const unidade = await prisma.unidade.findUnique({
    where: { id: unidadeId },
    select: { materiaId: true },
  })
  if (!unidade) return { ok: false, erro: "Unidade não encontrada." }

  try {
    await prisma.progressoUnidade.upsert({
      where: { unidadeId_usuarioId: { unidadeId, usuarioId: quem.usuarioId } },
      update: validacao.data,
      create: { unidadeId, usuarioId: quem.usuarioId, ...validacao.data },
    })
  } catch (erro) {
    console.error("Falha ao salvar progresso da unidade:", erro)
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." }
  }

  revalidar(unidade.materiaId)
  return { ok: true }
}

export async function salvarEstudoTeleaula(
  teleaulaId: string,
  dadosBrutos: unknown
): Promise<Resultado> {
  const quem = await alunoAtivo()
  if (!quem.ok) return { ok: false, erro: quem.erro }

  const validacao = estudoTeleaulaSchema.safeParse(dadosBrutos)
  if (!validacao.success) return { ok: false, erro: validacao.error.issues[0].message }

  const teleaula = await prisma.teleaula.findUnique({
    where: { id: teleaulaId },
    select: { unidade: { select: { materiaId: true } } },
  })
  if (!teleaula) return { ok: false, erro: "Teleaula não encontrada." }

  const { status } = validacao.data

  // Limpa na ENTRADA: o que está gravado já é seguro para qualquer tela que
  // leia esse campo depois, inclusive uma que ainda não existe.
  const limpo = sanitizarHtml(validacao.data.anotacoes)
  const anotacoes = htmlTemConteudo(limpo) ? limpo : null

  try {
    await prisma.estudoTeleaula.upsert({
      where: { teleaulaId_usuarioId: { teleaulaId, usuarioId: quem.usuarioId } },
      update: { status, anotacoes },
      create: { teleaulaId, usuarioId: quem.usuarioId, status, anotacoes },
    })
  } catch (erro) {
    console.error("Falha ao salvar resumo da teleaula:", erro)
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." }
  }

  revalidar(teleaula.unidade.materiaId)
  return { ok: true }
}

/** Carimbo e correção do trabalho presencial — também por aluno. */
export async function salvarProgressoAtividade(
  atividadeId: string,
  dadosBrutos: unknown
): Promise<Resultado> {
  const quem = await alunoAtivo()
  if (!quem.ok) return { ok: false, erro: quem.erro }

  const validacao = progressoAtividadeSchema.safeParse(dadosBrutos)
  if (!validacao.success) return { ok: false, erro: validacao.error.issues[0].message }

  const atividade = await prisma.atividade.findUnique({
    where: { id: atividadeId },
    select: { id: true },
  })
  if (!atividade) return { ok: false, erro: "Atividade não encontrada." }

  try {
    await prisma.progressoAtividade.upsert({
      where: { atividadeId_usuarioId: { atividadeId, usuarioId: quem.usuarioId } },
      update: validacao.data,
      create: { atividadeId, usuarioId: quem.usuarioId, ...validacao.data },
    })
  } catch (erro) {
    console.error("Falha ao salvar carimbo/correção:", erro)
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." }
  }

  revalidatePath("/painel/atividades")
  revalidatePath("/painel")
  return { ok: true }
}
