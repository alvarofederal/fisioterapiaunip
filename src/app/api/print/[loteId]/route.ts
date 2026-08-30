// API Route: gera PDF real no servidor — sem window.print(), sem dialog do browser.
// Retorna application/pdf → browser abre no visualizador nativo (Chrome PDF viewer).
// Qualidade máxima: texto e QR vetoriais, logos em alta resolução da fonte original.

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import QRCode from "qrcode"
// jsPDF: import type apenas (apagado em runtime) — a instância é criada via dynamic import
// no handler para evitar erros de DOM globals no carregamento do módulo no servidor.
import type { jsPDF as JsPDFType } from "jspdf"

// ─── Constantes ───────────────────────────────────────────────────────────────

const A4_W = 210   // mm
const A4_H = 297   // mm
const MARGIN = 8   // mm
const GAP = 4      // mm entre cards

const CARTAO_W = 70
const CARTAO_H = 35

const MDF_W = 90
const MDF_H = 90

// 1mm = 2.83465pt (jsPDF setFontSize usa pt mesmo no modo mm)
function fsPt(mm: number) { return mm * 2.83465 }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

function keyColorRgb(hex: string): [number, number, number] {
  try { return hexToRgb(hex) } catch { return [0, 0, 0] }
}

/** Força JPEG para Cloudinary (evita WebP que jsPDF não suporta) */
function toJpegUrl(url: string): string {
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/f_jpg,q_95,w_400/")
  }
  return url
}

async function loadImageBase64(
  url: string,
): Promise<{ data: string; format: "JPEG" | "PNG" } | null> {
  try {
    const safeUrl = toJpegUrl(url)
    const res = await fetch(safeUrl, { cache: "no-store" })
    if (!res.ok) return null
    const ct = res.headers.get("content-type") ?? "image/jpeg"
    const buf = await res.arrayBuffer()
    const b64 = Buffer.from(buf).toString("base64")
    const format: "JPEG" | "PNG" = ct.includes("png") ? "PNG" : "JPEG"
    return { data: `data:${ct};base64,${b64}`, format }
  } catch {
    return null
  }
}

async function generateQrPng(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 0,
    errorCorrectionLevel: "H",
    color: { dark: "#111827", light: "#ffffff" },
  })
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
}

function buildBenefit(
  tipo: string,
  valor: string | null,
  premio: string | null,
  descricao: string | null,
): { main: string; sub: string } {
  const v = valor ? parseFloat(valor) : null
  switch (tipo) {
    case "DESCONTO_PERCENTUAL":
      return { main: v ? `${v}% OFF` : "Desconto", sub: descricao ?? "" }
    case "DESCONTO_FIXO":
      return {
        main: v
          ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} OFF`
          : "Desconto",
        sub: descricao ?? "",
      }
    case "BRINDE":
      return { main: premio ?? "Brinde", sub: descricao ?? "" }
    case "SORTEIO":
      return { main: premio ?? "Sorteio", sub: descricao ?? "" }
    case "FRETE_GRATIS":
      return { main: "Frete Grátis", sub: descricao ?? "" }
    default:
      return { main: descricao ?? "Benefício", sub: "" }
  }
}

// ─── Truncate text para não vazar do card ─────────────────────────────────────

function truncate(doc: JsPDFType, text: string, maxMm: number): string {
  if (doc.getTextWidth(text) <= maxMm) return text
  let t = text
  while (t.length > 1 && doc.getTextWidth(t + "…") > maxMm) {
    t = t.slice(0, -1)
  }
  return t + "…"
}

// ─── Desenho de CartaoCard (70×35mm) ─────────────────────────────────────────

function drawCartao(
  doc: JsPDFType,
  cx: number,
  cy: number,
  opts: {
    codigo: string
    landingUrl: string | null
    campanhaNome: string
    main: string
    sub: string
    expiraEm: string
    lojaNome: string
    brand: [number, number, number]
    logoImg: { data: string; format: "JPEG" | "PNG" } | null
    qrImg: string | null
    keyPos: { x: number; y: number } | null
    keyColor: string
    keySize: number
    modoLimpo: boolean
  },
) {
  const { brand, codigo, lojaNome, campanhaNome, main, sub, expiraEm,
          logoImg, qrImg, keyPos, keyColor, keySize, modoLimpo } = opts
  const [br, bg, bb] = brand
  const W = CARTAO_W, H = CARTAO_H

  // ── Fundo do card ────────────────────────────────────────────────────────
  doc.setFillColor(255, 253, 247)
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.2)
  doc.roundedRect(cx, cy, W, H, 1.5, 1.5, "FD")

  if (modoLimpo) {
    // modo arte própria — só chave
    drawKeyBadge(doc, cx, cy, W, H, codigo, keyPos, keyColor, keySize)
    return
  }

  // ── Faixa lateral esquerda ───────────────────────────────────────────────
  doc.setFillColor(br, bg, bb)
  doc.roundedRect(cx, cy, 1.5, H, 0.75, 0.75, "F")
  // cobrir borda direita da faixa (não arredondada)
  doc.rect(cx + 0.75, cy, 0.75, H, "F")

  // ── Logo ─────────────────────────────────────────────────────────────────
  const logoSz = 9
  const logoX = cx + 3.5
  const logoCY = cy + H / 2 - 2.5

  if (logoImg) {
    // Borda circular simulada: quadrado com bordas arredondadas
    doc.setFillColor(br, bg, bb)
    doc.roundedRect(logoX - 0.5, logoCY - 0.5, logoSz + 1, logoSz + 1, (logoSz + 1) / 2, (logoSz + 1) / 2, "F")
    doc.addImage(logoImg.data, logoImg.format, logoX, logoCY, logoSz, logoSz, undefined, "FAST")
  } else {
    doc.setFillColor(br, bg, bb)
    doc.roundedRect(logoX, logoCY, logoSz, logoSz, logoSz / 2, logoSz / 2, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(fsPt(3))
    doc.text(initials(lojaNome), logoX + logoSz / 2, logoCY + logoSz * 0.65, { align: "center" })
  }

  // Nome da loja abaixo do logo
  doc.setTextColor(br, bg, bb)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(fsPt(1.75))
  const nomeMax = 13
  const nomeTrunc = truncate(doc, lojaNome.toUpperCase(), nomeMax)
  doc.text(nomeTrunc, logoX + logoSz / 2, logoCY + logoSz + 2.5, { align: "center" })

  // ── Coluna de informações ────────────────────────────────────────────────
  const infoX = cx + 20
  const infoMaxW = 27

  // Nome da campanha
  doc.setTextColor(90, 62, 40)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(fsPt(1.75))
  doc.text(truncate(doc, campanhaNome.toUpperCase(), infoMaxW), infoX, cy + 8)

  // Benefício principal
  doc.setTextColor(br, bg, bb)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(fsPt(3.5))
  doc.text(truncate(doc, main, infoMaxW), infoX, cy + 16)

  // Sub texto
  if (sub) {
    doc.setTextColor(119, 119, 119)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(fsPt(1.55))
    doc.text(truncate(doc, sub, infoMaxW), infoX, cy + 21.5)
  }

  // Validade
  doc.setTextColor(170, 170, 170)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(fsPt(1.5))
  doc.text(`Válido até: ${expiraEm}`, infoX, cy + H - 3)

  // ── QR Code ──────────────────────────────────────────────────────────────
  const qrSz = 13
  const qrX = cx + 51.5
  const qrY = cy + H / 2 - qrSz / 2

  doc.setDrawColor(br, bg, bb)
  doc.setLineWidth(0.5)
  doc.roundedRect(qrX - 0.8, qrY - 0.8, qrSz + 1.6, qrSz + 1.6, 1, 1, "S")

  if (qrImg) {
    doc.addImage(qrImg, "PNG", qrX, qrY, qrSz, qrSz, undefined, "FAST")
  }

  doc.setTextColor(170, 170, 170)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(fsPt(1.4))
  doc.text("Escaneie e ative", qrX + qrSz / 2, qrY + qrSz + 2.5, { align: "center" })

  // ── Marca d'água ─────────────────────────────────────────────────────────
  doc.setTextColor(
    Math.round(br * 0.25 + 191),
    Math.round(bg * 0.25 + 191),
    Math.round(bb * 0.25 + 191),
  )
  doc.setFontSize(fsPt(1.2))
  doc.text("courtesyfy.com.br", cx + W - 2, cy + H - 1, { align: "right" })

  // ── Chave ─────────────────────────────────────────────────────────────────
  drawKeyBadge(doc, cx, cy, W, H, codigo, keyPos, keyColor, keySize)
}

// ─── Desenho de MdfCard (90×90mm) ────────────────────────────────────────────

function drawMdf(
  doc: JsPDFType,
  cx: number,
  cy: number,
  opts: {
    codigo: string
    landingUrl: string | null
    campanhaNome: string
    main: string
    sub: string
    expiraEm: string
    lojaNome: string
    brand: [number, number, number]
    logoImg: { data: string; format: "JPEG" | "PNG" } | null
    qrImg: string | null
    keyPos: { x: number; y: number } | null
    keyColor: string
    keySize: number
    modoLimpo: boolean
  },
) {
  const { brand, codigo, lojaNome, campanhaNome, main, sub, expiraEm,
          logoImg, qrImg, keyPos, keyColor, keySize, modoLimpo } = opts
  const [br, bg, bb] = brand
  const W = MDF_W, H = MDF_H

  // Fundo
  doc.setFillColor(255, 253, 247)
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.2)
  doc.roundedRect(cx, cy, W, H, 3, 3, "FD")

  if (modoLimpo) {
    drawKeyBadge(doc, cx, cy, W, H, codigo, keyPos, keyColor, keySize)
    return
  }

  // Faixa superior
  doc.setFillColor(br, bg, bb)
  doc.roundedRect(cx, cy, W, 1.5, 0.75, 0.75, "F")
  doc.rect(cx, cy + 0.75, W, 0.75, "F")

  // Logo
  const logoSz = 18
  const logoCX = cx + W / 2 - logoSz / 2
  const logoTop = cy + 4

  if (logoImg) {
    doc.setFillColor(br, bg, bb)
    doc.roundedRect(logoCX - 0.5, logoTop - 0.5, logoSz + 1, logoSz + 1, (logoSz + 1) / 2, (logoSz + 1) / 2, "F")
    doc.addImage(logoImg.data, logoImg.format, logoCX, logoTop, logoSz, logoSz, undefined, "FAST")
  } else {
    doc.setFillColor(br, bg, bb)
    doc.roundedRect(logoCX, logoTop, logoSz, logoSz, logoSz / 2, logoSz / 2, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(fsPt(6))
    doc.text(initials(lojaNome), cx + W / 2, logoTop + logoSz * 0.65, { align: "center" })
  }

  // Nome da loja
  doc.setTextColor(br, bg, bb)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(fsPt(2.2))
  doc.text(
    truncate(doc, lojaNome.toUpperCase(), W - 6),
    cx + W / 2,
    logoTop + logoSz + 3.5,
    { align: "center" },
  )

  // ── Benefício ────────────────────────────────────────────────────────────
  const benefY = cy + 31

  doc.setTextColor(90, 62, 40)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(fsPt(2.2))
  doc.text(
    truncate(doc, campanhaNome.toUpperCase(), W - 6),
    cx + W / 2,
    benefY,
    { align: "center" },
  )

  doc.setTextColor(br, bg, bb)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(fsPt(6))
  doc.text(truncate(doc, main, W - 4), cx + W / 2, benefY + 8, { align: "center" })

  if (sub) {
    doc.setTextColor(119, 119, 119)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(fsPt(2))
    doc.text(truncate(doc, sub, W - 8), cx + W / 2, benefY + 14, { align: "center" })
  }

  // ── QR Code ──────────────────────────────────────────────────────────────
  const qrSz = 26
  const qrX = cx + W / 2 - qrSz / 2
  const qrY = cy + 52

  doc.setDrawColor(br, bg, bb)
  doc.setLineWidth(0.5)
  doc.roundedRect(qrX - 1, qrY - 1, qrSz + 2, qrSz + 2, 1.5, 1.5, "S")

  if (qrImg) {
    doc.addImage(qrImg, "PNG", qrX, qrY, qrSz, qrSz, undefined, "FAST")
  }

  // Validade
  doc.setTextColor(170, 170, 170)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(fsPt(1.8))
  doc.text(`Válido até: ${expiraEm}`, cx + W / 2, qrY + qrSz + 4, { align: "center" })

  // Marca d'água
  doc.setTextColor(
    Math.round(br * 0.25 + 191),
    Math.round(bg * 0.25 + 191),
    Math.round(bb * 0.25 + 191),
  )
  doc.setFontSize(fsPt(1.4))
  doc.text("courtesyfy.com.br", cx + W - 2, cy + H - 1.5, { align: "right" })

  drawKeyBadge(doc, cx, cy, W, H, codigo, keyPos, keyColor, keySize)
}

// ─── KeyBadge no PDF ──────────────────────────────────────────────────────────

function drawKeyBadge(
  doc: JsPDFType,
  cx: number,
  cy: number,
  W: number,
  H: number,
  codigo: string,
  keyPos: { x: number; y: number } | null,
  keyColor: string,
  keySize: number,
) {
  if (!keyPos) return

  const kx = cx + (keyPos.x / 100) * W
  const ky = cy + (keyPos.y / 100) * H
  const [kr, kg, kb] = keyColorRgb(keyColor)
  const sizeMm = keySize * 0.25

  doc.setFont("courier", "bold")
  doc.setFontSize(fsPt(sizeMm))

  const tw = doc.getTextWidth(codigo)
  const padX = 1.5
  const padY = sizeMm * 0.5

  // Badge background
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(kr, kg, kb)
  doc.setLineWidth(0.35)
  doc.roundedRect(
    kx - tw / 2 - padX,
    ky - padY - sizeMm * 0.35,
    tw + padX * 2,
    sizeMm + padY * 2,
    1.2,
    1.2,
    "FD",
  )

  doc.setTextColor(kr, kg, kb)
  doc.text(codigo, kx, ky + sizeMm * 0.4, { align: "center" })
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ loteId: string }> },
) {
  const session = await auth()
  if (!session?.user?.lojaId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { loteId } = await params
  const sp = req.nextUrl.searchParams

  const formato = sp.get("formato") === "mdf" ? "mdf" : "cartao"
  const modoLimpo = sp.get("modoLimpo") === "1"

  const kx = sp.get("keyX")
  const ky = sp.get("keyY")
  const keyPos = kx && ky ? { x: parseFloat(kx), y: parseFloat(ky) } : null
  const keyColor = sp.get("keyColor") ?? null
  const keySize = parseInt(sp.get("keySize") ?? "11")

  // ── Buscar dados ─────────────────────────────────────────────────────────
  const lote = await db.loteChave.findUnique({
    where: { id: loteId },
    include: {
      campanha: {
        select: {
          nome: true,
          tipoBeneficio: true,
          valorBeneficio: true,
          descricaoPremio: true,
          descricao: true,
          expiraEm: true,
          layout: {
            select: { corPrimaria: true, imagem2Url: true },
          },
        },
      },
    },
  })

  if (!lote || lote.lojaId !== session.user.lojaId) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }

  const loja = await db.loja.findUnique({
    where: { id: session.user.lojaId },
    select: { nome: true, nomeExibicao: true, logoUrl: true, corPrimaria: true },
  })

  if (!loja) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 })

  const chaves = await db.chave.findMany({
    where: { loteId },
    orderBy: { criadoEm: "asc" },
    select: { codigo: true, landingUrl: true },
  })

  const corPrimaria = lote.campanha.layout?.corPrimaria ?? loja.corPrimaria
  const brand = hexToRgb(corPrimaria)
  const logoUrl = lote.campanha.layout?.imagem2Url ?? loja.logoUrl
  const lojaNome = loja.nomeExibicao ?? loja.nome
  const expiraEm = lote.campanha.expiraEm.toLocaleDateString("pt-BR")
  const { main, sub } = buildBenefit(
    lote.campanha.tipoBeneficio,
    lote.campanha.valorBeneficio?.toString() ?? null,
    lote.campanha.descricaoPremio,
    lote.campanha.descricao,
  )

  const resolvedKeyColor = keyColor ?? corPrimaria

  // ── Pré-carregar imagem de logo (uma só vez para todos os cards) ──────────
  const logoImg = logoUrl ? await loadImageBase64(logoUrl) : null

  // ── Gerar QR codes em paralelo ───────────────────────────────────────────
  const qrImgs = await Promise.all(
    chaves.map((c) =>
      c.landingUrl ? generateQrPng(c.landingUrl) : Promise.resolve(null),
    ),
  )

  // ── Montar PDF ───────────────────────────────────────────────────────────
  // Dynamic import: garante que jsPDF é carregado no contexto Node.js (runtime),
  // nunca no parse-time — evita ReferenceError de window/document no servidor.
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })

  const cardW = formato === "cartao" ? CARTAO_W : MDF_W
  const cardH = formato === "cartao" ? CARTAO_H : MDF_H
  const cols = 2
  const cardsPerPage = Math.floor(
    ((A4_H - MARGIN * 2 + GAP) / (cardH + GAP)) * cols,
  )

  for (let i = 0; i < chaves.length; i++) {
    const pageIdx = Math.floor(i / cardsPerPage)
    const cardOnPage = i % cardsPerPage

    if (cardOnPage === 0 && i > 0) doc.addPage()

    const col = cardOnPage % cols
    const row = Math.floor(cardOnPage / cols)

    const cx = MARGIN + col * (cardW + GAP)
    const cy = MARGIN + row * (cardH + GAP)

    const drawOpts = {
      codigo: chaves[i].codigo,
      landingUrl: chaves[i].landingUrl,
      campanhaNome: lote.campanha.nome,
      main,
      sub,
      expiraEm,
      lojaNome,
      brand,
      logoImg,
      qrImg: qrImgs[i],
      keyPos,
      keyColor: resolvedKeyColor,
      keySize,
      modoLimpo,
    }

    if (formato === "cartao") {
      drawCartao(doc, cx, cy, drawOpts)
    } else {
      drawMdf(doc, cx, cy, drawOpts)
    }
  }

  // ── Retornar PDF ─────────────────────────────────────────────────────────
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"))
  const nomeLote = (lote.descricao ?? `lote-${loteId.slice(0, 8)}`).replace(/\s+/g, "-")

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="cortesias-${nomeLote}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
