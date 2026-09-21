// src/lib/dominio.ts
// Vocabulários do domínio. Crescer significa acrescentar entrada aqui —
// nunca espalhar `if/else` pelas telas.

import type {
  CorTema,
  DiaSemana,
  TipoPost,
  TipoAnexo,
  StatusEstudo,
} from "@/generated/prisma"

/**
 * Cores temáticas das matérias, em tons do DESIGN.md.
 *
 * O blurple fica de fora de propósito: ele é a cor da ação primária e perde
 * força se virar mais uma cor de categoria. `suave` e `borda` são a mesma cor
 * em alfa baixo, porque no tema escuro tinta clara chapada estoura o contraste.
 *
 * ROXO é a única extensão da paleta: a referência não traz um violeta livre
 * (o único é o próprio blurple), e o vocabulário de cores combinado tem roxo.
 */
export const CORES_MATERIA: Record<
  CorTema,
  { rotulo: string; base: string; suave: string; borda: string }
> = {
  AZUL: {
    rotulo: "Azul",
    base: "#00b0f4",
    suave: "rgba(0, 176, 244, 0.14)",
    borda: "rgba(0, 176, 244, 0.35)",
  },
  VERDE: {
    rotulo: "Verde",
    base: "#57f287",
    suave: "rgba(87, 242, 135, 0.14)",
    borda: "rgba(87, 242, 135, 0.35)",
  },
  VERMELHO: {
    rotulo: "Vermelho",
    base: "#de2761",
    suave: "rgba(222, 39, 97, 0.16)",
    borda: "rgba(222, 39, 97, 0.38)",
  },
  ROXO: {
    rotulo: "Roxo",
    base: "#a78bfa",
    suave: "rgba(167, 139, 250, 0.16)",
    borda: "rgba(167, 139, 250, 0.38)",
  },
  LARANJA: {
    rotulo: "Laranja",
    base: "#fda220",
    suave: "rgba(253, 162, 32, 0.14)",
    borda: "rgba(253, 162, 32, 0.35)",
  },
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

/** Iniciais a partir do nome — no máximo duas letras. Usada no servidor e no cliente. */
export function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return "?"
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

// ─── Cronograma ──────────────────────────────────────────────────

export const STATUS_ESTUDO: Record<
  StatusEstudo,
  { rotulo: string; curto: string; cor: string; suave: string }
> = {
  A_ESTUDAR: {
    rotulo: "A estudar",
    curto: "A estudar",
    cor: "#99aab5",
    suave: "rgba(153, 170, 181, 0.14)",
  },
  ESTUDANDO: {
    rotulo: "Estudando",
    curto: "Estudando",
    cor: "#fda220",
    suave: "rgba(253, 162, 32, 0.16)",
  },
  REVISADO: {
    rotulo: "Revisado",
    curto: "Revisado",
    cor: "#57f287",
    suave: "rgba(87, 242, 135, 0.16)",
  },
}

export const ORDEM_STATUS: StatusEstudo[] = ["A_ESTUDAR", "ESTUDANDO", "REVISADO"]

/** Data no formato "sáb, 17 de out" — curto o bastante para caber no card. */
export function formatarDataCurta(data: Date): string {
  return data.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })
}

/** "Outubro de 2026" — cabeçalho de grupo do cronograma. */
export function formatarMes(data: Date): string {
  const texto = data.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/**
 * Quantos dias faltam, comparando só as datas (sem hora).
 * Negativo = já passou. Zero = hoje.
 */
export function diasAte(data: Date, referencia = new Date()): number {
  const umDia = 24 * 60 * 60 * 1000
  const alvo = Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate())
  const hoje = Date.UTC(
    referencia.getFullYear(),
    referencia.getMonth(),
    referencia.getDate()
  )
  return Math.round((alvo - hoje) / umDia)
}

/** Texto humano para a contagem: "hoje", "amanhã", "em 5 dias", "há 3 dias". */
export function textoDeProximidade(dias: number): string {
  if (dias === 0) return "hoje"
  if (dias === 1) return "amanhã"
  if (dias === -1) return "ontem"
  if (dias > 1) return `em ${dias} dias`
  return `há ${Math.abs(dias)} dias`
}
