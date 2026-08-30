// API Route: gera PDF de preview do layout do card.
// Sem window.print(), sem dialog do browser.
// Recebe configuração do card via query params e devolve application/pdf.
// Todos os cards são placeholders (sem chaves reais) — ideal para aprovar o
// layout antes de imprimir um lote de verdade.

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import QRCode from "qrcode"
import type { jsPDF as JsPDFType } from "jspdf"

// ─── Constantes ───────────────────────────────────────────────────────────────

const A4_W = 210
const A4_H = 297
const MARGIN = 8
const GAP    = 4

const PLACEHOLDER_CODE = "XXXX-YYYY-ZZZZ"
const PLACEHOLDER_URL  = "https://courtesyfy.com.br"

// Espelho do CARD_SIZES de card-renderer.tsx
const CARD_SIZES: Record<string, {
  mmW: number; mmH: number; perFolha: number; cols: number; rows: number
}> = {
  MINI:    { mmW: 63,  mmH: 38,  perFolha: 21, cols: 3, rows: 7 },
  CARTAO:  { mmW: 70,  mmH: 35,  perFolha: 14, cols: 2, rows: 7 },
  PADRAO:  { mmW: 85,  mmH: 55,  perFolha: 10, cols: 2, rows: 5 },
  COUPON:  { mmW: 95,  mmH: 68,  perFolha:  8, cols: 2, rows: 4 },
  VOUCHER: { mmW: 190, mmH: 68,  perFolha:  4, cols: 1, rows: 4 },
  MEIO_A4: { mmW: 190, mmH: 138, perFolha:  2, cols: 1, rows: 2 },
  MDF:     { mmW: 90,  mmH: 90,  perFolha:  6, cols: 2, rows: 3 },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// 1mm = 2.83465pt (jsPDF setFontSize usa pt mesmo no modo mm)
function fsPt(mm: number) { return mm * 2.83465 }

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").padEnd(6, "0")
  return [
    parseInt(h.substring(0, 2), 16) || 0,
    parseInt(h.substring(2, 4), 16) || 0,
    parseInt(h.substring(4, 6), 16) || 0,
  ]
}

/** Somente domínios conhecidos para evitar SSRF */
function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return (
      u.protocol === "https:" &&
      (
        u.hostname === "res.cloudinary.com"          ||
        u.hostname === "lh3.googleusercontent.com"   ||
        u.hostname === "avatars.githubusercontent.com"
      )
    )
  } catch { return false }
}

/** Força JPEG para Cloudinary (evita WebP que jsPDF não suporta) */
function toJpegUrl(url: string): string {
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/f_jpg,q_95,w_800/")
  }
  return url
}

async function loadImageBase64(
  url: string,
): Promise<{ data: string; format: "JPEG" | "PNG" } | null> {
  if (!url || !isSafeUrl(url)) return null
  try {
    const safeUrl = toJpegUrl(url)
    const res = await fetch(safeUrl, { cache: "no-store" })
    if (!res.ok) return null
    const ct  = res.headers.get("content-type") ?? "image/jpeg"
    const buf = await res.arrayBuffer()
    const b64 = Buffer.from(buf).toString("base64")
    const format: "JPEG" | "PNG" = ct.includes("png") ? "PNG" : "JPEG"
    return { data: `data:${ct};base64,${b64}`, format }
  } catch { return null }
}

async function generateQrPng(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 400, margin: 0,
    errorCorrectionLevel: "H",
    color: { dark: "#111827", light: "#ffffff" },
  })
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase()
}

function truncate(doc: JsPDFType, text: string, maxMm: number): string {
  if (!text) return ""
  if (doc.getTextWidth(text) <= maxMm) return text
  let t = text
  while (t.length > 1 && doc.getTextWidth(t + "…") > maxMm) t = t.slice(0, -1)
  return t + "…"
}

// ─── KeyBadge ────────────────────────────────────────────────────────────────

function drawKeyBadge(
  doc: JsPDFType,
  cx: number, cy: number, W: number, H: number,
  keyPos: { x: number; y: number } | null,
  keyColor: string,
  keyScale: number,
) {
  if (!keyPos) return
  const kx = cx + (keyPos.x / 100) * W
  const ky = cy + (keyPos.y / 100) * H
  const [kr, kg, kb] = hexToRgb(keyColor)

  // Tamanho proporcional à altura do card × escala do usuário
  const sizeMm = Math.max(1.5, H * 0.07 * keyScale)

  doc.setFont("courier", "bold")
  doc.setFontSize(fsPt(sizeMm))

  const tw   = doc.getTextWidth(PLACEHOLDER_CODE)
  const padX = sizeMm * 0.65
  const padY = sizeMm * 0.45

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(kr, kg, kb)
  doc.setLineWidth(0.35)
  doc.roundedRect(
    kx - tw / 2 - padX,
    ky - padY - sizeMm * 0.3,
    tw + padX * 2,
    sizeMm + padY * 2,
    1.2, 1.2, "FD",
  )
  doc.setTextColor(kr, kg, kb)
  doc.text(PLACEHOLDER_CODE, kx, ky + sizeMm * 0.4, { align: "center" })
}

// ─── Card drawer — layout proporcional a qualquer tamanho ────────────────────

interface DrawOpts {
  corPrimaria:  string
  corFundo:     string
  corTexto:     string
  nomeLoja:     string
  nomeCampanha: string
  logoImg:      { data: string; format: "JPEG" | "PNG" } | null
  bgImg:        { data: string; format: "JPEG" | "PNG" } | null
  opacidade:    number   // 5–100
  keyPos:       { x: number; y: number } | null
  keyColor:     string
  keyScale:     number
  modoLimpo:    boolean
  qrImg:        string
  // Passado após dynamic import para aplicar opacidade via GState
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GStateClass:  any | null
}

function drawCardBackground(
  doc: JsPDFType,
  cx: number, cy: number, W: number, H: number,
  opts: DrawOpts,
) {
  const [fr, fg, fb] = hexToRgb(opts.corFundo)
  const radius = Math.min(W, H) * 0.03

  // Fundo base
  doc.setFillColor(fr, fg, fb)
  doc.setDrawColor(210, 210, 210)
  doc.setLineWidth(0.2)
  doc.roundedRect(cx, cy, W, H, radius, radius, "FD")

  // Imagem de fundo (sem clip arredondado — aceitável para PDF de corte)
  if (opts.bgImg) {
    doc.addImage(opts.bgImg.data, opts.bgImg.format, cx, cy, W, H, undefined, "FAST")
    // Overlay de cor para simular a opacidade configurada pelo usuário
    const overlayAlpha = 1 - Math.min(1, opts.opacidade / 100)
    if (overlayAlpha > 0.02 && opts.GStateClass) {
      try {
        doc.saveGraphicsState()
        doc.setGState(new opts.GStateClass({ opacity: overlayAlpha }))
        doc.setFillColor(fr, fg, fb)
        doc.rect(cx, cy, W, H, "F")
        doc.restoreGraphicsState()
      } catch {
        // fallback: sem overlay (imagem a 100%)
      }
    }
  }
}

function drawCardContent(
  doc: JsPDFType,
  cx: number, cy: number, W: number, H: number,
  tamanho: string,
  opts: DrawOpts,
) {
  const [br, bg, bb] = hexToRgb(opts.corPrimaria)
  const radius = Math.min(W, H) * 0.03
  const isSquare = tamanho === "MDF"

  if (opts.modoLimpo) {
    // Modo arte própria: só chave overlay
    drawKeyBadge(doc, cx, cy, W, H, opts.keyPos, opts.keyColor, opts.keyScale)
    return
  }

  if (isSquare) {
    // ── Layout quadrado (MDF 90×90) ──────────────────────────────────────

    // Faixa superior de destaque
    const bandH = H * 0.025
    doc.setFillColor(br, bg, bb)
    doc.roundedRect(cx, cy, W, bandH * 2, radius, radius, "F")
    doc.rect(cx, cy + bandH, W, bandH, "F")

    // Logo / iniciais (centralizado)
    const logoSz = W * 0.22
    const logoX  = cx + W / 2 - logoSz / 2
    const logoY  = cy + H * 0.07

    if (opts.logoImg) {
      doc.setFillColor(br, bg, bb)
      const r = (logoSz + 1) / 2
      doc.roundedRect(logoX - 0.5, logoY - 0.5, logoSz + 1, logoSz + 1, r, r, "F")
      doc.addImage(opts.logoImg.data, opts.logoImg.format, logoX, logoY, logoSz, logoSz, undefined, "FAST")
    } else {
      doc.setFillColor(br, bg, bb)
      doc.roundedRect(logoX, logoY, logoSz, logoSz, logoSz / 2, logoSz / 2, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(fsPt(logoSz * 0.38))
      doc.text(initials(opts.nomeLoja), cx + W / 2, logoY + logoSz * 0.65, { align: "center" })
    }

    // Nome da loja
    doc.setTextColor(br, bg, bb)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(fsPt(H * 0.028))
    doc.text(
      truncate(doc, opts.nomeLoja.toUpperCase(), W - 8),
      cx + W / 2,
      logoY + logoSz + H * 0.045,
      { align: "center" },
    )

    // Nome da campanha
    doc.setTextColor(90, 62, 40)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(fsPt(H * 0.027))
    doc.text(
      truncate(doc, opts.nomeCampanha.toUpperCase(), W - 8),
      cx + W / 2,
      cy + H * 0.43,
      { align: "center" },
    )

    // "PREVIEW" no lugar do benefício
    doc.setTextColor(br, bg, bb)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(fsPt(H * 0.075))
    doc.text("PREVIEW", cx + W / 2, cy + H * 0.53, { align: "center" })

    // QR code placeholder
    const qrSz = W * 0.30
    const qrX  = cx + W / 2 - qrSz / 2
    const qrY  = cy + H * 0.59
    doc.setDrawColor(br, bg, bb)
    doc.setLineWidth(0.5)
    doc.roundedRect(qrX - 1, qrY - 1, qrSz + 2, qrSz + 2, 1.5, 1.5, "S")
    doc.addImage(opts.qrImg, "PNG", qrX, qrY, qrSz, qrSz, undefined, "FAST")

    // Validade placeholder
    doc.setTextColor(170, 170, 170)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(fsPt(H * 0.021))
    doc.text("Válido até: 31/12/2099", cx + W / 2, qrY + qrSz + H * 0.044, { align: "center" })

    // Marca d'água
    doc.setTextColor(
      Math.round(br * 0.25 + 191),
      Math.round(bg * 0.25 + 191),
      Math.round(bb * 0.25 + 191),
    )
    doc.setFontSize(fsPt(H * 0.018))
    doc.text("courtesyfy.com.br", cx + W - 2, cy + H - 1.5, { align: "right" })

  } else {
    // ── Layout horizontal (todos os outros formatos) ──────────────────────

    // Sidebar proporcional (máx. 22% da largura, mín. adequado para logo)
    const sideW  = Math.min(W * 0.22, 22)
    const logoSz = Math.min(sideW - 3, H * 0.58, 28)
    const logoX  = cx + (sideW - logoSz) / 2
    const logoY  = cy + (H - logoSz) / 2 - H * 0.07

    // Faixa lateral de destaque
    const faixaW = sideW * 0.35
    doc.setFillColor(br, bg, bb)
    doc.roundedRect(cx, cy, faixaW * 1.5, H, radius, radius, "F")
    doc.rect(cx + radius, cy, faixaW * 1.5 - radius, H, "F")

    // Logo / iniciais
    if (opts.logoImg) {
      doc.setFillColor(br, bg, bb)
      const r = (logoSz + 1) / 2
      doc.roundedRect(logoX - 0.5, logoY - 0.5, logoSz + 1, logoSz + 1, r, r, "F")
      doc.addImage(opts.logoImg.data, opts.logoImg.format, logoX, logoY, logoSz, logoSz, undefined, "FAST")
    } else {
      doc.setFillColor(br, bg, bb)
      doc.roundedRect(logoX, logoY, logoSz, logoSz, logoSz / 2, logoSz / 2, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(fsPt(logoSz * 0.38))
      doc.text(initials(opts.nomeLoja), logoX + logoSz / 2, logoY + logoSz * 0.65, { align: "center" })
    }

    // Nome da loja abaixo do logo
    doc.setTextColor(br, bg, bb)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(fsPt(Math.max(1.4, H * 0.052)))
    doc.text(
      truncate(doc, opts.nomeLoja.toUpperCase(), sideW - 1),
      logoX + logoSz / 2,
      logoY + logoSz + H * 0.11,
      { align: "center" },
    )

    // Coluna de informações (centro)
    const infoX   = cx + sideW + 2
    const qrSz    = Math.min(H * 0.72, W * 0.17, 18)
    const infoMaxW = W - sideW - qrSz - 7

    // Nome da campanha
    doc.setTextColor(90, 62, 40)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(fsPt(Math.max(1.4, H * 0.052)))
    doc.text(truncate(doc, opts.nomeCampanha.toUpperCase(), infoMaxW), infoX, cy + H * 0.25)

    // "PREVIEW" no lugar do benefício
    doc.setTextColor(br, bg, bb)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(fsPt(Math.max(3, H * 0.13)))
    doc.text("PREVIEW", infoX, cy + H * 0.57)

    // Validade placeholder
    doc.setTextColor(170, 170, 170)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(fsPt(Math.max(1.2, H * 0.042)))
    doc.text("Válido até: 31/12/2099", infoX, cy + H * 0.87)

    // QR code (direita)
    const qrX = cx + W - qrSz - 2
    const qrY = cy + H / 2 - qrSz / 2
    doc.setDrawColor(br, bg, bb)
    doc.setLineWidth(0.5)
    doc.roundedRect(qrX - 0.8, qrY - 0.8, qrSz + 1.6, qrSz + 1.6, 1, 1, "S")
    doc.addImage(opts.qrImg, "PNG", qrX, qrY, qrSz, qrSz, undefined, "FAST")

    doc.setTextColor(170, 170, 170)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(fsPt(Math.max(1.0, H * 0.038)))
    doc.text("Escaneie e ative", qrX + qrSz / 2, qrY + qrSz + H * 0.08, { align: "center" })

    // Marca d'água
    doc.setTextColor(
      Math.round(br * 0.25 + 191),
      Math.round(bg * 0.25 + 191),
      Math.round(bb * 0.25 + 191),
    )
    doc.setFontSize(fsPt(Math.max(1.0, H * 0.038)))
    doc.text("courtesyfy.com.br", cx + W - 2, cy + H - 1, { align: "right" })
  }

  // Chave overlay (por cima de tudo)
  drawKeyBadge(doc, cx, cy, W, H, opts.keyPos, opts.keyColor, opts.keyScale)
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.lojaId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const sp = req.nextUrl.searchParams

  // ── Parâmetros do card ────────────────────────────────────────────────────
  const tamanho = sp.get("tamanho") ?? "PADRAO"
  const def     = CARD_SIZES[tamanho] ?? CARD_SIZES["PADRAO"]

  const corPrimaria  = sp.get("corPrimaria")  ?? "#c8a96e"
  const corFundo     = sp.get("corFundo")     ?? "#fffdf7"
  const corTexto     = sp.get("corTexto")     ?? "#3a2510"
  const nomeLoja     = decodeURIComponent(sp.get("nomeLoja")     ?? "Minha Loja")
  const nomeCampanha = decodeURIComponent(sp.get("nomeCampanha") ?? "Campanha Exemplo")
  const logoUrl      = sp.get("logoUrl") ?? ""
  const bgUrl        = sp.get("bgUrl")   ?? ""
  const opacidade    = Math.max(5, Math.min(100, parseInt(sp.get("opacidade") ?? "20")))
  const modoLimpo    = sp.get("modoLimpo") === "1"
  const kx           = sp.get("keyX")
  const ky           = sp.get("keyY")
  const keyPos       = kx && ky ? { x: parseFloat(kx), y: parseFloat(ky) } : null
  const keyColor     = sp.get("keyColor") ?? corPrimaria
  const keyScale     = Math.max(0.2, Math.min(4, parseFloat(sp.get("keyScale") ?? "1")))

  // ── Pré-carregar assets ───────────────────────────────────────────────────
  const [logoImg, bgImg, qrImg] = await Promise.all([
    loadImageBase64(logoUrl),
    loadImageBase64(bgUrl),
    generateQrPng(PLACEHOLDER_URL),
  ])

  // ── Dynamic import (evita DOM globals no servidor) ────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsPDFModule = await import("jspdf") as any
  const { jsPDF }   = jsPDFModule
  // GState pode estar em jsPDFModule.GState ou jsPDFModule.default.GState
  const GStateClass  = jsPDFModule.GState ?? jsPDFModule.default?.GState ?? null

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })

  // ── Montar página ─────────────────────────────────────────────────────────
  const { mmW, mmH, cols, rows } = def

  const drawOpts: DrawOpts = {
    corPrimaria, corFundo, corTexto,
    nomeLoja, nomeCampanha,
    logoImg, bgImg, opacidade,
    keyPos, keyColor, keyScale,
    modoLimpo,
    qrImg,
    GStateClass,
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = MARGIN + col * (mmW + GAP)
      const cy = MARGIN + row * (mmH + GAP)

      drawCardBackground(doc, cx, cy, mmW, mmH, drawOpts)
      drawCardContent(doc, cx, cy, mmW, mmH, tamanho, drawOpts)
    }
  }

  // ── Retornar PDF ──────────────────────────────────────────────────────────
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="layout-preview-${tamanho.toLowerCase()}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
