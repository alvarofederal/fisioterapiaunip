"use server"

import crypto from "crypto"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"

// Caracteres permitidos: excluídos 0,O,1,I,L (confusão visual) e S (≈5)
// Correto: A-Z menos {I,L,O,S} = 22 letras + 2-9 menos {5} = 7 dígitos = 29 chars
// Obs: 5 mantido pois S foi removido; total 30 chars para entropy balanceada
const CHARSET = "ABCDEFGHJKMNPQRTUVWXYZ23456789" // 30 chars, sem 0,O,1,I,L,S

function gerarCodigo(): string {
  const bytes = crypto.randomBytes(16)
  const groups: string[] = []
  for (let g = 0; g < 4; g++) {
    let group = ""
    for (let i = 0; i < 4; i++) {
      group += CHARSET[bytes[g * 4 + i] % CHARSET.length]
    }
    groups.push(group)
  }
  return groups.join("-")
}

const schema = z.object({
  campanhaId: z.string().min(1, "Selecione uma campanha"),
  quantidade: z.coerce
    .number()
    .int()
    .min(1, "Mínimo 1 chave")
    .max(2000, "Máximo 2.000 chaves por lote"),
  descricao: z.string().nullable().optional().transform((v) => (v == null || v === "" ? undefined : v)).pipe(z.string().max(200).optional()),
})

export type GerarLoteState = {
  error?: string
  fieldErrors?: Partial<Record<string, string[]>>
}

export async function gerarLote(
  _prev: GerarLoteState,
  formData: FormData,
): Promise<GerarLoteState> {
  const session = await auth()
  if (!session?.user?.lojaId) return { error: "Não autorizado" }

  const result = schema.safeParse({
    campanhaId: formData.get("campanhaId"),
    quantidade: formData.get("quantidade"),
    descricao: formData.get("descricao"),
  })

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { campanhaId, quantidade, descricao } = result.data

  const campanha = await db.campanha.findUnique({
    where: { id: campanhaId },
    select: {
      lojaId: true,
      status: true,
      expiraEm: true,
      quantidadeChaves: true,
      _count: { select: { chaves: true } },
    },
  })

  if (!campanha || campanha.lojaId !== session.user.lojaId) {
    return { error: "Campanha não encontrada" }
  }

  if (campanha.status === "ENCERRADA" || campanha.status === "CANCELADA") {
    return { error: "Não é possível gerar chaves para uma campanha encerrada ou cancelada." }
  }

  if (new Date() > campanha.expiraEm) {
    return { error: "Esta campanha já expirou. Crie uma nova campanha ou migre as chaves existentes para continuar." }
  }

  const jaGeradas = campanha._count.chaves
  const restantes = campanha.quantidadeChaves - jaGeradas

  if (restantes <= 0) {
    return {
      error: `Esta campanha já atingiu o limite de ${campanha.quantidadeChaves} chaves planejadas.`,
    }
  }

  const qtdEfetiva = Math.min(quantidade, restantes)

  // Gerar códigos únicos
  const codigos = new Set<string>()
  while (codigos.size < qtdEfetiva) {
    codigos.add(gerarCodigo())
  }

  // Checar colisões no banco (na prática nunca ocorre, mas garantimos)
  const existentes = await db.chave.findMany({
    where: { codigo: { in: Array.from(codigos) } },
    select: { codigo: true },
  })

  if (existentes.length > 0) {
    existentes.forEach((e) => codigos.delete(e.codigo))
    while (codigos.size < qtdEfetiva) {
      const novo = gerarCodigo()
      if (!existentes.find((e) => e.codigo === novo)) codigos.add(novo)
    }
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://courtesyfy.com.br"

  const lote = await db.loteChave.create({
    data: {
      campanhaId,
      lojaId: session.user.lojaId!,
      geradoPorId: session.user.id,
      quantidade: qtdEfetiva,
      descricao: descricao || null,
      status: "GERADO",
      chaves: {
        create: Array.from(codigos).map((codigo) => ({
          codigo,
          campanhaId,
          lojaId: session.user.lojaId!,
          status: "GERADA" as const,
          landingUrl: `${baseUrl}/c/${codigo}`,
        })),
      },
    },
  })

  revalidatePath("/dashboard/chaves")
  revalidatePath(`/dashboard/campanhas/${campanhaId}`)
  redirect(`/dashboard/chaves/lote/${lote.id}`)
}
