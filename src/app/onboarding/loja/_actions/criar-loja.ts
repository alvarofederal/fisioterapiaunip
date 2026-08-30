"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"

const criarLojaSchema = z.object({
  nome:          z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100),
  nomeExibicao:  z.string().max(60).optional().or(z.literal("")).transform(v => v || undefined),
  email:         z.string().email("Email inválido"),
  telefone:      z.string().optional(),
  cnpjCpf:       z.string().optional(),
  cidade:        z.string().optional(),
  estado:        z.string().length(2).optional().or(z.literal("")).transform(v => v || undefined),
  logoUrl:       z.string().url("URL inválida").optional().or(z.literal("")).transform(v => v || undefined),
  corPrimaria:   z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida")
    .default("#10b981"),
})

export async function criarLoja(formData: FormData) {
  const session = await auth()
  if (!session?.user)    return { error: "Não autorizado" }
  if (session.user.lojaId) return { error: "Você já possui uma loja" }

  const raw = {
    nome:         formData.get("nome")         as string,
    nomeExibicao: formData.get("nomeExibicao") as string || undefined,
    email:        formData.get("email")        as string,
    telefone:     formData.get("telefone")     as string || undefined,
    cnpjCpf:      formData.get("cnpjCpf")      as string || undefined,
    cidade:       formData.get("cidade")       as string || undefined,
    estado:       formData.get("estado")       as string || undefined,
    logoUrl:      formData.get("logoUrl")      as string || undefined,
    corPrimaria:  formData.get("corPrimaria")  as string || "#10b981",
  }

  const parsed = criarLojaSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const d = parsed.data

  if (await db.loja.findUnique({ where: { email: d.email } }))
    return { error: "Já existe uma loja com este email" }

  if (d.cnpjCpf && await db.loja.findUnique({ where: { cnpjCpf: d.cnpjCpf } }))
    return { error: "CNPJ/CPF já cadastrado" }

  const loja = await db.loja.create({
    data: {
      nome:         d.nome,
      nomeExibicao: d.nomeExibicao || null,
      email:        d.email,
      telefone:     d.telefone     || null,
      cnpjCpf:      d.cnpjCpf     || null,
      cidade:       d.cidade       || null,
      estado:       d.estado       || null,
      logoUrl:      d.logoUrl      || null,
      corPrimaria:  d.corPrimaria,
    },
  })

  await db.user.update({
    where: { id: session.user.id },
    data:  { lojaId: loja.id, role: "LOJISTA" },
  })

  revalidatePath("/dashboard")
  redirect("/dashboard")
}
