// src/lib/validators/auth.ts
import { z } from "zod"

const senhaSchema = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .max(128, "A senha deve ter no máximo 128 caracteres")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número")

const emailSchema = z
  .string()
  .email("E-mail inválido")
  .max(255, "E-mail muito longo")
  .toLowerCase()
  .trim()

export const registerSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo")
    .max(80, "Nome muito longo"),
  email: emailSchema,
  password: senhaSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Senha obrigatória"),
})

/** Troca de senha pelo próprio usuário. */
export const trocarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, "Informe a senha atual"),
  novaSenha: senhaSchema,
})

/** Redefinição de senha feita pelo ADMIN — não exige a senha antiga. */
export const redefinirSenhaAdminSchema = z.object({
  usuarioId: z.string().min(1),
  novaSenha: senhaSchema,
})
