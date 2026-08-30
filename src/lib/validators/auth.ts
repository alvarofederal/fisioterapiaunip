// src/lib/validators/auth.ts
import { z } from "zod"

const passwordSchema = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .max(128, "A senha deve ter no máximo 128 caracteres")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número")
  .regex(/[^a-zA-Z0-9]/, "A senha deve conter pelo menos um caractere especial")

const emailSchema = z
  .string()
  .email("Email inválido")
  .max(255, "Email muito longo")
  .toLowerCase()
  .trim()

// ✅ Schema simplificado para API (confirmPassword validado no frontend)
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Senha obrigatória")
})

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z.string().length(6, "O código deve ter 6 dígitos")
})

export const forgotPasswordSchema = z.object({
  email: emailSchema
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token obrigatório"),
  password: passwordSchema,
})