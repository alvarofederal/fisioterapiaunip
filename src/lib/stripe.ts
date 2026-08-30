import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY não configurada")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
})

// ─── Mapeamento de planos → price IDs ────────────────────────────
export const STRIPE_PRICES = {
  PROFISSIONAL: process.env.STRIPE_PLAN_PROFESSIONAL ?? "",
  EMPRESARIAL:  process.env.STRIPE_PLAN_EMPRESARIAL  ?? "",
} as const

// ─── URLs de retorno ─────────────────────────────────────────────
export const STRIPE_URLS = {
  success: process.env.STRIPE_SUCCESS_URL ?? `${process.env.NEXTAUTH_URL}/dashboard/planos?sucesso=1`,
  cancel:  process.env.STRIPE_CANCEL_URL  ?? `${process.env.NEXTAUTH_URL}/dashboard/planos?cancelado=1`,
}

// ─── Trial padrão (dias) ─────────────────────────────────────────
export const TRIAL_DAYS = 14
