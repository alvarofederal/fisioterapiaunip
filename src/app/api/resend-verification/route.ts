// src/app/api/resend-verification/route.ts - MANTER ESTE
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendVerificationEmail } from "@/lib/email"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      )
    }

    // ✅ Rate Limiting - 3 tentativas por hora (por email + IP)
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown"
    
    const { allowed } = await checkRateLimit(`resend:${email}:${ip}`, 3, 60 * 60 * 1000)
    
    if (!allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em 1 hora." },
        { status: 429 }
      )
    }

    // ✅ Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Email não encontrado" },
        { status: 404 }
      )
    }

    // ✅ Verificar se já está verificado
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Este email já foi verificado" },
        { status: 400 }
      )
    }

    // ✅ Deletar tokens antigos
    await prisma.authToken.deleteMany({
      where: {
        userId: user.id,
        type: "EMAIL_VERIFICATION"
      }
    })

    // ✅ Gerar novo código
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // ✅ Criar novo token (15 minutos — tempo suficiente para o email chegar)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    await prisma.authToken.create({
      data: {
        userId: user.id,
        token: verificationCode,
        type: "EMAIL_VERIFICATION",
        expiresAt,
      }
    })

    // ✅ Enviar email
    try {
      await sendVerificationEmail(email, verificationCode, 15)
    } catch (emailError) {
      console.error("Erro ao enviar email:", emailError)
      return NextResponse.json(
        { error: "Erro ao enviar email. Tente novamente." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Código reenviado com sucesso!",
        expiresAt: expiresAt.toISOString()
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("❌ Erro ao reenviar código:", error)
    return NextResponse.json(
      { error: "Erro ao reenviar código. Tente novamente." },
      { status: 500 }
    )
  }
}