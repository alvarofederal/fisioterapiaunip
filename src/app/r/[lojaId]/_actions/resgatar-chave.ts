"use server"

import { z } from "zod"
import { db } from "@/lib/prisma"

export type ResgatePublicoState = {
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

function buildBeneficio(
  tipo: string,
  valor: unknown,
  premio: string | null,
): string {
  if (tipo === "DESCONTO_PERCENTUAL" && valor) return `${valor}% de desconto`
  if (tipo === "DESCONTO_FIXO" && valor)
    return `R$ ${Number(valor).toFixed(2)} de desconto`
  if (tipo === "CASHBACK" && valor) return `${valor}% cashback`
  if (tipo === "FRETE_GRATIS") return "Frete grátis"
  if (premio) return premio
  return tipo.replace(/_/g, " ").toLowerCase()
}

export async function consultarChavePublico(
  lojaId: string,
  codigo: string,
): Promise<ResgatePublicoState> {
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
      cliente: { select: { nome: true, telefone: true, email: true } },
    },
  })

  if (!chave) return { error: "Código não encontrado." }
  if (chave.lojaId !== lojaId) return { error: "Este código não pertence a esta loja." }

  if (chave.status === "RESGATADA") return { error: "Esta chave já foi resgatada." }
  if (chave.status === "EXPIRADA" || chave.status === "CANCELADA")
    return { error: "Esta chave não é mais válida." }
  if (chave.status === "GERADA" || chave.status === "CONSULTADA")
    return { error: "Esta chave ainda não foi ativada pelo cliente." }

  const c = chave.campanha
  if (c.status === "ENCERRADA" || c.status === "CANCELADA")
    return { error: "A campanha desta chave foi encerrada." }
  if (new Date() > c.expiraEm) return { error: "Esta chave expirou." }

  return {
    chave: {
      id: chave.id,
      codigo: chave.codigo,
      campanhaNome: c.nome,
      beneficio: buildBeneficio(c.tipoBeneficio, c.valorBeneficio, c.descricaoPremio),
      clienteNome: chave.cliente?.nome ?? null,
      clienteTelefone: chave.cliente?.telefone ?? null,
      clienteEmail: chave.cliente?.email ?? null,
    },
  }
}

const confirmarSchema = z.object({
  codigo: z.string().min(1),
  observacao: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v == null || v === "" ? undefined : v))
    .pipe(z.string().max(500).optional()),
})

export async function confirmarResgatePublico(
  lojaId: string,
  _prev: ResgatePublicoState,
  formData: FormData,
): Promise<ResgatePublicoState> {
  const result = confirmarSchema.safeParse({
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

  if (!chave || chave.lojaId !== lojaId) return { error: "Chave não encontrada." }
  if (chave.status !== "ATIVADA") return { error: "Chave não está ativada." }

  await db.$transaction([
    db.chave.update({
      where: { id: chave.id },
      data: { status: "RESGATADA", resgatadaEm: new Date() },
    }),
    db.resgate.create({
      data: {
        chaveId: chave.id,
        campanhaId: chave.campanhaId,
        lojaId,
        clienteId: chave.clienteId ?? null,
        operadorId: null,
        canal: "QRCODE",
        statusResgate: "CONFIRMADO",
        observacao: observacao || null,
      },
    }),
    db.logEvento.create({
      data: {
        tipoEvento: "CHAVE_RESGATADA",
        chaveId: chave.id,
        campanhaId: chave.campanhaId,
        lojaId,
        clienteId: chave.clienteId ?? null,
        canal: "QRCODE",
      },
    }),
  ])

  return { success: true }
}
