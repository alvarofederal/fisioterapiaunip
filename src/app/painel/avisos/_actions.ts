"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { exigirAdmin } from "@/lib/autorizacao"
import { avisoSchema } from "@/lib/validators/aviso"
import { sanitizarHtml } from "@/lib/sanitizar"
import { htmlTemConteudo } from "@/lib/unidades"

export type Resultado =
  | { ok: true }
  | { ok: false; erro: string; campo?: string }

/**
 * Mural de avisos — recados fixos da turma.
 *
 * Tudo aqui é exclusivo do ADMIN: é voz oficial da representação, e um aviso
 * no topo da tela inicial tem o peso de comunicado. O aluno só lê.
 */

function revalidar() {
  revalidatePath("/painel/avisos")
  // O bloco de avisos abre a tela inicial, então ela também precisa cair.
  revalidatePath("/painel")
}

/** Valida e limpa. O HTML entra no banco já seguro para ser renderizado. */
function prepararDados(dadosBrutos: unknown) {
  const validacao = avisoSchema.safeParse(dadosBrutos)
  if (!validacao.success) {
    const primeiro = validacao.error.issues[0]
    return {
      ok: false as const,
      erro: primeiro.message,
      campo: String(primeiro.path[0] ?? ""),
    }
  }

  const conteudo = sanitizarHtml(validacao.data.conteudo)
  if (!htmlTemConteudo(conteudo)) {
    return { ok: false as const, erro: "Escreva o texto do aviso.", campo: "conteudo" }
  }

  return {
    ok: true as const,
    dados: {
      titulo: validacao.data.titulo,
      conteudo,
      ordem: validacao.data.ordem,
      ativo: validacao.data.ativo,
    },
  }
}

export async function criarAviso(dadosBrutos: unknown): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  const preparado = prepararDados(dadosBrutos)
  if (!preparado.ok) return preparado

  try {
    await prisma.aviso.create({
      data: { ...preparado.dados, criadoPorId: permissao.usuario.id },
    })
  } catch (erro) {
    console.error("Falha ao criar aviso:", erro)
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." }
  }

  revalidar()
  return { ok: true }
}

export async function atualizarAviso(
  id: string,
  dadosBrutos: unknown
): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  const preparado = prepararDados(dadosBrutos)
  if (!preparado.ok) return preparado

  const existente = await prisma.aviso.findUnique({ where: { id }, select: { id: true } })
  if (!existente) return { ok: false, erro: "Aviso não encontrado." }

  try {
    await prisma.aviso.update({ where: { id }, data: preparado.dados })
  } catch (erro) {
    console.error("Falha ao atualizar aviso:", erro)
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." }
  }

  revalidar()
  return { ok: true }
}

/** Desligar tira do mural sem apagar — o recado continua recuperável. */
export async function alternarAviso(id: string, ativo: boolean): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  try {
    await prisma.aviso.update({ where: { id }, data: { ativo } })
  } catch (erro) {
    console.error("Falha ao alternar aviso:", erro)
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." }
  }

  revalidar()
  return { ok: true }
}

/** Excluir é definitivo. Desligar é o caminho normal. */
export async function excluirAviso(id: string): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  try {
    await prisma.aviso.delete({ where: { id } })
  } catch (erro) {
    console.error("Falha ao excluir aviso:", erro)
    return { ok: false, erro: "Não foi possível excluir. Tente de novo." }
  }

  revalidar()
  return { ok: true }
}
