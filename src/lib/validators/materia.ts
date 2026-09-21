// src/lib/validators/materia.ts
import { z } from "zod"

const DIAS = [
  "SEGUNDA",
  "TERCA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SABADO",
  "DOMINGO",
  "A_DEFINIR",
] as const

const CORES = ["AZUL", "VERDE", "VERMELHO", "ROXO", "LARANJA"] as const

export const materiaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "O nome precisa de pelo menos 2 caracteres")
    .max(80, "O nome pode ter no máximo 80 caracteres"),

  professor: z
    .string()
    .trim()
    .max(80, "O nome do professor pode ter no máximo 80 caracteres")
    .optional()
    .or(z.literal("")),

  diaSemana: z.enum(DIAS).default("A_DEFINIR"),

  anotacoes: z
    .string()
    .trim()
    .max(2000, "As anotações podem ter no máximo 2000 caracteres")
    .optional()
    .or(z.literal("")),

  cor: z.enum(CORES).default("AZUL"),
})

export type DadosMateria = z.infer<typeof materiaSchema>
