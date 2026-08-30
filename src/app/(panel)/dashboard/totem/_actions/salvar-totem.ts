"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const schema = z.object({
  totemLayoutId:  z.string().optional().transform(v => (!v || v === "") ? null : v),
  totemTitulo:    z.string().max(100).optional().transform(v => (!v || v === "") ? null : v),
  totemSubtitulo: z.string().max(200).optional().transform(v => (!v || v === "") ? null : v),
})

export type SalvarTotemState = {
  error?: string
  success?: boolean
}

export async function salvarTotem(
  _prev: SalvarTotemState,
  formData: FormData,
): Promise<SalvarTotemState> {
  const session = await auth()
  if (!session?.user?.lojaId) return { error: "Não autorizado" }

  const result = schema.safeParse({
    totemLayoutId:  formData.get("totemLayoutId"),
    totemTitulo:    formData.get("totemTitulo"),
    totemSubtitulo: formData.get("totemSubtitulo"),
  })

  if (!result.success) {
    return { error: "Dados inválidos" }
  }

  const d = result.data

  // Verificar que o layout (se fornecido) pertence à loja
  if (d.totemLayoutId) {
    const layout = await db.layout.findFirst({
      where: { id: d.totemLayoutId, lojaId: session.user.lojaId },
    })
    if (!layout) return { error: "Layout não encontrado" }
  }

  await db.loja.update({
    where: { id: session.user.lojaId },
    data: {
      totemLayoutId:  d.totemLayoutId,
      totemTitulo:    d.totemTitulo,
      totemSubtitulo: d.totemSubtitulo,
    },
  })

  revalidatePath("/dashboard/totem")
  return { success: true }
}
