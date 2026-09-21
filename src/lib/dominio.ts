// src/lib/dominio.ts
// Vocabulários do domínio. Crescer significa acrescentar entrada aqui —
// nunca espalhar `if/else` pelas telas.

import type { CorTema, DiaSemana, TipoPost, TipoAnexo } from "@/generated/prisma"

export const CORES_MATERIA: Record<
  CorTema,
  { rotulo: string; base: string; suave: string; borda: string }
> = {
  AZUL: { rotulo: "Azul", base: "#2563eb", suave: "#eff6ff", borda: "#bfdbfe" },
  VERDE: { rotulo: "Verde", base: "#16a34a", suave: "#f0fdf4", borda: "#bbf7d0" },
  VERMELHO: { rotulo: "Vermelho", base: "#dc2626", suave: "#fef2f2", borda: "#fecaca" },
  ROXO: { rotulo: "Roxo", base: "#7c3aed", suave: "#f5f3ff", borda: "#ddd6fe" },
  LARANJA: { rotulo: "Laranja", base: "#ea580c", suave: "#fff7ed", borda: "#fed7aa" },
}

export const ROTULO_DIA: Record<DiaSemana, string> = {
  SEGUNDA: "Segunda-feira",
  TERCA: "Terça-feira",
  QUARTA: "Quarta-feira",
  QUINTA: "Quinta-feira",
  SEXTA: "Sexta-feira",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
  A_DEFINIR: "A definir",
}

export const ABREVIACAO_DIA: Record<DiaSemana, string> = {
  SEGUNDA: "SEG",
  TERCA: "TER",
  QUARTA: "QUA",
  QUINTA: "QUI",
  SEXTA: "SEX",
  SABADO: "SÁB",
  DOMINGO: "DOM",
  A_DEFINIR: "A DEFINIR",
}

/** Ordem de exibição da grade: a semana, com "a definir" no fim. */
export const ORDEM_DIAS: DiaSemana[] = [
  "SEGUNDA",
  "TERCA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SABADO",
  "DOMINGO",
  "A_DEFINIR",
]

export const ROTULO_TIPO_POST: Record<TipoPost, string> = {
  TRABALHO: "Trabalho",
  EVENTO: "Evento",
  AVISO: "Aviso",
}

export const ROTULO_TIPO_ANEXO: Record<TipoAnexo, string> = {
  IMAGEM: "Imagem",
  PDF: "PDF",
  DOCUMENTO: "Documento",
  APRESENTACAO: "Apresentação",
  OUTRO: "Arquivo",
}

/** Limite de corpo de requisição em função serverless da Vercel (~4,5 MB). */
export const TAMANHO_MAXIMO_ANEXO = 4 * 1024 * 1024

export const TIPOS_ACEITOS: Record<string, TipoAnexo> = {
  "image/jpeg": "IMAGEM",
  "image/png": "IMAGEM",
  "image/webp": "IMAGEM",
  "image/heic": "IMAGEM",
  "application/pdf": "PDF",
  "application/msword": "DOCUMENTO",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCUMENTO",
  "application/vnd.ms-powerpoint": "APRESENTACAO",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "APRESENTACAO",
}

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
