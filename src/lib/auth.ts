// src/lib/auth.ts
// Autenticação do Portal Fisioterapia UNIP.
//
// Estratégia: JWT. Não há adapter de banco e não há tabela de sessão — a sessão
// vive assinada no cookie. Isso economiza uma ida ao MySQL por requisição, que é
// o recurso escasso na hospedagem compartilhada (ver spec/07-portal-spec.md §3.4).

import NextAuth, { type DefaultSession } from "next-auth"
// O import é o que torna o módulo resolvível para a augmentação logo abaixo.
import type { JWT } from "next-auth/jwt"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "./prisma"

export const runtime = "nodejs"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "ADMIN" | "ALUNO"
    } & DefaultSession["user"]
  }

  interface User {
    role?: "ADMIN" | "ALUNO"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: "ADMIN" | "ALUNO"
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
    updateAge: 24 * 60 * 60, // renova o token a cada 24h de uso
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },

      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim()
        const senha = String(credentials?.password ?? "")

        if (!email || !senha) return null

        const usuario = await prisma.user.findUnique({ where: { email } })

        // Compara o hash mesmo quando o usuário não existe, para que o tempo de
        // resposta não revele quais e-mails estão cadastrados.
        const hashComparacao =
          usuario?.senha ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin"
        const senhaConfere = await bcrypt.compare(senha, hashComparacao)

        await prisma.loginAttempt.create({
          data: { email, sucesso: Boolean(usuario && senhaConfere) },
        })

        if (!usuario || !senhaConfere) return null

        // O portão de acesso: conta existe, senha certa, mas o ADMIN ainda não
        // liberou. Recusamos igual a senha errada — de propósito. Distinguir os
        // dois casos entregaria a quem tenta adivinhar a informação de quais
        // e-mails existem no portal.
        if (!usuario.ativo) return null

        await prisma.user.update({
          where: { id: usuario.id },
          data: { ultimoAcesso: new Date() },
        })

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          role: usuario.role,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      // No login, copia identidade e papel para dentro do token.
      if (user) {
        token.id = user.id
        token.role = user.role
      }

      // Em atualização explícita da sessão, relê o papel do banco: assim uma
      // promoção ou desativação feita pelo ADMIN não espera 30 dias para valer.
      if (trigger === "update" && token.id) {
        const atual = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true, ativo: true },
        })
        if (!atual?.ativo) return null
        token.role = atual.role
      }

      return token
    },

    async session({ session, token }) {
      if (token.id) session.user.id = token.id
      session.user.role = token.role ?? "ALUNO"
      return session
    },
  },
})
