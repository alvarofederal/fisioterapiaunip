import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const campanhas = await db.campanha.findMany({
    where: {
      criadoEm: { gte: since },
      ...(session.user.role !== "SUPER_ADMIN" && session.user.lojaId
        ? { lojaId: session.user.lojaId }
        : {}),
    },
    select: {
      id: true,
      nome: true,
      status: true,
      criadoEm: true,
      loja: { select: { nome: true } },
    },
    orderBy: { criadoEm: "desc" },
    take: 20,
  })

  return NextResponse.json({ campanhas })
}
