// src/lib/validators/atividade.ts
import { z } from "zod"

const TIPOS = ["TRABALHO_EXTRA_CLASSE", "SEMINARIO", "EVENTO", "CONGRESSO"] as const

const dataOpcional = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
  .or(z.literal(""))
  .optional()

const horaOpcional = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Hora inválida")
  .or(z.literal(""))
  .optional()

export const atividadeSchema = z
  .object({
    tipo: z.enum(TIPOS),
    titulo: z
      .string()
      .trim()
      .min(3, "O título precisa de pelo menos 3 caracteres")
      .max(120, "O título pode ter até 120 caracteres"),
    descricao: z.string().trim().max(3000, "A descrição pode ter até 3000 caracteres").optional().or(z.literal("")),
    materiaId: z.string().optional().or(z.literal("")),

    entregaEm: dataOpcional,
    dataInicio: dataOpcional,
    dataFim: dataOpcional,
    horaInicio: horaOpcional,
    horaFim: horaOpcional,

    local: z.string().trim().max(160, "O local pode ter até 160 caracteres").optional().or(z.literal("")),
    linkExterno: z
      .string()
      .trim()
      .max(500, "O link pode ter até 500 caracteres")
      .url("Informe um endereço completo, começando com https://")
      .optional()
      .or(z.literal("")),
    cargaHoraria: z
      .union([z.number(), z.string()])
      .optional()
      .transform((valor) => {
        if (valor === "" || valor === undefined || valor === null) return null
        const numero = Number(valor)
        return Number.isFinite(numero) ? numero : null
      })
      .refine((valor) => valor === null || (valor >= 0 && valor <= 999), {
        message: "Carga horária entre 0 e 999",
      }),
    integrantes: z.string().trim().max(1000, "A lista pode ter até 1000 caracteres").optional().or(z.literal("")),
  })
  .superRefine((dados, ctx) => {
    // Trabalho e seminário pertencem a uma matéria; congresso e evento externo
    // normalmente não pertencem a nenhuma.
    const exigeMateria = dados.tipo === "TRABALHO_EXTRA_CLASSE" || dados.tipo === "SEMINARIO"
    if (exigeMateria && !dados.materiaId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["materiaId"],
        message: "Escolha a matéria desta atividade",
      })
    }

    if (dados.tipo === "TRABALHO_EXTRA_CLASSE" && !dados.entregaEm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entregaEm"],
        message: "Informe o prazo de entrega",
      })
    }

    if ((dados.tipo === "SEMINARIO" || dados.tipo === "EVENTO") && !dados.dataInicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dataInicio"],
        message: "Informe a data",
      })
    }

    if (dados.tipo === "CONGRESSO") {
      if (!dados.dataInicio) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dataInicio"],
          message: "Informe o dia em que começa",
        })
      }
      // Um congresso que termina antes de começar é erro de digitação, não de regra.
      if (dados.dataInicio && dados.dataFim && dados.dataFim < dados.dataInicio) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dataFim"],
          message: "O fim não pode ser antes do começo",
        })
      }
    }

    if (dados.horaInicio && dados.horaFim && dados.horaFim < dados.horaInicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["horaFim"],
        message: "O horário de fim não pode ser antes do início",
      })
    }
  })

export type DadosAtividade = z.infer<typeof atividadeSchema>
