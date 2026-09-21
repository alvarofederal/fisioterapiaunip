export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { registerSchema } from "@/lib/validators/auth"
import { checkRateLimit } from "@/lib/rate-limit"

/**
 * Auto-cadastro do aluno.
 *
 * A conta é criada SEMPRE com `ativo: false`. Quem libera é o ADMIN, na tela
 * de Usuários. É isso que impede que alguém de fora da turma entre no portal.
 */
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
    const validacao = registerSchema.safeParse(body)

    if (!validacao.success) {
      return NextResponse.json(
        { error: validacao.error.issues[0].message },
        { status: 400 }
      )
    }

    const { ra, nome, email, password } = validacao.data

    const jaExiste = await prisma.user.findFirst({
      where: { OR: [{ email }, { ra }] },
      select: { email: true, ra: true },
    })

    if (jaExiste) {
      return NextResponse.json(
        {
          error:
            jaExiste.email === email
              ? "Este e-mail já está cadastrado."
              : "Este RA já está cadastrado. Se não foi você, fale com o administrador da turma.",
        },
        { status: 400 }
      )
    }

    const senhaHash = await bcrypt.hash(password, 12)

    // O primeiro usuário do portal nasce ADMIN e já ativo: sem isso não há
    // como liberar ninguém, e o sistema ficaria trancado para sempre.
    const portalVazio = (await prisma.user.count()) === 0

    await prisma.user.create({
      data: {
        ra,
        nome,
        email,
        senha: senhaHash,
        role: portalVazio ? "ADMIN" : "ALUNO",
        ativo: portalVazio,
      },
    })

    // Quem o aluno procura se a liberação demorar. Vem do banco: nenhum
    // contato fica escrito no código.
    const admin = portalVazio
      ? null
      : await prisma.user.findFirst({
          where: { role: "ADMIN", ativo: true },
          select: { nome: true, email: true },
          orderBy: { criadoEm: "asc" },
        })

    return NextResponse.json(
      {
        success: true,
        primeiroAcesso: portalVazio,
        admin,
        message: portalVazio
          ? "Conta de administrador criada! Você já pode entrar."
          : "Conta criada! Aguarde a liberação do administrador da turma.",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erro no cadastro:", error)
    return NextResponse.json(
      { error: "Erro ao criar conta. Tente novamente." },
      { status: 500 }
    )
  }
}
