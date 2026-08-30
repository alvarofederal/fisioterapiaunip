"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export type LayoutState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
}

function extractLayoutFields(formData: FormData) {
  const nome          = formData.get("nome") as string
  const corPrimaria   = formData.get("corPrimaria") as string
  const corFundo      = formData.get("corFundo") as string
  const corTexto      = formData.get("corTexto") as string
  const corSecundaria = formData.get("corSecundaria") as string
  const imagem1Url    = (formData.get("imagem1Url") as string) || null
  const imagem2Url    = (formData.get("imagem2Url") as string) || null
  const imagem3Url    = (formData.get("imagem3Url") as string) || null
  const opacidadeFundo = parseInt(formData.get("opacidadeFundo") as string) || 20
  const brilho        = parseInt(formData.get("brilho") as string) || 100
  const saturacao     = parseInt(formData.get("saturacao") as string) || 100
  const contraste     = parseInt(formData.get("contraste") as string) || 100
  const tamanhoCard   = (formData.get("tamanhoCard") as string) || "PADRAO"
  const estiloCard    = (formData.get("estiloCard") as string) || "CLASSICO"
  const raioCantos    = parseInt(formData.get("raioCantos") as string) || 8
  const padrao        = formData.get("padrao") === "on"
  const rawChaveX     = formData.get("posicaoChaveX") as string | null
  const rawChaveY     = formData.get("posicaoChaveY") as string | null
  const rawEscala     = formData.get("escalaChave")   as string | null
  const posicaoChaveX = rawChaveX ? parseFloat(rawChaveX) : null
  const posicaoChaveY = rawChaveY ? parseFloat(rawChaveY) : null
  const escalaChave   = rawEscala ? parseFloat(rawEscala) : 1

  return {
    nome, corPrimaria, corFundo, corTexto, corSecundaria,
    imagem1Url, imagem2Url, imagem3Url,
    opacidadeFundo: Math.min(60, Math.max(5, opacidadeFundo)),
    brilho: Math.min(200, Math.max(0, brilho)),
    saturacao: Math.min(200, Math.max(0, saturacao)),
    contraste: Math.min(200, Math.max(0, contraste)),
    tamanhoCard, estiloCard,
    raioCantos: Math.min(24, Math.max(0, raioCantos)),
    padrao,
    posicaoChaveX: posicaoChaveX !== null && !isNaN(posicaoChaveX) ? posicaoChaveX : null,
    posicaoChaveY: posicaoChaveY !== null && !isNaN(posicaoChaveY) ? posicaoChaveY : null,
    escalaChave:   !isNaN(escalaChave) ? escalaChave : 1,
  }
}

export async function criarLayout(_prev: LayoutState, formData: FormData): Promise<LayoutState> {
  const session = await auth()
  if (!session?.user?.lojaId) return { error: "Não autorizado" }

  const fields = extractLayoutFields(formData)
  if (!fields.nome?.trim()) return { fieldErrors: { nome: ["Nome obrigatório"] } }

  if (fields.padrao) {
    await db.layout.updateMany({
      where: { lojaId: session.user.lojaId, padrao: true },
      data: { padrao: false },
    })
  }

  await db.layout.create({
    data: {
      lojaId: session.user.lojaId,
      nome: fields.nome.trim(),
      corPrimaria: fields.corPrimaria || "#c8a96e",
      corFundo: fields.corFundo || "#fffdf7",
      corTexto: fields.corTexto || "#3a2510",
      corSecundaria: fields.corSecundaria || "#5a3e28",
      imagem1Url: fields.imagem1Url,
      imagem2Url: fields.imagem2Url,
      imagem3Url: fields.imagem3Url,
      opacidadeFundo: fields.opacidadeFundo,
      brilho: fields.brilho,
      saturacao: fields.saturacao,
      contraste: fields.contraste,
      tamanhoCard: fields.tamanhoCard as "MINI" | "PADRAO" | "COUPON" | "VOUCHER" | "MEIO_A4",
      estiloCard: fields.estiloCard as "CLASSICO" | "MODERNO" | "MINIMALISTA" | "GRADIENTE" | "NEON",
      raioCantos: fields.raioCantos,
      padrao: fields.padrao,
      posicaoChaveX: fields.posicaoChaveX,
      posicaoChaveY: fields.posicaoChaveY,
      escalaChave:   fields.escalaChave,
    },
  })

  revalidatePath("/dashboard/layout")
  redirect("/dashboard/layout")
}

export async function atualizarLayout(_prev: LayoutState, formData: FormData): Promise<LayoutState> {
  const session = await auth()
  if (!session?.user?.lojaId) return { error: "Não autorizado" }

  const id     = formData.get("id") as string
  const fields = extractLayoutFields(formData)

  if (!fields.nome?.trim()) return { fieldErrors: { nome: ["Nome obrigatório"] } }

  const layout = await db.layout.findUnique({ where: { id } })
  if (!layout || layout.lojaId !== session.user.lojaId) return { error: "Não encontrado" }

  if (fields.padrao) {
    await db.layout.updateMany({
      where: { lojaId: session.user.lojaId, padrao: true, id: { not: id } },
      data: { padrao: false },
    })
  }

  await db.layout.update({
    where: { id },
    data: {
      nome: fields.nome.trim(),
      corPrimaria: fields.corPrimaria || "#c8a96e",
      corFundo: fields.corFundo || "#fffdf7",
      corTexto: fields.corTexto || "#3a2510",
      corSecundaria: fields.corSecundaria || "#5a3e28",
      imagem1Url: fields.imagem1Url,
      imagem2Url: fields.imagem2Url,
      imagem3Url: fields.imagem3Url,
      opacidadeFundo: fields.opacidadeFundo,
      brilho: fields.brilho,
      saturacao: fields.saturacao,
      contraste: fields.contraste,
      tamanhoCard: fields.tamanhoCard as "MINI" | "PADRAO" | "COUPON" | "VOUCHER" | "MEIO_A4",
      estiloCard: fields.estiloCard as "CLASSICO" | "MODERNO" | "MINIMALISTA" | "GRADIENTE" | "NEON",
      raioCantos: fields.raioCantos,
      padrao: fields.padrao,
      posicaoChaveX: fields.posicaoChaveX,
      posicaoChaveY: fields.posicaoChaveY,
      escalaChave:   fields.escalaChave,
    },
  })

  revalidatePath("/dashboard/layout")
  return { success: true }
}

export async function excluirLayout(id: string) {
  const session = await auth()
  if (!session?.user?.lojaId) return

  const layout = await db.layout.findUnique({ where: { id }, select: { lojaId: true } })
  if (!layout || layout.lojaId !== session.user.lojaId) return

  await db.layout.delete({ where: { id } })
  revalidatePath("/dashboard/layout")
}
