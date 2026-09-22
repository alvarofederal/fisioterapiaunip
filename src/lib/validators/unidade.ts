// src/lib/validators/unidade.ts
import { z } from "zod"

const STATUS = ["A_ESTUDAR", "ESTUDANDO", "REVISADO"] as const

/** Unidade e teleaula compartilham a forma: número + título opcional. */
const numero = z
  .number()
  .int("O número precisa ser inteiro")
  .min(1, "O número começa em 1")
  .max(20, "No máximo 20")

const titulo = z
  .string()
  .trim()
  .max(120, "O título pode ter no máximo 120 caracteres")
  .optional()
  .or(z.literal(""))

export const unidadeSchema = z.object({
  materiaId: z.string().min(1, "Matéria obrigatória"),
  numero,
  titulo,
  /// Quantas teleaulas criar junto. Normalmente 4 — digitar uma a uma seria
  /// trabalho repetido para a estrutura mais comum do AVA.
  quantidadeTeleaulas: z
    .number()
    .int()
    .min(0, "Não pode ser negativo")
    .max(20, "No máximo 20")
    .default(4),
})

export const teleaulaSchema = z.object({
  unidadeId: z.string().min(1, "Unidade obrigatória"),
  numero,
  titulo,
})

export const progressoUnidadeSchema = z.object({
  livroLido: z.boolean(),
  slidesVistos: z.boolean(),
  atividadeFeita: z.boolean(),
  questionarioFeito: z.boolean(),
})

export const estudoTeleaulaSchema = z.object({
  status: z.enum(STATUS),
  anotacoes: z
    .string()
    .trim()
    .max(10000, "O resumo pode ter até 10000 caracteres"),
})

export const progressoAtividadeSchema = z.object({
  carimbado: z.boolean(),
  corrigido: z.boolean(),
})

export type DadosUnidade = z.infer<typeof unidadeSchema>
export type DadosTeleaula = z.infer<typeof teleaulaSchema>
