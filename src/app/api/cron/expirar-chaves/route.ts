import { NextResponse } from "next/server"
import { db } from "@/lib/prisma"

/**
 * Expiração automática de chaves e campanhas vencidas.
 *
 * Vercel Cron chama com:  Authorization: Bearer <CRON_SECRET>
 * Chamadas manuais podem usar: x-cron-secret: <CRON_SECRET>
 *
 * vercel.json:  { "path": "/api/cron/expirar-chaves", "schedule": "0 3 * * *" }
 * → roda todos os dias às 03:00 UTC (meia-noite BRT)
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET

  // Aceita tanto o header do Vercel Cron quanto chamadas manuais
  const authHeader  = request.headers.get("authorization")
  const secretHeader = request.headers.get("x-cron-secret")

  const autorizado =
    (secret && authHeader === `Bearer ${secret}`) ||
    (secret && secretHeader === secret) ||
    process.env.NODE_ENV === "development"  // dev: sem autenticação

  if (!autorizado) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const agora = new Date()

  // 1. Expirar chaves cujas campanhas já venceram
  const { count: chavesExpiradas } = await db.chave.updateMany({
    where: {
      status: { in: ["GERADA", "CONSULTADA", "ATIVADA"] },
      campanha: { expiraEm: { lt: agora } },
    },
    data: { status: "EXPIRADA" },
  })

  // 2. Encerrar campanhas vencidas que ainda estão ATIVA ou PAUSADA
  const { count: campanhasEncerradas } = await db.campanha.updateMany({
    where: {
      status: { in: ["ATIVA", "PAUSADA"] },
      expiraEm: { lt: agora },
    },
    data: { status: "ENCERRADA" },
  })

  console.log(
    `[cron/expirar-chaves] ${chavesExpiradas} chaves expiradas, ${campanhasEncerradas} campanhas encerradas — ${agora.toISOString()}`,
  )

  return NextResponse.json({
    ok: true,
    chavesExpiradas,
    campanhasEncerradas,
    executadoEm: agora.toISOString(),
  })
}
