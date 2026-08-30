"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"

const schema = z.object({
  codigo: z.string().min(1, "Informe o código"),
  observacao: z.string().nullable().optional().transform((v) => (v == null || v === "" ? undefined : v)).pipe(z.string().max(500).optional()),
})

export type ValidarResgateState = {
  success?: boolean
  chave?: {
    id: string
    codigo: string
    campanhaNome: string
    beneficio: string
    clienteNome: string | null
    clienteTelefone: string | null
    clienteEmail: string | null
  }
  error?: string
  fieldErrors?: Partial<Record<string, string[]>>
}

export async function consultarChave(codigo: string): Promise<ValidarResgateState> {
  const session = await auth()
  if (!session?.user?.lojaId) return { error: "Não autorizado" }

  const chave = await db.chave.findUnique({
    where: { codigo: codigo.toUpperCase().trim() },
    include: {
      campanha: {
        select: {
          nome: true,
          tipoBeneficio: true,
          valorBeneficio: true,
          descricaoPremio: true,
          expiraEm: true,
          status: true,
        },
      },
      cliente: {
        select: { nome: true, telefone: true, email: true },
      },
    },
  })

  if (!chave) return { error: "Código não encontrado" }
  if (chave.lojaId !== session.user.lojaId) return { error: "Esta chave não pertence à sua loja" }

  if (chave.status === "RESGATADA") return { error: "Esta chave já foi resgatada" }
  if (chave.status === "EXPIRADA" || chave.status === "CANCELADA") {
    return { error: "Esta chave não é mais válida" }
  }
  if (chave.status === "GERADA" || chave.status === "CONSULTADA") {
    return { error: "Esta chave ainda não foi ativada pelo cliente" }
  }
  if (chave.campanha.status === "ENCERRADA" || chave.campanha.status === "CANCELADA") {
    return { error: "A campanha desta chave foi encerrada" }
  }
  if (new Date() > chave.campanha.expiraEm) {
    return { error: "A campanha desta chave expirou" }
  }

  // Montar descrição do benefício
  let beneficio = ""
  const c = chave.campanha
  if (c.tipoBeneficio === "DESCONTO_PERCENTUAL" && c.valorBeneficio) {
    beneficio = `${c.valorBeneficio}% de desconto`
  } else if (c.tipoBeneficio === "DESCONTO_FIXO" && c.valorBeneficio) {
    beneficio = `R$ ${Number(c.valorBeneficio).toFixed(2)} de desconto`
  } else if (c.tipoBeneficio === "CASHBACK" && c.valorBeneficio) {
    beneficio = `${c.valorBeneficio}% cashback`
  } else if (c.tipoBeneficio === "FRETE_GRATIS") {
    beneficio = "Frete grátis"
  } else if (c.descricaoPremio) {
    beneficio = c.descricaoPremio
  } else {
    beneficio = c.tipoBeneficio.replace(/_/g, " ").toLowerCase()
  }

  return {
    chave: {
      id: chave.id,
      codigo: chave.codigo,
      campanhaNome: c.nome,
      beneficio,
      clienteNome: chave.cliente?.nome ?? null,
      clienteTelefone: chave.cliente?.telefone ?? null,
      clienteEmail: chave.cliente?.email ?? null,
    },
  }
}

export async function confirmarResgate(
  _prev: ValidarResgateState,
  formData: FormData,
): Promise<ValidarResgateState> {
  const session = await auth()
  if (!session?.user?.lojaId) return { error: "Não autorizado" }

  const result = schema.safeParse({
    codigo: formData.get("codigo"),
    observacao: formData.get("observacao"),
  })

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { codigo, observacao } = result.data

  const chave = await db.chave.findUnique({
    where: { codigo },
    select: { id: true, lojaId: true, status: true, campanhaId: true, clienteId: true },
  })

  if (!chave || chave.lojaId !== session.user.lojaId) return { error: "Chave não encontrada" }
  if (chave.status !== "ATIVADA") return { error: "Chave não está ativada" }

  await db.$transaction([
    db.chave.update({
      where: { id: chave.id },
      data: { status: "RESGATADA", resgatadaEm: new Date() },
    }),
    db.resgate.create({
      data: {
        chaveId: chave.id,
        campanhaId: chave.campanhaId,
        lojaId: session.user.lojaId!,
        clienteId: chave.clienteId ?? null,
        operadorId: session.user.id,
        canal: "BALCAO",
        statusResgate: "CONFIRMADO",
        observacao: observacao || null,
      },
    }),
    db.logEvento.create({
      data: {
        tipoEvento: "CHAVE_RESGATADA",
        chaveId: chave.id,
        campanhaId: chave.campanhaId,
        lojaId: session.user.lojaId!,
        clienteId: chave.clienteId ?? null,
        operadorId: session.user.id,
        canal: "BALCAO",
      },
    }),
  ])

  revalidatePath("/dashboard/resgates")
  revalidatePath("/dashboard")
  return { success: true }
}
