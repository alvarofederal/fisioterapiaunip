// src/lib/validators/aviso.ts
import { z } from "zod"
import { LIMITE_RESUMO } from "./unidade"

export const avisoSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, "O título precisa de pelo menos 3 caracteres")
    .max(160, "O título pode ter no máximo 160 caracteres"),

  /// HTML do editor. O limite é o mesmo dos outros campos ricos do portal.
  conteudo: z
    .string()
    .trim()
    .max(LIMITE_RESUMO, "O aviso ficou grande demais."),

  /// Menor primeiro. Negativo é permitido para empurrar algo para o topo sem
  /// ter que renumerar os outros.
  ordem: z
    .number()
    .int("A ordem precisa ser um número inteiro")
    .min(-999, "Número fora da faixa")
    .max(999, "Número fora da faixa"),

  ativo: z.boolean(),
})

export type DadosAviso = z.infer<typeof avisoSchema>
