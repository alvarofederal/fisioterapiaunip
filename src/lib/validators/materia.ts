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

const MODALIDADES = ["PRESENCIAL", "EAD"] as const

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

  /// Decide onde a matéria aparece e se os trabalhos dela têm carimbo.
  modalidade: z.enum(MODALIDADES).default("EAD"),

  /// Obrigatório: é o semestre que agrupa a listagem, e matéria sem semestre
  /// não apareceria em lugar nenhum.
  semestreId: z.string().min(1, "Escolha o semestre"),
})

export type DadosMateria = z.infer<typeof materiaSchema>

export const semestreSchema = z
  .object({
    ano: z
      .number()
      .int("O ano precisa ser um número inteiro")
      .min(2020, "Ano muito antigo")
      .max(2100, "Ano muito distante"),

    periodo: z
      .number()
      .int()
      .refine((v) => v === 1 || v === 2, "O período é 1 ou 2"),

    inicioEm: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
      .optional()
      .or(z.literal("")),

    fimEm: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
      .optional()
      .or(z.literal("")),
  })
  // Um semestre que termina antes de começar passaria batido e só apareceria
  // como intervalo sem sentido na tela.
  .refine((d) => !d.inicioEm || !d.fimEm || d.inicioEm <= d.fimEm, {
    message: "O fim não pode ser antes do início",
    path: ["fimEm"],
  })

export type DadosSemestre = z.infer<typeof semestreSchema>
