"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { exigirAdmin } from "@/lib/autorizacao"
import { dataDeEncontro } from "@/lib/datas"
import { sanitizarHtml } from "@/lib/sanitizar"
import { htmlTemConteudo } from "@/lib/unidades"
import { LIMITE_RESUMO } from "@/lib/validators/unidade"

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

const aulaDadaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .max(160, "O tema pode ter até 160 caracteres"),
  conteudo: z
    .string()
    .trim()
    .max(LIMITE_RESUMO, "A matéria da aula ficou grande demais."),
})

/**
 * A matéria dada no encontro: o tema e o conteúdo completo.
 *
 * É informação da turma, então só o ADMIN escreve — ao contrário do resumo da
 * teleaula, que é de cada aluno. O conteúdo é HTML do editor e por isso passa
 * pelo mesmo sanitizador: guardar HTML significa executá-lo na exibição, e
 * limpar na ENTRADA garante que o que está gravado já é seguro.
 */
export async function salvarConteudoAula(
  aulaId: string,
  dadosBrutos: unknown
): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  // Aceita a forma antiga (só o texto) para nao quebrar chamada existente.
  const entrada =
    typeof dadosBrutos === "string" ? { titulo: "", conteudo: dadosBrutos } : dadosBrutos

  const validacao = aulaDadaSchema.safeParse(entrada)
  if (!validacao.success) {
    return { ok: false, erro: validacao.error.issues[0].message }
  }

  const limpo = sanitizarHtml(validacao.data.conteudo)
  const conteudo = htmlTemConteudo(limpo) ? limpo : null

  try {
    await prisma.aula.update({
      where: { id: aulaId },
      data: { titulo: validacao.data.titulo || null, conteudo },
    })
  } catch (erro) {
    console.error("Falha ao salvar a aula:", erro)
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." }
  }

  const aula = await prisma.aula.findUnique({
    where: { id: aulaId },
    select: { materiaId: true },
  })

  revalidatePath("/painel/cronograma")
  if (aula) revalidatePath(`/painel/materias/${aula.materiaId}`)
  return { ok: true }
}

const aulaSchema = z.object({
  materiaId: z.string().min(1, "Escolha a matéria"),
  titulo: z.string().trim().max(160).optional().or(z.literal("")),
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

  const { materiaId, titulo, data, horaInicio, horaFim, conteudo } = validacao.data
  const dataEncontro = dataDeEncontro(data)

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
        titulo: titulo || null,
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

  const { materiaId, titulo, data, horaInicio, horaFim, conteudo } = validacao.data
  const dataEncontro = dataDeEncontro(data)

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
        titulo: titulo || null,
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

// ─── Permissão nos encontros ─────────────────────────────────────

/**
 * Quem pode mexer neste encontro.
 *
 * O cronograma é a agenda presencial da turma, então só o ADMIN altera. A
 * coluna `donoId` continua no banco, mas nenhuma ação a preenche desde que o
 * EaD por data saiu: o estudo de EaD virou Unidade e Teleaula dentro da
 * matéria. Um encontro com dono, se existisse, seria dado antigo — e a
 * checagem abaixo o trataria como privado, não como da turma.
 */
async function permissaoNaAula(aulaId: string, usuarioId: string) {
  const aula = await prisma.aula.findUnique({
    where: { id: aulaId },
    select: { id: true, donoId: true, modalidade: true },
  })
  if (!aula) return { ok: false as const, erro: "Encontro não encontrado." }

  if (aula.donoId !== null && aula.donoId !== usuarioId) {
    return { ok: false as const, erro: "Este encontro é de outro aluno." }
  }

  if (aula.donoId === null) {
    const admin = await exigirAdmin()
    if (!admin.ok) {
      return { ok: false as const, erro: "Só o administrador altera o cronograma da turma." }
    }
  }

  return { ok: true as const, aula }
}
