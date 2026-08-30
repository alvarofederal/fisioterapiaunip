import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"

function csvQuote(v: string | null | undefined): string {
  if (v == null) return ""
  const s = String(v)
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function fmtDate(d: Date | null): string {
  if (!d) return ""
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ loteId: string }> },
) {
  const session = await auth()
  if (!session?.user?.lojaId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { loteId } = await params

  const lote = await db.loteChave.findUnique({
    where: { id: loteId },
    include: { campanha: { select: { nome: true } } },
  })

  if (!lote || lote.lojaId !== session.user.lojaId) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }

  const chaves = await db.chave.findMany({
    where: { loteId },
    orderBy: { criadoEm: "asc" },
    select: {
      codigo: true,
      status: true,
      landingUrl: true,
      criadoEm: true,
      ativadaEm: true,
      resgatadaEm: true,
      cliente: { select: { nome: true, telefone: true, email: true } },
    },
  })

  const header = [
    "codigo",
    "status",
    "url",
    "criado_em",
    "ativado_em",
    "resgatado_em",
    "cliente_nome",
    "cliente_telefone",
    "cliente_email",
  ].join(",")

  const rows = chaves.map((c) =>
    [
      csvQuote(c.codigo),
      csvQuote(c.status),
      csvQuote(c.landingUrl),
      csvQuote(fmtDate(c.criadoEm)),
      csvQuote(fmtDate(c.ativadaEm)),
      csvQuote(fmtDate(c.resgatadaEm)),
      csvQuote(c.cliente?.nome),
      csvQuote(c.cliente?.telefone),
      csvQuote(c.cliente?.email),
    ].join(","),
  )

  // BOM UTF-8 para Excel abrir corretamente
  const csv = "﻿" + [header, ...rows].join("\n")

  const nomeLote = (lote.descricao ?? `lote-${loteId.slice(0, 8)}`)
    .replace(/\s+/g, "-")
    .toLowerCase()

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeLote}.csv"`,
    },
  })
}
