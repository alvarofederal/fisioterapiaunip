"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"

export async function cancelarChave(
  chaveId: string,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.lojaId) return { error: "Não autorizado" }

  const chave = await db.chave.findUnique({
    where: { id: chaveId },
    select: { lojaId: true, status: true, loteId: true, campanhaId: true },
  })

  if (!chave || chave.lojaId !== session.user.lojaId) {
    return { error: "Chave não encontrada" }
  }

  if (chave.status === "RESGATADA") {
    return { error: "Não é possível cancelar uma chave já resgatada" }
  }

  if (chave.status === "CANCELADA") {
    return { error: "Chave já cancelada" }
  }

  await db.chave.update({
    where: { id: chaveId },
    data: {
      status: "CANCELADA",
      canceladaEm: new Date(),
      canceladoPorId: session.user.id,
    },
  })

  await db.logEvento.create({
    data: {
      tipoEvento: "CHAVE_CANCELADA",
      chaveId,
      campanhaId: chave.campanhaId,
      lojaId: session.user.lojaId!,
      operadorId: session.user.id,
    },
  })

  revalidatePath(`/dashboard/chaves/lote/${chave.loteId}`)
  revalidatePath(`/dashboard/campanhas/${chave.campanhaId}`)
  return {}
}

export async function cancelarLote(
  loteId: string,
): Promise<{ error?: string; canceladas?: number }> {
  const session = await auth()
  if (!session?.user?.lojaId) return { error: "Não autorizado" }

  const lote = await db.loteChave.findUnique({
    where: { id: loteId },
    select: { lojaId: true, campanhaId: true },
  })

  if (!lote || lote.lojaId !== session.user.lojaId) {
    return { error: "Lote não encontrado" }
  }

  const { count } = await db.chave.updateMany({
    where: {
      loteId,
      status: { notIn: ["RESGATADA", "CANCELADA"] },
    },
    data: {
      status: "CANCELADA",
      canceladaEm: new Date(),
      canceladoPorId: session.user.id,
    },
  })

  revalidatePath(`/dashboard/chaves/lote/${loteId}`)
  revalidatePath(`/dashboard/campanhas/${lote.campanhaId}`)
  return { canceladas: count }
}
