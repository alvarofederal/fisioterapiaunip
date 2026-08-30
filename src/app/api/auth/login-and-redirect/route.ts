export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import crypto from "crypto"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // ✅ Rate limiting — 10 tentativas por IP a cada 15 minutos (brute-force protection)
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown"

    const { allowed } = await checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)

    if (!allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true, emailVerified: true },
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      )
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Email não verificado", code: "EMAIL_NOT_VERIFIED" },
        { status: 401 }
      )
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      )
    }

    await prisma.session.deleteMany({ where: { userId: user.id } })

    const sessionToken = crypto.randomUUID()
    const expires = new Date()
    expires.setDate(expires.getDate() + 30)

    await prisma.session.create({
      data: { sessionToken, userId: user.id, expires },
    })

    const response = NextResponse.json({ success: true, redirectTo: "/dashboard" })

    const cookieName =
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token"

    response.cookies.set({
      name: cookieName,
      value: sessionToken,
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Erro no login:", error)
    return NextResponse.json({ error: "Erro ao fazer login" }, { status: 500 })
  }
}
