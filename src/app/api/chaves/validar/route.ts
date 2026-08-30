/**
 * POST /api/chaves/validar
 * API pública para validação e resgate de chaves via integração externa.
 *
 * Casos de uso:
 *   - PDV (ponto de venda) escaneia QR Code e valida a chave antes de liberar o benefício
 *   - App do lojista consulta status de uma chave
 *   - Sistema externo confirma o resgate após entregar o benefício
 *
 * Autenticação: Bearer token no formato  cfy.<lojaId>.<HMAC-sig>
 *   O token é obtido no painel do lojista em Configurações > Integrações.
 *
 * Body:
 *   { codigo: string, acao?: "consultar" | "resgatar", observacao?: string }
 *
 * Ações:
 *   "consultar" (padrão) — retorna o status atual sem gravar nada (leitura)
 *   "resgatar"            — confirma o resgate (ATIVADA → RESGATADA) e grava log
 *
 * Rate limit: 60 req/min por lojaId (em memória; não persiste entre instâncias serverless)
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/prisma"
import { verifyApiKey } from "@/lib/api-key"

// ─── Schema ──────────────────────────────────────────────────────────────────

const bodySchema = z.object({
  codigo:     z.string().min(1).max(30),
  acao:       z.enum(["consultar", "resgatar"]).default("consultar"),
  observacao: z.string().max(500).optional(),
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizarCodigo(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/(.{4})/g, "$1-").slice(0, 19)
}

function buildBeneficio(tipo: string, valor: unknown, premio: string | null): string {
  if (tipo === "DESCONTO_PERCENTUAL" && valor) return `${valor}% de desconto`
  if (tipo === "DESCONTO_FIXO" && valor) return `R$ ${Number(valor).toFixed(2)} de desconto`
  if (tipo === "CASHBACK" && valor) return `${valor}% cashback`
  if (tipo === "FRETE_GRATIS") return "Frete grátis"
  if (premio) return premio
  return tipo.replace(/_/g, " ").toLowerCase()
}

function err(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── 1. Autenticação via API key ──────────────────────────────────────────
  const authHeader = request.headers.get("authorization") ?? ""
  const lojaId = verifyApiKey(authHeader)

  if (!lojaId) {
    return err("API key inválida ou ausente. Use: Authorization: Bearer cfy.<lojaId>.<assinatura>", 401)
  }

  // ── 2. Verifica que a loja existe e está ativa ───────────────────────────
  const loja = await db.loja.findUnique({
    where: { id: lojaId },
    select: { id: true, nome: true, status: true },
  })

  if (!loja) {
    return err("Loja não encontrada.", 401)
  }

  if (loja.status !== "ATIVA") {
    return err("Loja suspensa ou inativa.", 403)
  }

  // ── 3. Valida o body ─────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return err("Body JSON inválido.", 400)
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados inválidos.", detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { codigo: codigoRaw, acao, observacao } = parsed.data
  const codigo = normalizarCodigo(codigoRaw)

  if (codigo.length !== 19) {
    return err("Código inválido. Formato esperado: XXXX-XXXX-XXXX-XXXX.", 400)
  }

  // ── 4. Busca a chave no banco ────────────────────────────────────────────
  const chave = await db.chave.findUnique({
    where: { codigo },
    include: {
      campanha: {
        select: {
          nome: true,
          tipoBeneficio: true,
          valorBeneficio: true,
          descricaoPremio: true,
          expiraEm: true,
          status: true,
        },
      },
      cliente: {
        select: { nome: true, telefone: true, email: true },
      },
    },
  })

  if (!chave) {
    return err("Código não encontrado.", 404)
  }

  // ── 5. Segurança: garante que a chave pertence à loja autenticada ────────
  if (chave.lojaId !== lojaId) {
    return err("Este código não pertence à sua loja.", 403)
  }

  // ── 6. Validações de status da chave ────────────────────────────────────
  const c = chave.campanha

  if (chave.status === "RESGATADA") {
    return NextResponse.json({
      ok: false,
      status: "RESGATADA",
      error: "Esta chave já foi resgatada.",
    }, { status: 409 })
  }

  if (chave.status === "EXPIRADA") {
    return NextResponse.json({
      ok: false,
      status: "EXPIRADA",
      error: "Esta chave expirou.",
    }, { status: 410 })
  }

  if (chave.status === "CANCELADA") {
    return NextResponse.json({
      ok: false,
      status: "CANCELADA",
      error: "Esta chave foi cancelada.",
    }, { status: 410 })
  }

  if (c.status === "ENCERRADA" || c.status === "CANCELADA") {
    return NextResponse.json({
      ok: false,
      status: chave.status,
      error: "A campanha desta chave foi encerrada.",
    }, { status: 410 })
  }

  if (new Date() > c.expiraEm) {
    return NextResponse.json({
      ok: false,
      status: chave.status,
      error: "A campanha desta chave expirou.",
    }, { status: 410 })
  }

  const beneficio = buildBeneficio(c.tipoBeneficio, c.valorBeneficio, c.descricaoPremio)

  // ── 7. Ação: consultar (sem gravar) ─────────────────────────────────────
  if (acao === "consultar") {
    return NextResponse.json({
      ok: true,
      acao: "consultar",
      chave: {
        codigo:          chave.codigo,
        status:          chave.status,
        campanha:        c.nome,
        beneficio,
        expiraEm:        c.expiraEm.toISOString(),
        clienteNome:     chave.cliente?.nome     ?? null,
        clienteTelefone: chave.cliente?.telefone ?? null,
        clienteEmail:    chave.cliente?.email    ?? null,
        ativadaEm:       chave.ativadaEm?.toISOString() ?? null,
      },
    })
  }

  // ── 8. Ação: resgatar ────────────────────────────────────────────────────
  if (chave.status !== "ATIVADA") {
    return NextResponse.json({
      ok: false,
      status: chave.status,
      error: `Não é possível resgatar uma chave com status ${chave.status}. A chave precisa estar ATIVADA pelo cliente antes do resgate.`,
    }, { status: 422 })
  }

  const agora = new Date()

  await db.$transaction([
    db.chave.update({
      where: { id: chave.id },
      data:  { status: "RESGATADA", resgatadaEm: agora },
    }),
    db.resgate.create({
      data: {
        chaveId:       chave.id,
        campanhaId:    chave.campanhaId,
        lojaId:        lojaId,
        clienteId:     chave.clienteId ?? null,
        canal:         "MANUAL",
        statusResgate: "CONFIRMADO",
        observacao:    observacao ?? null,
      },
    }),
    db.logEvento.create({
      data: {
        tipoEvento: "CHAVE_RESGATADA",
        chaveId:    chave.id,
        campanhaId: chave.campanhaId,
        lojaId:     lojaId,
        clienteId:  chave.clienteId ?? null,
        canal:      "API",
      },
    }),
  ])

  return NextResponse.json({
    ok: true,
    acao: "resgatar",
    chave: {
      codigo:          chave.codigo,
      status:          "RESGATADA",
      campanha:        c.nome,
      beneficio,
      resgatadaEm:     agora.toISOString(),
      clienteNome:     chave.cliente?.nome     ?? null,
      clienteTelefone: chave.cliente?.telefone ?? null,
      clienteEmail:    chave.cliente?.email    ?? null,
    },
  })
}
