"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"

type NovoStatus = "ATIVA" | "PAUSADA" | "ENCERRADA"

export async function alterarStatusCampanha(
  campanhaId: string,
  novoStatus: NovoStatus,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.lojaId) return { error: "Não autorizado" }

  const campanha = await db.campanha.findUnique({
    where: { id: campanhaId },
    select: { lojaId: true, status: true },
  })

  if (!campanha || campanha.lojaId !== session.user.lojaId) {
    return { error: "Campanha não encontrada" }
  }

  if (campanha.status === "ENCERRADA" || campanha.status === "CANCELADA") {
    return { error: "Campanha já encerrada ou cancelada" }
  }

  if (novoStatus !== "ENCERRADA") {
    const transicoes: Partial<Record<string, NovoStatus>> = {
      RASCUNHO: "ATIVA",
      ATIVA:    "PAUSADA",
      PAUSADA:  "ATIVA",
    }
    if (transicoes[campanha.status] !== novoStatus) {
      return { error: `Transição inválida: ${campanha.status} → ${novoStatus}` }
    }
  }

  await db.campanha.update({
    where: { id: campanhaId },
    data: { status: novoStatus },
  })

  revalidatePath(`/dashboard/campanhas/${campanhaId}`)
  revalidatePath("/dashboard/campanhas")
  return {}
}
