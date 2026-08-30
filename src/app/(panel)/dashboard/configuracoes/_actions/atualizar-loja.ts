"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"

const nullableStr = (opts?: { max?: number; min?: number }) =>
  z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v == null || v === "" ? undefined : v))
    .pipe(
      opts?.min
        ? z.string().min(opts.min).max(opts.max ?? 9999).optional()
        : opts?.max
        ? z.string().max(opts.max).optional()
        : z.string().optional(),
    )

const schema = z.object({
  nome: z.string().min(2, "Mínimo 2 caracteres").max(100),
  nomeExibicao: nullableStr({ max: 100 }),
  email: z.string().email("E-mail inválido"),
  telefone: nullableStr({ max: 20 }),
  cnpjCpf: nullableStr({ max: 18 }),
  logradouro: nullableStr({ max: 200 }),
  numero: nullableStr({ max: 10 }),
  complemento: nullableStr({ max: 100 }),
  bairro: nullableStr({ max: 100 }),
  cidade: nullableStr({ max: 100 }),
  estado: z.string().nullable().optional().transform((v) => (v == null || v === "" ? undefined : v)).pipe(z.string().length(2).optional()),
  cep: nullableStr({ max: 9 }),
  siteUrl: z.string().nullable().optional().transform((v) => (v == null || v === "" ? undefined : v)).pipe(z.string().url("URL inválida").optional()),
  logoUrl: z.string().nullable().optional().transform((v) => (v == null || v === "" ? undefined : v)).pipe(z.string().url("URL inválida").optional()),
  corPrimaria: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? "#10b981")
    .pipe(z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida (use HEX, ex: #10b981)")),
  tipoImpressao: z.enum(["PROPRIO", "ADMIN_COURTESYFY"]).default("PROPRIO"),
})

export type ConfiguracaoLojaState = {
  success?: boolean
  error?: string
  fieldErrors?: Partial<Record<string, string[]>>
}

export async function atualizarLoja(
  _prev: ConfiguracaoLojaState,
  formData: FormData,
): Promise<ConfiguracaoLojaState> {
  const session = await auth()
  if (!session?.user?.lojaId) return { error: "Não autorizado" }

  const result = schema.safeParse({
    nome:            formData.get("nome"),
    nomeExibicao:    formData.get("nomeExibicao"),
    email:           formData.get("email"),
    telefone:        formData.get("telefone"),
    cnpjCpf:         formData.get("cnpjCpf"),
    logradouro:      formData.get("logradouro"),
    numero:          formData.get("numero"),
    complemento:     formData.get("complemento"),
    bairro:          formData.get("bairro"),
    cidade:          formData.get("cidade"),
    estado:          formData.get("estado"),
    cep:             formData.get("cep"),
    siteUrl:         formData.get("siteUrl"),
    logoUrl:         formData.get("logoUrl"),
    corPrimaria:     formData.get("corPrimaria"),
    tipoImpressao:   formData.get("tipoImpressao"),
  })

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const d = result.data

  await db.loja.update({
    where: { id: session.user.lojaId! },
    data: {
      nome:         d.nome,
      nomeExibicao: d.nomeExibicao || null,
      email:        d.email,
      telefone:     d.telefone || null,
      cnpjCpf:      d.cnpjCpf || null,
      logradouro:   d.logradouro || null,
      numero:       d.numero || null,
      complemento:  d.complemento || null,
      bairro:       d.bairro || null,
      cidade:       d.cidade || null,
      estado:       (d.estado || null) as string | null,
      cep:          d.cep || null,
      siteUrl:      d.siteUrl || null,
      logoUrl:      d.logoUrl || null,
      corPrimaria:     d.corPrimaria,
      tipoImpressao:   d.tipoImpressao,
    },
  })

  revalidatePath("/dashboard/configuracoes")
  revalidatePath("/dashboard")
  return { success: true }
}
