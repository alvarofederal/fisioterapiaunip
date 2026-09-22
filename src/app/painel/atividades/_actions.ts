"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { exigirAdmin } from "@/lib/autorizacao"
import { apagarArquivos } from "@/lib/cloudinary"
import { atividadeSchema } from "@/lib/validators/atividade"

export type Resultado =
  | { ok: true }
  | { ok: false; erro: string; campo?: string }

/** Meio-dia UTC: meia-noite viraria o dia anterior no Brasil. */
function paraData(iso?: string): Date | null {
  if (!iso) return null
  return new Date(`${iso}T12:00:00.000Z`)
}

function revalidarTelas() {
  revalidatePath("/painel/atividades")
  revalidatePath("/painel")
}

function dadosDoFormulario(validado: ReturnType<typeof atividadeSchema.parse>) {
  const campos = {
    tipo: validado.tipo,
    titulo: validado.titulo,
    descricao: validado.descricao || null,
    materiaId: validado.materiaId || null,
    entregaEm: paraData(validado.entregaEm),
    dataInicio: paraData(validado.dataInicio),
    dataFim: paraData(validado.dataFim),
    horaInicio: validado.horaInicio || null,
    horaFim: validado.horaFim || null,
    local: validado.local || null,
    linkExterno: validado.linkExterno || null,
    cargaHoraria: validado.cargaHoraria,
    integrantes: validado.integrantes || null,
  }
  return campos
}

export async function criarAtividade(dadosBrutos: unknown): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  const validacao = atividadeSchema.safeParse(dadosBrutos)
  if (!validacao.success) {
    const primeiro = validacao.error.issues[0]
    return { ok: false, erro: primeiro.message, campo: String(primeiro.path[0] ?? "") }
  }

  try {
    await prisma.atividade.create({
      data: {
        ...dadosDoFormulario(validacao.data),
        criadoPorId: permissao.usuario.id,
        anexos: { create: validacao.data.anexos },
      },
    })
  } catch (erro) {
    console.error("Falha ao criar atividade:", erro)
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." }
  }

  revalidarTelas()
  return { ok: true }
}

export async function atualizarAtividade(
  id: string,
  dadosBrutos: unknown
): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  const validacao = atividadeSchema.safeParse(dadosBrutos)
  if (!validacao.success) {
    const primeiro = validacao.error.issues[0]
    return { ok: false, erro: primeiro.message, campo: String(primeiro.path[0] ?? "") }
  }

  const existente = await prisma.atividade.findUnique({
    where: { id },
    select: { id: true, anexos: { select: { publicId: true, tipo: true } } },
  })
  if (!existente) return { ok: false, erro: "Atividade não encontrada." }

  const enviados = validacao.data.anexos
  const idsQueFicam = new Set(enviados.map((a) => a.publicId))
  const removidos = existente.anexos.filter((a) => !idsQueFicam.has(a.publicId))

  try {
    // Substitui a lista inteira: é mais simples de acertar do que casar item a
    // item, e o publicId dedupe garante que nada existente seja recriado.
    await prisma.$transaction([
      prisma.anexo.deleteMany({ where: { atividadeId: id } }),
      prisma.atividade.update({
        where: { id },
        data: {
          ...dadosDoFormulario(validacao.data),
          anexos: { create: enviados },
        },
      }),
    ])
  } catch (erro) {
    console.error("Falha ao atualizar atividade:", erro)
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." }
  }

  // O banco já está consistente; limpar o Cloudinary é faxina, não pode
  // derrubar a operação.
  if (removidos.length > 0) await apagarArquivos(removidos)

  revalidarTelas()
  return { ok: true }
}

/** Arquivar tira do mural sem apagar — o histórico da turma continua lá. */
export async function arquivarAtividade(id: string, arquivar: boolean): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  try {
    await prisma.atividade.update({
      where: { id },
      data: { arquivada: arquivar, arquivadaEm: arquivar ? new Date() : null },
    })
  } catch (erro) {
    console.error("Falha ao arquivar atividade:", erro)
    return { ok: false, erro: "Não foi possível arquivar. Tente de novo." }
  }

  revalidarTelas()
  return { ok: true }
}

/**
 * Clona para o ADMIN preencher rápido a partir de uma atividade parecida.
 * A cópia nasce sem data: repetir a data da original seria o erro mais provável.
 */
export async function clonarAtividade(id: string): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  const original = await prisma.atividade.findUnique({ where: { id } })
  if (!original) return { ok: false, erro: "Atividade não encontrada." }

  try {
    await prisma.atividade.create({
      data: {
        titulo: `${original.titulo} (cópia)`,
        descricao: original.descricao,
        tipo: original.tipo,
        materiaId: original.materiaId,
        local: original.local,
        linkExterno: original.linkExterno,
        cargaHoraria: original.cargaHoraria,
        integrantes: original.integrantes,
        horaInicio: original.horaInicio,
        horaFim: original.horaFim,
        criadoPorId: permissao.usuario.id,
      },
    })
  } catch (erro) {
    console.error("Falha ao clonar atividade:", erro)
    return { ok: false, erro: "Não foi possível clonar. Tente de novo." }
  }

  revalidarTelas()
  return { ok: true }
}

/** Excluir leva junto os anexos (cascade no banco). Arquivar é o caminho normal. */
export async function excluirAtividade(id: string): Promise<Resultado> {
  const permissao = await exigirAdmin()
  if (!permissao.ok) return { ok: false, erro: permissao.erro }

  const atividade = await prisma.atividade.findUnique({
    where: { id },
    select: { anexos: { select: { publicId: true, tipo: true } } },
  })
  if (!atividade) return { ok: false, erro: "Atividade não encontrada." }

  try {
    await prisma.atividade.delete({ where: { id } })
  } catch (erro) {
    console.error("Falha ao excluir atividade:", erro)
    return { ok: false, erro: "Não foi possível excluir. Tente de novo." }
  }

  // Sem isso os arquivos ficariam pagando espaço no Cloudinary para sempre,
  // sem nada no banco apontando para eles.
  if (atividade.anexos.length > 0) await apagarArquivos(atividade.anexos)

  revalidarTelas()
  return { ok: true }
}
