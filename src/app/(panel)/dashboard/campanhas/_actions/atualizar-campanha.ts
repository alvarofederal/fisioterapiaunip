"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import type { CampanhaFormState } from "./criar-campanha"

const nullableStr = (max?: number) =>
  z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v == null || v === "" ? undefined : v))
    .pipe(max ? z.string().max(max).optional() : z.string().optional())

const schema = z.object({
  nome: z.string().min(3, "Mínimo 3 caracteres").max(100),
  descricao: nullableStr(500),
  tipoBeneficio: z.enum([
    "DESCONTO_PERCENTUAL",
    "DESCONTO_FIXO",
    "BRINDE",
    "SORTEIO",
    "FRETE_GRATIS",
    "CASHBACK",
  ]),
  valorBeneficio: nullableStr(),
  descricaoPremio: nullableStr(300),
  regrasUso: nullableStr(1000),
  inicioEm: z.string().min(1, "Data de início obrigatória"),
  expiraEm: z.string().min(1, "Data de expiração obrigatória"),
  quantidadeChaves: z.coerce.number().int().min(1).max(10000),
  layoutId: nullableStr(),
})

export async function atualizarCampanha(
  campanhaId: string,
  _prev: CampanhaFormState,
  formData: FormData,
): Promise<CampanhaFormState> {
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
    return { error: "Não é possível editar uma campanha encerrada ou cancelada" }
  }

  const result = schema.safeParse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
    tipoBeneficio: formData.get("tipoBeneficio"),
    valorBeneficio: formData.get("valorBeneficio"),
    descricaoPremio: formData.get("descricaoPremio"),
    regrasUso: formData.get("regrasUso"),
    inicioEm: formData.get("inicioEm"),
    expiraEm: formData.get("expiraEm"),
    quantidadeChaves: formData.get("quantidadeChaves"),
    layoutId: formData.get("layoutId"),
  })

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const data = result.data
  const inicio = new Date(data.inicioEm)
  const expira = new Date(data.expiraEm)

  if (expira <= inicio) {
    return { fieldErrors: { expiraEm: ["A expiração deve ser posterior à data de início"] } }
  }

  await db.campanha.update({
    where: { id: campanhaId },
    data: {
      nome: data.nome,
      descricao: data.descricao || null,
      tipoBeneficio: data.tipoBeneficio,
      valorBeneficio:
        data.valorBeneficio && data.valorBeneficio.trim() !== ""
          ? parseFloat(data.valorBeneficio)
          : null,
      descricaoPremio: data.descricaoPremio || null,
      regrasUso: data.regrasUso || null,
      inicioEm: inicio,
      expiraEm: expira,
      quantidadeChaves: data.quantidadeChaves,
      layoutId: data.layoutId || null,
    },
  })

  revalidatePath(`/dashboard/campanhas/${campanhaId}`)
  revalidatePath("/dashboard/campanhas")
  redirect(`/dashboard/campanhas/${campanhaId}`)
}
