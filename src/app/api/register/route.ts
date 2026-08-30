export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { registerSchema } from "@/lib/validators/auth"
import { sendVerificationEmail } from "@/lib/email"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown"

    const { allowed } = await checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em 1 hora." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const isDev = process.env.NODE_ENV === "development"

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        // Em dev, pula verificação de email automaticamente
        emailVerified: isDev ? new Date() : null,
      },
    })

    if (isDev) {
      console.log(`\n🚀 [DEV] Conta criada e verificada automaticamente: ${email}\n`)
      return NextResponse.json(
        { success: true, message: "Conta criada!", userId: user.id, devAutoVerified: true },
        { status: 201 }
      )
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    await prisma.authToken.create({
      data: {
        userId: user.id,
        token: verificationCode,
        type: "EMAIL_VERIFICATION",
        expiresAt,
      },
    })

    try {
      await sendVerificationEmail(email, verificationCode, 15)
    } catch (emailError) {
      console.error("Erro ao enviar email:", emailError)
    }

    return NextResponse.json(
      {
        success: true,
        message: "Conta criada! Verifique seu email.",
        userId: user.id,
        expiresAt: expiresAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erro no registro:", error)
    return NextResponse.json(
      { error: "Erro ao criar conta. Tente novamente." },
      { status: 500 }
    )
  }
}
