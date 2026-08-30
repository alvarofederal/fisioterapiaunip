"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"

const schema = z.object({
  campanhaOrigemId: z.string().min(1),
  campanhaDestinoId: z.string().min(1),
})

export type MigrarState = { error?: string; fieldErrors?: Record<string, string[]> }

export async function migrarChaves(
  _prev: MigrarState,
  formData: FormData,
): Promise<MigrarState> {
  const session = await auth()
  if (!session?.user?.lojaId) return { error: "Não autorizado" }

  const result = schema.safeParse({
    campanhaOrigemId:  formData.get("campanhaOrigemId"),
    campanhaDestinoId: formData.get("campanhaDestinoId"),
  })

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { campanhaOrigemId, campanhaDestinoId } = result.data

  if (campanhaOrigemId === campanhaDestinoId) {
    return { error: "A campanha de destino deve ser diferente da de origem." }
  }

  // ── Valida origem ────────────────────────────────────────────────
  const origem = await db.campanha.findUnique({
    where: { id: campanhaOrigemId },
    select: { lojaId: true, nome: true, expiraEm: true, status: true },
  })

  if (!origem || origem.lojaId !== session.user.lojaId) {
    return { error: "Campanha de origem não encontrada." }
  }

  const origemExpirada = new Date() > origem.expiraEm
  const origemEncerrada = origem.status === "ENCERRADA" || origem.status === "CANCELADA"

  if (!origemExpirada && !origemEncerrada) {
    return { error: "Só é possível migrar chaves de campanhas expiradas ou encerradas." }
  }

  // ── Valida destino ───────────────────────────────────────────────
  const destino = await db.campanha.findUnique({
    where: { id: campanhaDestinoId },
    select: { lojaId: true, nome: true, expiraEm: true, status: true, quantidadeChaves: true,
               _count: { select: { chaves: true } } },
  })

  if (!destino || destino.lojaId !== session.user.lojaId) {
    return { error: "Campanha de destino não encontrada." }
  }

  if (new Date() > destino.expiraEm) {
    return { error: "A campanha de destino também está expirada. Escolha uma campanha vigente." }
  }

  if (destino.status === "ENCERRADA" || destino.status === "CANCELADA") {
    return { error: "A campanha de destino está encerrada ou cancelada." }
  }

  // ── Conta chaves migráveis ────────────────────────────────────────
  const chavesMigraveis = await db.chave.findMany({
    where: {
      campanhaId: campanhaOrigemId,
      lojaId: session.user.lojaId,
      status: { in: ["GERADA", "CONSULTADA", "ATIVADA"] },
    },
    select: { id: true },
  })

  if (chavesMigraveis.length === 0) {
    return { error: "Não há chaves pendentes nesta campanha para migrar." }
  }

  // ── Verifica espaço na destino ───────────────────────────────────
  const vagasDestino = destino.quantidadeChaves - destino._count.chaves
  if (vagasDestino < chavesMigraveis.length) {
    return {
      error: `A campanha de destino tem apenas ${vagasDestino} vaga(s) disponível(is), mas há ${chavesMigraveis.length} chave(s) para migrar. Aumente o limite da campanha de destino antes de migrar.`,
    }
  }

  // ── Cria novo lote de migração no destino ────────────────────────
  const novoLote = await db.loteChave.create({
    data: {
      campanhaId:   campanhaDestinoId,
      lojaId:       session.user.lojaId,
      geradoPorId:  session.user.id,
      quantidade:   chavesMigraveis.length,
      status:       "GERADO",
      descricao:    `Migrado de: ${origem.nome}`,
    },
  })

  // ── Move as chaves ────────────────────────────────────────────────
  await db.chave.updateMany({
    where: { id: { in: chavesMigraveis.map((c) => c.id) } },
    data: {
      campanhaId: campanhaDestinoId,
      loteId:     novoLote.id,
    },
  })

  revalidatePath(`/dashboard/campanhas/${campanhaOrigemId}`)
  revalidatePath(`/dashboard/campanhas/${campanhaDestinoId}`)
  revalidatePath("/dashboard/chaves")

  redirect(`/dashboard/campanhas/${campanhaDestinoId}?migrado=${chavesMigraveis.length}`)
}
