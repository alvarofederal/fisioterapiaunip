"use server"

import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { revalidatePath } from "next/cache"
import { z } from "zod"

async function assertAdmin() {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") throw new Error("Não autorizado")
}

// ─── Atualizar produto (nome + descrição) ────────────────────────
export async function atualizarProduto(produtoId: string, data: { nome?: string; descricao?: string }) {
  await assertAdmin()

  const schema = z.object({
    nome:     z.string().min(2).max(200).optional(),
    descricao: z.string().max(500).optional(),
  })

  const parsed = schema.safeParse(data)
  if (!parsed.success) return { error: "Dados inválidos" }

  try {
    await stripe.products.update(produtoId, {
      ...(parsed.data.nome      ? { name:        parsed.data.nome      } : {}),
      ...(parsed.data.descricao !== undefined ? { description: parsed.data.descricao } : {}),
    })
    revalidatePath("/dashboard/admin/stripe/produtos")
    return { ok: true }
  } catch (err: any) {
    return { error: err?.message ?? "Erro ao atualizar produto" }
  }
}

// ─── Arquivar produto ────────────────────────────────────────────
export async function arquivarProduto(produtoId: string) {
  await assertAdmin()
  try {
    await stripe.products.update(produtoId, { active: false })
    revalidatePath("/dashboard/admin/stripe/produtos")
    return { ok: true }
  } catch (err: any) {
    return { error: err?.message ?? "Erro ao arquivar produto" }
  }
}

// ─── Atualizar nickname de um preço ──────────────────────────────
export async function atualizarNicknamePreco(priceId: string, nickname: string) {
  await assertAdmin()
  const parsed = z.string().max(100).safeParse(nickname)
  if (!parsed.success) return { error: "Nickname inválido" }

  try {
    await stripe.prices.update(priceId, { nickname: parsed.data })
    revalidatePath("/dashboard/admin/stripe/produtos")
    return { ok: true }
  } catch (err: any) {
    return { error: err?.message ?? "Erro ao atualizar preço" }
  }
}

// ─── Arquivar preço ───────────────────────────────────────────────
export async function arquivarPreco(priceId: string) {
  await assertAdmin()
  try {
    await stripe.prices.update(priceId, { active: false })
    revalidatePath("/dashboard/admin/stripe/produtos")
    return { ok: true }
  } catch (err: any) {
    return { error: err?.message ?? "Erro ao arquivar preço" }
  }
}

// ─── Criar preço num produto existente ───────────────────────────
export async function criarPreco(produtoId: string, data: {
  amount: number
  currency: string
  recurring: boolean
  interval?: "month" | "year"
  nickname?: string
}) {
  await assertAdmin()

  const schema = z.object({
    amount:    z.number().int().min(1),
    currency:  z.string().length(3),
    recurring: z.boolean(),
    interval:  z.enum(["month", "year"]).optional(),
    nickname:  z.string().max(100).optional(),
  })

  const parsed = schema.safeParse(data)
  if (!parsed.success) return { error: "Dados inválidos" }

  try {
    const price = await stripe.prices.create({
      product: produtoId,
      unit_amount: parsed.data.amount,
      currency: parsed.data.currency,
      ...(parsed.data.recurring && parsed.data.interval
        ? { recurring: { interval: parsed.data.interval } }
        : {}),
      nickname: parsed.data.nickname,
    })
    revalidatePath("/dashboard/admin/stripe/produtos")
    return { ok: true, priceId: price.id }
  } catch (err: any) {
    return { error: err?.message ?? "Erro ao criar preço" }
  }
}

// ─── Criar produto ────────────────────────────────────────────────
export async function criarProduto(data: { nome: string; descricao?: string }) {
  await assertAdmin()

  const schema = z.object({
    nome:     z.string().min(2).max(200),
    descricao: z.string().max(500).optional(),
  })

  const parsed = schema.safeParse(data)
  if (!parsed.success) return { error: "Dados inválidos" }

  try {
    const produto = await stripe.products.create({
      name:        parsed.data.nome,
      description: parsed.data.descricao,
    })
    revalidatePath("/dashboard/admin/stripe/produtos")
    return { ok: true, produtoId: produto.id }
  } catch (err: any) {
    return { error: err?.message ?? "Erro ao criar produto" }
  }
}
