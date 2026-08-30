import NextAuth, { DefaultSession, type User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import prisma from "./prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Adapter, AdapterUser } from "next-auth/adapters"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const runtime = "nodejs"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      lojaId: string | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    lojaId?: string | null
  }
}

function customAdapter(p: typeof prisma): Adapter {
  const baseAdapter = PrismaAdapter(p)

  return {
    ...baseAdapter,

    async getUserByAccount(account) {
      const dbAccount = await p.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        include: { user: true },
      })

      if (!dbAccount) return null

      if (!dbAccount.user) {
        await p.account.delete({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        })
        return null
      }

      return dbAccount.user as unknown as AdapterUser
    },

    async getUserByEmail(email) {
      const user = await p.user.findUnique({ where: { email } })
      if (!user) return null
      return user as unknown as AdapterUser
    },

    async linkAccount(account) {
      const existing = await p.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
      })

      if (existing) return

      await p.account.create({ data: account })

      await p.user.update({
        where: { id: account.userId },
        data: { emailVerified: new Date() },
      })
    },

    async createSession(session) {
      return p.session.create({ data: session })
    },

    async getSessionAndUser(sessionToken) {
      const result = await p.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      })

      if (!result) return null

      const { user, ...session } = result
      return { user: user as unknown as AdapterUser, session }
    },

    async updateSession(session) {
      return p.session.update({
        where: { sessionToken: session.sessionToken! },
        data: session,
      })
    },

    async deleteSession(sessionToken) {
      await p.session.delete({ where: { sessionToken } })
    },
  } as Adapter
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: customAdapter(prisma),
  trustHost: true,

  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    GitHub({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.username as string },
        })

        if (!user || !user.password) return null

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        } as User
      },
    }),
  ],

  callbacks: {
    async session({ session, user }) {
      if (user) {
        session.user.id = user.id

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, lojaId: true },
        })

        session.user.role = dbUser?.role ?? "LOJISTA"
        session.user.lojaId = dbUser?.lojaId ?? null
      }

      return session
    },

    async signIn({ user, account }) {
      if (account?.provider !== "credentials") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        })

        if (existingUser && !existingUser.emailVerified) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { emailVerified: new Date() },
          })
        }
      }

      return true
    },
  },

  pages: {
    signIn: "/login",
  },
})
