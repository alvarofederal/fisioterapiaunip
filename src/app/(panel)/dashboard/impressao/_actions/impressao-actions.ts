"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

// ─────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────

export type SolicitacaoState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
}

const criarSchema = z.object({
  campanhaId:      z.string().min(1, "Selecione uma campanha"),
  loteId:          z.string().min(1, "Selecione um lote"),
  layoutId:        z.string().min(1, "Selecione um layout"),
  quantidadeCards: z.coerce.number().int().min(1, "Mínimo 1 card").max(10000),
  folhasEstimadas: z.coerce.number().int().min(1),
  observacaoLoja:  z.string().max(500).optional(),
})

// ─────────────────────────────────────────
// LOJISTA: CRIAR SOLICITAÇÃO
// ─────────────────────────────────────────

export async function criarSolicitacao(
  _prev: SolicitacaoState,
  formData: FormData,
): Promise<SolicitacaoState> {
  const session = await auth()
  if (!session?.user?.lojaId) return { error: "Não autorizado" }

  const result = criarSchema.safeParse({
    campanhaId:      formData.get("campanhaId"),
    loteId:          formData.get("loteId"),
    layoutId:        formData.get("layoutId"),
    quantidadeCards: formData.get("quantidadeCards"),
    folhasEstimadas: formData.get("folhasEstimadas"),
    observacaoLoja:  formData.get("observacaoLoja") || undefined,
  })

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const d = result.data

  // Verificar que campanha, lote e layout pertencem à loja
  const [campanha, lote, layout] = await Promise.all([
    db.campanha.findFirst({ where: { id: d.campanhaId, lojaId: session.user.lojaId } }),
    db.loteChave.findFirst({ where: { id: d.loteId,    lojaId: session.user.lojaId } }),
    db.layout.findFirst({   where: { id: d.layoutId,   lojaId: session.user.lojaId } }),
  ])

  if (!campanha) return { error: "Campanha não encontrada" }
  if (!lote)     return { error: "Lote não encontrado" }
  if (!layout)   return { error: "Layout não encontrado" }

  await db.solicitacaoImpressao.create({
    data: {
      lojaId:          session.user.lojaId,
      campanhaId:      d.campanhaId,
      loteId:          d.loteId,
      layoutId:        d.layoutId,
      quantidadeCards: d.quantidadeCards,
      folhasEstimadas: d.folhasEstimadas,
      observacaoLoja:  d.observacaoLoja || null,
      status:          "PENDENTE",
    },
  })

  revalidatePath("/dashboard/impressao")
  redirect("/dashboard/impressao")
}

// ─────────────────────────────────────────
// LOJISTA: CANCELAR SOLICITAÇÃO
// ─────────────────────────────────────────

export async function cancelarSolicitacao(id: string): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.lojaId) return { error: "Não autorizado" }

  const sol = await db.solicitacaoImpressao.findFirst({
    where: { id, lojaId: session.user.lojaId },
  })

  if (!sol) return { error: "Solicitação não encontrada" }
  if (!["PENDENTE", "EM_ANALISE"].includes(sol.status)) {
    return { error: "Não é possível cancelar uma solicitação já processada" }
  }

  await db.solicitacaoImpressao.delete({ where: { id } })

  revalidatePath("/dashboard/impressao")
  return {}
}

// ─────────────────────────────────────────
// ADMIN: ATUALIZAR STATUS
// ─────────────────────────────────────────

export type AdminAtualizarState = {
  error?: string
  success?: boolean
}

const VALID_STATUS = [
  "PENDENTE",
  "EM_ANALISE",
  "AGUARDANDO_PAGAMENTO",
  "APROVADA",
  "REJEITADA",
  "IMPRESSA",
  "ENTREGUE",
] as const

type StatusValue = typeof VALID_STATUS[number]

const adminSchema = z.object({
  id:              z.string().min(1),
  status:          z.enum(VALID_STATUS),
  observacaoAdmin: z.string().max(500).optional(),
  // Campos de pagamento (obrigatórios somente quando AGUARDANDO_PAGAMENTO)
  valorCobrado:    z.preprocess(
    v => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().min(0.01).optional(),
  ),
  pixChave: z.string().max(150).optional(),
  pixNome:  z.string().max(100).optional(),
})

export async function adminAtualizarSolicitacao(
  _prev: AdminAtualizarState,
  formData: FormData,
): Promise<AdminAtualizarState> {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") return { error: "Não autorizado" }

  const result = adminSchema.safeParse({
    id:              formData.get("id"),
    status:          formData.get("status"),
    observacaoAdmin: formData.get("observacaoAdmin") || undefined,
    valorCobrado:    formData.get("valorCobrado"),
    pixChave:        formData.get("pixChave") || undefined,
    pixNome:         formData.get("pixNome")  || undefined,
  })

  if (!result.success) {
    const msgs = Object.values(result.error.flatten().fieldErrors).flat().join("; ")
    return { error: msgs || "Dados inválidos" }
  }

  const d = result.data

  // Validação de negócio: AGUARDANDO_PAGAMENTO exige valor e chave PIX
  if (d.status === "AGUARDANDO_PAGAMENTO") {
    if (!d.valorCobrado) return { error: "Informe o valor a cobrar" }
    if (!d.pixChave)     return { error: "Informe a chave PIX" }
  }

  const sol = await db.solicitacaoImpressao.findUnique({ where: { id: d.id } })
  if (!sol) return { error: "Solicitação não encontrada" }

  const isAprovando      = d.status === "APROVADA" && sol.status !== "APROVADA"
  const isAguardandoPag  = d.status === "AGUARDANDO_PAGAMENTO"

  // Monta o payload de pagamento
  const pagamentoData = isAguardandoPag
    ? {
        valorCobrado: d.valorCobrado,
        pixChave:     d.pixChave ?? null,
        pixNome:      d.pixNome  ?? null,
      }
    : {}

  // Monta o payload de aprovação (quem confirmou o pagamento)
  const aprovacaoData = isAprovando
    ? { aprovadoPorId: session.user.id, aprovadoEm: new Date() }
    : {}

  // Se está confirmando pagamento (AGUARDANDO_PAGAMENTO → APROVADA)
  const confirmacoePagData =
    isAprovando && sol.status === "AGUARDANDO_PAGAMENTO"
      ? { pagamentoConfirmadoPorId: session.user.id, pagamentoConfirmadoEm: new Date() }
      : {}

  await db.solicitacaoImpressao.update({
    where: { id: d.id },
    data: {
      status:          d.status as StatusValue,
      observacaoAdmin: d.observacaoAdmin ?? null,
      ...pagamentoData,
      ...aprovacaoData,
      ...confirmacoePagData,
    },
  })

  revalidatePath("/dashboard/admin/impressoes")
  revalidatePath(`/dashboard/admin/impressoes/${d.id}`)
  revalidatePath("/dashboard/impressao")
  return { success: true }
}
