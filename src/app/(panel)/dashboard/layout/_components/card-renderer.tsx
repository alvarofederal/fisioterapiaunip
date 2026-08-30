"use client"

import { QRCodeSVG } from "qrcode.react"

// ─────────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────────

export type TamanhoCard  = "MINI" | "CARTAO" | "PADRAO" | "COUPON" | "VOUCHER" | "MEIO_A4" | "MDF"
export type EstiloCard   = "CLASSICO" | "MODERNO" | "MINIMALISTA" | "GRADIENTE" | "NEON"
/** null = chave não posicionada | {x, y} = posição em % da área do card */
export type PosicaoChave = { x: number; y: number } | null

export interface CardSize {
  label: string
  desc: string
  mmW: number
  mmH: number
  preW: number
  preH: number
  perFolha: number
  cols: number
  rows: number
}

export const CARD_SIZES: Record<TamanhoCard, CardSize> = {
  MINI:    { label: "Mini",    desc: "63×38 mm · 21/folha",  mmW:  63, mmH:  38, preW:  504, preH:  304, perFolha: 21, cols: 3, rows: 7 },
  CARTAO:  { label: "Cartão",  desc: "70×35 mm · 14/folha",  mmW:  70, mmH:  35, preW:  560, preH:  280, perFolha: 14, cols: 2, rows: 7 },
  PADRAO:  { label: "Padrão",  desc: "85×55 mm · 10/folha",  mmW:  85, mmH:  55, preW:  680, preH:  440, perFolha: 10, cols: 2, rows: 5 },
  COUPON:  { label: "Cupom",   desc: "95×68 mm · 8/folha",   mmW:  95, mmH:  68, preW:  760, preH:  544, perFolha:  8, cols: 2, rows: 4 },
  VOUCHER: { label: "Voucher", desc: "190×68 mm · 4/folha",  mmW: 190, mmH:  68, preW: 1140, preH:  408, perFolha:  4, cols: 1, rows: 4 },
  MEIO_A4: { label: "Meio A4", desc: "190×138 mm · 2/folha", mmW: 190, mmH: 138, preW: 1140, preH:  828, perFolha:  2, cols: 1, rows: 2 },
  MDF:     { label: "MDF",     desc: "90×90 mm · 6/folha",   mmW:  90, mmH:  90, preW:  720, preH:  720, perFolha:  6, cols: 2, rows: 3 },
}

// ─────────────────────────────────────────────────────────────
// CARD PROPS
// ─────────────────────────────────────────────────────────────

export interface CardProps {
  size: CardSize
  corPrimaria: string
  corFundo: string
  corTexto: string
  corSecundaria: string
  img1: string
  img2: string
  opacidade: number
  brilho: number
  saturacao: number
  contraste: number
  raioCantos: number
  nomeLoja: string
  nomeCampanha: string
  posicaoChave?: PosicaoChave
  escalaChave?: number
  modoLimpo?: boolean
  // Dados reais da chave/campanha (opcionais — fallback para placeholder)
  beneficioMain?: string
  beneficioSub?:  string
  validadeTxt?:   string
  qrUrl?:         string
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

export function imgFilter(b: number, s: number, c: number) {
  return `brightness(${b}%) saturate(${s}%) contrast(${c}%)`
}
export function ini(nome: string) {
  return nome.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "AB"
}
export function isSquare(size: CardSize) {
  return Math.abs(size.mmW / size.mmH - 1) < 0.15
}

// ─────────────────────────────────────────────────────────────
// KEY BADGE
// ─────────────────────────────────────────────────────────────

export function KeyBadge({
  posicao, size, corPrimaria, corTexto, escala = 1,
}: {
  posicao: { x: number; y: number }
  size: CardSize
  corPrimaria: string
  corTexto: string
  escala?: number
}) {
  const fs = size.preH * 0.065 * escala
  return (
    <div style={{
      position: "absolute",
      left: `${posicao.x}%`,
      top: `${posicao.y}%`,
      transform: "translate(-50%, -50%)",
      zIndex: 20,
      background: "rgba(255,255,255,0.94)",
      borderRadius: Math.round(fs * 0.5),
      padding: `${Math.round(fs * 0.28)}px ${Math.round(fs * 0.65)}px`,
      border: `1.5px solid ${corPrimaria}`,
      backdropFilter: "blur(4px)",
      boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
      pointerEvents: "none",
    }}>
      <code style={{
        fontFamily: "monospace",
        fontSize: fs,
        fontWeight: "bold",
        color: corTexto,
        whiteSpace: "nowrap",
        letterSpacing: 1.2,
        display: "block",
        lineHeight: 1,
      }}>
        XXXX-YYYY-ZZZZ-WWWW
      </code>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// UTILITÁRIOS DE TEXTO — bloco com truncagem garantida
// Regra: text-overflow:ellipsis EXIGE display:block + overflow:hidden
// ─────────────────────────────────────────────────────────────

function T({
  children, style,
}: {
  children: React.ReactNode
  style: React.CSSProperties
}) {
  return (
    <div style={{
      display: "block",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// RENDERERS
// ─────────────────────────────────────────────────────────────

// ── Clássico Landscape ───────────────────────────────────────
function CardClassicoLandscape({
  size, corPrimaria, corFundo, corTexto, corSecundaria,
  img1, img2, opacidade, brilho: b, saturacao: s, contraste: c,
  raioCantos, nomeLoja, nomeCampanha, posicaoChave, escalaChave,
  beneficioMain = "20% OFF", beneficioSub = "Desconto exclusivo",
  validadeTxt = "Válido até 31/12/2025", qrUrl = "https://courtesyfy.com.br",
}: CardProps) {
  const letters = ini(nomeLoja)
  const r       = raioCantos

  // Tamanhos proporcionais, limitados para caber em qualquer card
  const logoSz  = Math.round(Math.min(size.preH * 0.26, size.preW * 0.14))
  const qrSz    = Math.round(Math.min(size.preH * 0.42, size.preW * 0.19))
  const col1W   = Math.round(size.preW * 0.21)
  const pad     = Math.round(size.preH * 0.07)
  const padH    = Math.round(size.preH * 0.10)

  // Fonte proporcional ao menor lado para não explodir em cards grandes
  const fBase   = Math.round(Math.min(size.preH, size.preW * 0.45) * 0.062)
  const fSmall  = Math.round(fBase * 0.88)
  const fTiny   = Math.round(fBase * 0.76)
  const fBig    = Math.round(fBase * 2.6)

  return (
    <div style={{
      width: size.preW, height: size.preH,
      border: `1.5px solid ${corPrimaria}44`,
      borderRadius: r,
      display: "flex", flexDirection: "row", alignItems: "stretch",
      background: corFundo, position: "relative", overflow: "hidden",
      fontFamily: "'Segoe UI', Arial, sans-serif",
      boxSizing: "border-box",
    }}>
      {/* Imagem de fundo */}
      {img1 && <img src={img1} alt="" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover", opacity: opacidade / 100, pointerEvents: "none",
        filter: imgFilter(b, s, c),
      }} />}

      {/* Faixa de cor esquerda */}
      <div style={{
        position: "absolute", top: 0, left: 0, width: 5, height: "100%",
        background: `linear-gradient(180deg,${corPrimaria},${corPrimaria}66)`,
        borderRadius: `${r}px 0 0 ${r}px`,
        zIndex: 1,
      }} />

      {/* ── Coluna da loja (esquerda) ── */}
      <div style={{
        flexShrink: 0,
        width: col1W,
        paddingLeft: 12,
        paddingRight: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        position: "relative", zIndex: 1,
        overflow: "hidden",   // impede expansão do texto
      }}>
        {img2
          ? <img src={img2} alt="" style={{
              width: logoSz, height: logoSz, borderRadius: "50%",
              objectFit: "cover", border: `2px solid ${corPrimaria}`,
              flexShrink: 0,
            }} />
          : <div style={{
              width: logoSz, height: logoSz, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg,${corPrimaria}cc,${corPrimaria})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: Math.round(logoSz * 0.33), fontWeight: "bold",
              border: `2px solid ${corPrimaria}55`,
            }}>{letters}</div>
        }
        {/* width:100% + overflow:hidden são obrigatórios para ellipsis funcionar */}
        <T style={{
          width: "100%", textAlign: "center",
          fontSize: fSmall, color: corPrimaria, fontWeight: "bold",
          textTransform: "uppercase", letterSpacing: 0.4, lineHeight: 1.2,
        }}>
          {nomeLoja || "Sua Loja"}
        </T>
      </div>

      {/* Divisória */}
      <div style={{
        width: 1, flexShrink: 0,
        alignSelf: "stretch", margin: `${padH}px 0`,
        background: corPrimaria + "20",
        position: "relative", zIndex: 1,
      }} />

      {/* ── Conteúdo central ── */}
      {/* minWidth:0 é OBRIGATÓRIO para texto não estourar o flex container */}
      <div style={{
        flex: 1, minWidth: 0,
        display: "flex", flexDirection: "column", justifyContent: "center",
        gap: Math.round(size.preH * 0.028),
        paddingLeft: pad, paddingRight: Math.round(pad * 0.5),
        position: "relative", zIndex: 1,
      }}>
        <T style={{ fontSize: fSmall, fontWeight: 600, color: corSecundaria,
          textTransform: "uppercase", letterSpacing: 0.5 }}>
          {nomeCampanha || "Campanha"}
        </T>
        <div style={{
          fontSize: fBig, fontWeight: "bold", color: corPrimaria,
          lineHeight: 1, whiteSpace: "nowrap",
        }}>
          {beneficioMain}
        </div>
        <T style={{ fontSize: fSmall, color: corSecundaria + "99" }}>
          {beneficioSub}
        </T>
        <T style={{ fontSize: fTiny, color: corSecundaria + "55" }}>
          {validadeTxt}
        </T>
      </div>

      {/* ── QR Code ── */}
      <div style={{
        flexShrink: 0,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 4,
        paddingRight: Math.round(pad * 0.8),
        paddingLeft: Math.round(pad * 0.4),
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          border: `1.5px solid ${corPrimaria}`, borderRadius: 5,
          padding: 3, background: "#fff", flexShrink: 0,
        }}>
          <QRCodeSVG value={qrUrl} size={qrSz}
            bgColor="#fff" fgColor="#111827" level="M" marginSize={0} />
        </div>
        <T style={{
          fontSize: fTiny, color: corSecundaria + "77",
          textAlign: "center", width: qrSz + 6,
        }}>
          Escaneie e ative
        </T>
      </div>

      {/* Watermark */}
      <div style={{
        position: "absolute", bottom: 3, left: col1W + pad,
        fontSize: fTiny, color: corSecundaria + "33",
        whiteSpace: "nowrap", zIndex: 1,
      }}>
        courtesyfy.com.br
      </div>

      {posicaoChave && (
        <KeyBadge posicao={posicaoChave} size={size} corPrimaria={corPrimaria}
          corTexto={corTexto} escala={escalaChave ?? 1} />
      )}
    </div>
  )
}

// ── Clássico Square (MDF) ────────────────────────────────────
function CardClassicoSquare({
  size, corPrimaria, corFundo, corTexto, corSecundaria,
  img1, img2, opacidade, brilho: b, saturacao: s, contraste: c,
  raioCantos, nomeLoja, nomeCampanha, posicaoChave, escalaChave,
  beneficioMain = "20% OFF", beneficioSub = "Desconto exclusivo",
  validadeTxt = "Válido até 31/12/2025", qrUrl = "https://courtesyfy.com.br",
}: CardProps) {
  const letters = ini(nomeLoja)
  const r       = raioCantos
  const pad     = Math.round(size.preW * 0.055)
  const logoSz  = Math.round(size.preW * 0.17)
  const qrSz    = Math.round(size.preW * 0.30)

  const fBase   = Math.round(size.preW * 0.063)
  const fSmall  = Math.round(fBase * 0.87)
  const fTiny   = Math.round(fBase * 0.72)
  const fBig    = Math.round(size.preW * 0.19)

  return (
    <div style={{
      width: size.preW, height: size.preH,
      borderRadius: r, overflow: "hidden",
      background: corFundo, position: "relative",
      fontFamily: "'Segoe UI', Arial, sans-serif",
      display: "flex", flexDirection: "column",
      border: `1.5px solid ${corPrimaria}44`,
      boxSizing: "border-box",
    }}>
      {img1 && <img src={img1} alt="" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover", opacity: opacidade / 100,
        pointerEvents: "none", filter: imgFilter(b, s, c),
      }} />}

      {/* Topo colorido */}
      <div style={{ height: 5, background: corPrimaria, flexShrink: 0,
        position: "relative", zIndex: 1 }} />

      {/* Header */}
      <div style={{
        display: "flex", flexDirection: "row", alignItems: "center",
        padding: `${Math.round(pad * 0.5)}px ${pad}px ${Math.round(pad * 0.3)}px`,
        gap: Math.round(pad * 0.6),
        position: "relative", zIndex: 1,
        overflow: "hidden",   // evita que logo ou texto expandam
      }}>
        {img2
          ? <img src={img2} alt="" style={{
              width: logoSz, height: logoSz, borderRadius: "50%",
              objectFit: "cover", border: `2px solid ${corPrimaria}`,
              flexShrink: 0,
            }} />
          : <div style={{
              width: logoSz, height: logoSz, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg,${corPrimaria}cc,${corPrimaria})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: Math.round(logoSz * 0.35), fontWeight: "bold",
              border: `2px solid ${corPrimaria}55`,
            }}>{letters}</div>
        }
        {/* minWidth:0 para o texto truncar corretamente no flex row */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <T style={{ fontSize: fBase, fontWeight: "bold", color: corPrimaria,
            textTransform: "uppercase", letterSpacing: 0.4 }}>
            {nomeLoja || "Sua Loja"}
          </T>
          <T style={{ fontSize: fSmall, color: corSecundaria,
            textTransform: "uppercase", letterSpacing: 0.3 }}>
            {nomeCampanha || "Campanha"}
          </T>
        </div>
      </div>

      {/* Separador */}
      <div style={{
        height: 1, background: corPrimaria + "25",
        margin: `0 ${pad}px`, position: "relative", zIndex: 1,
      }} />

      {/* Corpo */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "row", alignItems: "center",
        padding: `${Math.round(pad * 0.55)}px ${pad}px`,
        gap: pad, position: "relative", zIndex: 1, overflow: "hidden",
      }}>
        {/* Info — minWidth:0 para truncar */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ fontSize: fBig, fontWeight: "bold", color: corPrimaria, lineHeight: 1 }}>
            {beneficioMain}
          </div>
          <T style={{ fontSize: fSmall, color: corSecundaria + "99" }}>
            {beneficioSub}
          </T>
          <T style={{ fontSize: fTiny, color: corSecundaria + "55" }}>
            {validadeTxt}
          </T>
        </div>
        {/* QR */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 4 }}>
          <div style={{ border: `1.5px solid ${corPrimaria}`, borderRadius: 5,
            padding: 3, background: "#fff" }}>
            <QRCodeSVG value={qrUrl} size={qrSz}
              bgColor="#fff" fgColor="#111827" level="M" marginSize={0} />
          </div>
          <T style={{ fontSize: fTiny, color: corSecundaria + "66",
            textAlign: "center", width: qrSz + 6 }}>
            Escanear
          </T>
        </div>
      </div>

      {/* Watermark */}
      <div style={{
        position: "absolute", bottom: 4, left: pad,
        fontSize: fTiny, color: corSecundaria + "33",
        whiteSpace: "nowrap", zIndex: 1,
      }}>
        courtesyfy.com.br
      </div>

      {posicaoChave && (
        <KeyBadge posicao={posicaoChave} size={size} corPrimaria={corPrimaria}
          corTexto={corTexto} escala={escalaChave ?? 1} />
      )}
    </div>
  )
}

function CardClassico(props: CardProps) {
  return isSquare(props.size) ? <CardClassicoSquare {...props} /> : <CardClassicoLandscape {...props} />
}

// ── Moderno ──────────────────────────────────────────────────
function CardModerno({
  size, corPrimaria, corFundo, corTexto, corSecundaria,
  img1, img2, opacidade, brilho: b, saturacao: s, contraste: c,
  raioCantos, nomeLoja, nomeCampanha, posicaoChave, escalaChave,
  beneficioMain = "20% OFF", beneficioSub = "Desconto exclusivo",
  validadeTxt = "Válido até 31/12/2025", qrUrl = "https://courtesyfy.com.br",
}: CardProps) {
  const letters = ini(nomeLoja)
  const r       = raioCantos
  const topH    = Math.round(size.preH * 0.42)
  const qrSz    = Math.round(Math.min(size.preH * 0.30, size.preW * 0.16))
  const padH    = Math.round(size.preH * 0.06)
  const padW    = Math.round(size.preW * 0.055)
  const logoSz  = Math.round(Math.min(topH * 0.52, size.preW * 0.17))

  const fBase  = Math.round(Math.min(size.preH, size.preW * 0.45) * 0.062)
  const fSmall = Math.round(fBase * 0.88)
  const fTiny  = Math.round(fBase * 0.76)
  const fBig   = Math.round(fBase * 2.5)

  return (
    <div style={{
      width: size.preW, height: size.preH, borderRadius: r, overflow: "hidden",
      background: corFundo, fontFamily: "'Segoe UI', Arial, sans-serif",
      display: "flex", flexDirection: "column",
      border: `1.5px solid ${corPrimaria}22`, position: "relative",
      boxSizing: "border-box",
    }}>
      {/* Banner superior */}
      <div style={{
        height: topH, flexShrink: 0,
        background: `linear-gradient(135deg,${corPrimaria} 0%,${corPrimaria}99 100%)`,
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center",
        padding: `0 ${padW}px`,
        gap: padW,
      }}>
        {img1 && <img src={img1} alt="" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", opacity: opacidade / 100,
          filter: imgFilter(b, s, c), mixBlendMode: "overlay", pointerEvents: "none",
        }} />}

        {/* Logo */}
        <div style={{ flexShrink: 0, position: "relative", zIndex: 1 }}>
          {img2
            ? <img src={img2} alt="" style={{
                width: logoSz, height: logoSz, borderRadius: "50%",
                objectFit: "cover", border: "2.5px solid rgba(255,255,255,0.7)",
              }} />
            : <div style={{
                width: logoSz, height: logoSz, borderRadius: "50%",
                background: "rgba(255,255,255,0.22)", border: "2.5px solid rgba(255,255,255,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: Math.round(logoSz * 0.35), fontWeight: "bold",
              }}>{letters}</div>
          }
        </div>

        {/* Nomes no banner — minWidth:0 para truncar no flex row */}
        <div style={{
          flex: 1, minWidth: 0, position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column", gap: 3,
        }}>
          <T style={{
            fontSize: Math.round(topH * 0.18), fontWeight: "bold",
            color: "rgba(255,255,255,0.95)", lineHeight: 1.1,
          }}>
            {nomeLoja || "Sua Loja"}
          </T>
          <T style={{
            fontSize: Math.round(topH * 0.13), color: "rgba(255,255,255,0.70)",
            textTransform: "uppercase", letterSpacing: 0.5,
          }}>
            {nomeCampanha || "Campanha"}
          </T>
        </div>
      </div>

      {/* Corpo inferior */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "row",
        alignItems: "center",
        padding: `${padH}px ${padW}px`,
        gap: padW, overflow: "hidden",
      }}>
        {/* Info — minWidth:0 para truncar */}
        <div style={{
          flex: 1, minWidth: 0,
          display: "flex", flexDirection: "column",
          gap: Math.round(size.preH * 0.025),
        }}>
          <div style={{ fontSize: fBig, fontWeight: "bold", color: corPrimaria, lineHeight: 1 }}>
            {beneficioMain}
          </div>
          <T style={{ fontSize: fSmall, color: corSecundaria }}>
            {beneficioSub}
          </T>
          <T style={{ fontSize: fTiny, color: corSecundaria + "55" }}>
            {validadeTxt}
          </T>
        </div>
        {/* QR */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 3 }}>
          <div style={{ border: `2px solid ${corPrimaria}`, borderRadius: 5,
            padding: 3, background: "#fff" }}>
            <QRCodeSVG value={qrUrl} size={qrSz}
              bgColor="#fff" fgColor="#111827" level="M" marginSize={0} />
          </div>
          <T style={{ fontSize: fTiny, color: corSecundaria + "66",
            textAlign: "center", width: qrSz + 6 }}>
            Escanear
          </T>
        </div>
      </div>

      {/* Watermark */}
      <div style={{
        position: "absolute", bottom: 4, right: padW,
        fontSize: fTiny, color: corSecundaria + "30",
        whiteSpace: "nowrap", zIndex: 1,
      }}>
        courtesyfy.com.br
      </div>

      {posicaoChave && (
        <KeyBadge posicao={posicaoChave} size={size} corPrimaria={corPrimaria}
          corTexto={corTexto} escala={escalaChave ?? 1} />
      )}
    </div>
  )
}

// ── Minimalista ──────────────────────────────────────────────
function CardMinimalista({
  size, corPrimaria, corFundo, corTexto, corSecundaria,
  img1, img2, opacidade, brilho: b, saturacao: s, contraste: c,
  raioCantos, nomeLoja, nomeCampanha, posicaoChave, escalaChave,
  beneficioMain = "20% OFF", beneficioSub = "Desconto exclusivo",
  validadeTxt = "Válido até 31/12/2025", qrUrl = "https://courtesyfy.com.br",
}: CardProps) {
  const letters = ini(nomeLoja)
  const r       = raioCantos
  const padW    = Math.round(size.preW * 0.050)
  const padV    = Math.round(size.preH * 0.09)
  const logoSz  = Math.round(Math.min(size.preH * 0.24, size.preW * 0.12))
  const qrSz    = Math.round(Math.min(size.preH * 0.36, size.preW * 0.20))

  const fBase  = Math.round(Math.min(size.preH, size.preW * 0.45) * 0.060)
  const fSmall = Math.round(fBase * 0.88)
  const fTiny  = Math.round(fBase * 0.74)
  const fBig   = Math.round(fBase * 2.8)

  return (
    <div style={{
      width: size.preW, height: size.preH, borderRadius: r, overflow: "hidden",
      background: corFundo, fontFamily: "'Segoe UI', Arial, sans-serif",
      display: "flex", flexDirection: "column",
      border: `1px solid ${corTexto}18`, position: "relative",
      boxSizing: "border-box",
    }}>
      {img1 && <img src={img1} alt="" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover", opacity: opacidade / 100,
        filter: imgFilter(b, s, c), pointerEvents: "none",
      }} />}

      {/* Linha de acento superior */}
      <div style={{ height: 3, background: corPrimaria, flexShrink: 0,
        position: "relative", zIndex: 1 }} />

      {/* Conteúdo — linha única flex-row */}
      <div style={{
        flex: 1,
        display: "flex", flexDirection: "row", alignItems: "center",
        padding: `${padV}px ${padW}px`,
        gap: padW,
        position: "relative", zIndex: 1,
        overflow: "hidden",
      }}>
        {/* ── Coluna logo + nome ── */}
        <div style={{
          flexShrink: 0,
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 5,
          width: Math.round(size.preW * 0.20),
          overflow: "hidden",
        }}>
          {img2
            ? <img src={img2} alt="" style={{
                width: logoSz, height: logoSz, borderRadius: "50%",
                objectFit: "cover", flexShrink: 0,
              }} />
            : <div style={{
                width: logoSz, height: logoSz, borderRadius: "50%", flexShrink: 0,
                background: corPrimaria + "1E",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: corPrimaria, fontSize: Math.round(logoSz * 0.33), fontWeight: "bold",
              }}>{letters}</div>
          }
          <T style={{
            width: "100%", textAlign: "center",
            fontSize: fSmall, color: corSecundaria, fontWeight: 600, lineHeight: 1.15,
          }}>
            {nomeLoja || "Loja"}
          </T>
        </div>

        {/* Divisória */}
        <div style={{
          width: 1, alignSelf: "stretch", flexShrink: 0,
          margin: `${Math.round(padV * 0.3)}px 0`,
          background: corTexto + "14",
        }} />

        {/* ── Info central — minWidth:0 ── */}
        <div style={{
          flex: 1, minWidth: 0,
          display: "flex", flexDirection: "column",
          gap: Math.round(size.preH * 0.027),
        }}>
          <T style={{
            fontSize: fSmall, color: corSecundaria + "aa",
            textTransform: "uppercase", letterSpacing: 0.7,
          }}>
            {nomeCampanha || "Campanha"}
          </T>
          <div style={{
            fontSize: fBig, fontWeight: "300",
            color: corPrimaria, letterSpacing: -0.5, lineHeight: 1,
            whiteSpace: "nowrap",
          }}>
            {beneficioMain}
          </div>
          <T style={{ fontSize: fSmall, color: corSecundaria + "88" }}>
            {beneficioSub}
          </T>
          <T style={{ fontSize: fTiny, color: corSecundaria + "55" }}>
            {validadeTxt}
          </T>
        </div>

        {/* QR */}
        <div style={{ flexShrink: 0, opacity: 0.88 }}>
          <QRCodeSVG value={qrUrl} size={qrSz}
            bgColor="transparent" fgColor={corTexto} level="M" marginSize={0} />
        </div>
      </div>

      {/* Watermark */}
      <div style={{
        position: "absolute", bottom: 4, right: padW,
        fontSize: fTiny, color: corSecundaria + "30",
        whiteSpace: "nowrap", zIndex: 1,
      }}>
        courtesyfy.com.br
      </div>

      {posicaoChave && (
        <KeyBadge posicao={posicaoChave} size={size} corPrimaria={corPrimaria}
          corTexto={corTexto} escala={escalaChave ?? 1} />
      )}
    </div>
  )
}

// ── Gradiente ────────────────────────────────────────────────
function CardGradiente({
  size, corPrimaria, corFundo, corTexto: _ct, corSecundaria,
  img1, img2, opacidade, brilho: b, saturacao: s, contraste: c,
  raioCantos, nomeLoja, nomeCampanha, posicaoChave, escalaChave,
  beneficioMain = "20% OFF", beneficioSub = "Desconto exclusivo",
  validadeTxt = "Válido até 31/12/2025", qrUrl = "https://courtesyfy.com.br",
}: CardProps) {
  const letters = ini(nomeLoja)
  const r       = raioCantos
  const padW    = Math.round(size.preW * 0.050)
  const padV    = Math.round(size.preH * 0.10)
  const logoSz  = Math.round(Math.min(size.preH * 0.32, size.preW * 0.15))
  const qrSz    = Math.round(Math.min(size.preH * 0.38, size.preW * 0.19))

  const fBase  = Math.round(Math.min(size.preH, size.preW * 0.45) * 0.065)
  const fSmall = Math.round(fBase * 0.88)
  const fTiny  = Math.round(fBase * 0.74)
  const fBig   = Math.round(fBase * 2.7)

  return (
    <div style={{
      width: size.preW, height: size.preH, borderRadius: r, overflow: "hidden",
      background: `linear-gradient(135deg,${corPrimaria} 0%,${corFundo} 100%)`,
      fontFamily: "'Segoe UI', Arial, sans-serif",
      display: "flex", flexDirection: "row", alignItems: "center",
      padding: `${padV}px ${padW}px`,
      gap: padW, position: "relative",
      boxSizing: "border-box",
    }}>
      {img1 && <img src={img1} alt="" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover", opacity: opacidade / 100,
        filter: imgFilter(b, s, c), mixBlendMode: "overlay", pointerEvents: "none",
      }} />}

      {/* ── Logo + nome ── */}
      <div style={{
        flexShrink: 0,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 5, position: "relative", zIndex: 1,
        width: Math.round(size.preW * 0.22),
        overflow: "hidden",
      }}>
        {img2
          ? <img src={img2} alt="" style={{
              width: logoSz, height: logoSz, borderRadius: "50%",
              objectFit: "cover", border: "2.5px solid rgba(255,255,255,0.5)", flexShrink: 0,
            }} />
          : <div style={{
              width: logoSz, height: logoSz, borderRadius: "50%", flexShrink: 0,
              background: "rgba(255,255,255,0.22)", border: "2.5px solid rgba(255,255,255,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: Math.round(logoSz * 0.33), fontWeight: "bold",
            }}>{letters}</div>
        }
        <T style={{
          width: "100%", textAlign: "center",
          fontSize: fSmall, color: "rgba(255,255,255,0.92)", fontWeight: 600,
        }}>
          {nomeLoja || "Loja"}
        </T>
      </div>

      {/* ── Info central — minWidth:0 ── */}
      <div style={{
        flex: 1, minWidth: 0, position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column",
        gap: Math.round(size.preH * 0.025),
      }}>
        <T style={{
          fontSize: fSmall, color: "rgba(255,255,255,0.72)",
          textTransform: "uppercase", letterSpacing: 0.5,
        }}>
          {nomeCampanha || "Campanha"}
        </T>
        <div style={{
          fontSize: fBig, fontWeight: "bold", color: "#fff", lineHeight: 1,
          textShadow: "0 2px 8px rgba(0,0,0,0.22)", whiteSpace: "nowrap",
        }}>
          {beneficioMain}
        </div>
        <T style={{ fontSize: fSmall, color: "rgba(255,255,255,0.65)" }}>
          {beneficioSub}
        </T>
        <T style={{ fontSize: fTiny, color: "rgba(255,255,255,0.42)" }}>
          {validadeTxt}
        </T>
      </div>

      {/* QR */}
      <div style={{
        flexShrink: 0, position: "relative", zIndex: 1,
        background: "rgba(255,255,255,0.92)", borderRadius: 7, padding: 5,
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
      }}>
        <QRCodeSVG value={qrUrl} size={qrSz}
          bgColor="transparent" fgColor="#111827" level="M" marginSize={0} />
      </div>

      {posicaoChave && (
        <KeyBadge posicao={posicaoChave} size={size} corPrimaria={corPrimaria}
          corTexto="#1a1a1a" escala={escalaChave ?? 1} />
      )}
    </div>
  )
}

// ── Neon ─────────────────────────────────────────────────────
function CardNeon({
  size, corPrimaria, corFundo: _cf, corTexto: _ct, corSecundaria,
  img1, img2, opacidade, brilho: b, saturacao: s, contraste: c,
  raioCantos, nomeLoja, nomeCampanha, posicaoChave, escalaChave,
  beneficioMain = "20% OFF", beneficioSub = "Desconto exclusivo",
  validadeTxt = "Válido até 31/12/2025", qrUrl = "https://courtesyfy.com.br",
}: CardProps) {
  const letters = ini(nomeLoja)
  const r       = raioCantos
  const padW    = Math.round(size.preW * 0.050)
  const padV    = Math.round(size.preH * 0.10)
  const logoSz  = Math.round(Math.min(size.preH * 0.30, size.preW * 0.14))
  const qrSz    = Math.round(Math.min(size.preH * 0.36, size.preW * 0.18))

  const fBase  = Math.round(Math.min(size.preH, size.preW * 0.45) * 0.062)
  const fSmall = Math.round(fBase * 0.88)
  const fTiny  = Math.round(fBase * 0.74)
  const fBig   = Math.round(fBase * 2.7)

  return (
    <div style={{
      width: size.preW, height: size.preH, borderRadius: r, overflow: "hidden",
      background: "#090909", fontFamily: "'Segoe UI', Arial, sans-serif",
      display: "flex", flexDirection: "row", alignItems: "center",
      padding: `${padV}px ${padW}px`,
      gap: padW, position: "relative",
      border: `1.5px solid ${corPrimaria}`,
      boxShadow: `0 0 14px ${corPrimaria}44, inset 0 0 40px rgba(0,0,0,0.4)`,
      boxSizing: "border-box",
    }}>
      {img1 && <img src={img1} alt="" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover", opacity: (opacidade / 100) * 0.45,
        filter: imgFilter(b, s, c), pointerEvents: "none",
      }} />}

      {/* Linha neon no topo */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg,transparent,${corPrimaria},transparent)`,
      }} />

      {/* ── Logo + nome ── */}
      <div style={{
        flexShrink: 0,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 4, position: "relative", zIndex: 1,
        width: Math.round(size.preW * 0.21),
        overflow: "hidden",
      }}>
        {img2
          ? <img src={img2} alt="" style={{
              width: logoSz, height: logoSz, borderRadius: "50%", flexShrink: 0,
              objectFit: "cover", border: `2px solid ${corPrimaria}`,
              boxShadow: `0 0 8px ${corPrimaria}66`,
            }} />
          : <div style={{
              width: logoSz, height: logoSz, borderRadius: "50%", flexShrink: 0,
              background: corPrimaria + "1A", border: `2px solid ${corPrimaria}`,
              boxShadow: `0 0 10px ${corPrimaria}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: corPrimaria, fontSize: Math.round(logoSz * 0.33), fontWeight: "bold",
            }}>{letters}</div>
        }
        <T style={{
          width: "100%", textAlign: "center",
          fontSize: fSmall, color: corPrimaria, fontWeight: 700,
          textShadow: `0 0 7px ${corPrimaria}`,
        }}>
          {nomeLoja || "Loja"}
        </T>
      </div>

      {/* ── Info — minWidth:0 ── */}
      <div style={{
        flex: 1, minWidth: 0, position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column",
        gap: Math.round(size.preH * 0.027),
      }}>
        <T style={{
          fontSize: fSmall, color: "rgba(255,255,255,0.48)",
          textTransform: "uppercase", letterSpacing: 0.7,
        }}>
          {nomeCampanha || "Campanha"}
        </T>
        <div style={{
          fontSize: fBig, fontWeight: "bold", color: corPrimaria, lineHeight: 1,
          textShadow: `0 0 14px ${corPrimaria}`, whiteSpace: "nowrap",
        }}>
          {beneficioMain}
        </div>
        <T style={{ fontSize: fSmall, color: "rgba(255,255,255,0.55)" }}>
          {beneficioSub}
        </T>
        <T style={{ fontSize: fTiny, color: "rgba(255,255,255,0.28)" }}>
          {validadeTxt}
        </T>
      </div>

      {/* QR */}
      <div style={{
        flexShrink: 0, position: "relative", zIndex: 1,
        border: `1.5px solid ${corPrimaria}`, borderRadius: 6, padding: 3,
        background: "#fff", boxShadow: `0 0 10px ${corPrimaria}44`,
      }}>
        <QRCodeSVG value={qrUrl} size={qrSz}
          bgColor="#fff" fgColor="#111827" level="M" marginSize={0} />
      </div>

      {posicaoChave && (
        <KeyBadge posicao={posicaoChave} size={size} corPrimaria={corPrimaria}
          corTexto="#111111" escala={escalaChave ?? 1} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MODO LIMPO
// ─────────────────────────────────────────────────────────────

function CardLimpo({
  size, corPrimaria, corFundo, corTexto, img1, opacidade,
  brilho: b, saturacao: s, contraste: c, raioCantos: r,
  posicaoChave, escalaChave,
}: CardProps) {
  return (
    <div style={{
      width: size.preW, height: size.preH, borderRadius: r,
      overflow: "hidden", background: corFundo, position: "relative",
    }}>
      {img1 && <img src={img1} alt="" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover", filter: imgFilter(b, s, c), pointerEvents: "none",
      }} />}
      {posicaoChave && (
        <KeyBadge posicao={posicaoChave} size={size} corPrimaria={corPrimaria}
          corTexto={corTexto} escala={escalaChave ?? 1} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────────

export function CardRenderer(props: CardProps & { estilo: EstiloCard }) {
  if (props.modoLimpo) return <CardLimpo {...props} />
  switch (props.estilo) {
    case "MODERNO":      return <CardModerno {...props} />
    case "MINIMALISTA":  return <CardMinimalista {...props} />
    case "GRADIENTE":    return <CardGradiente {...props} />
    case "NEON":         return <CardNeon {...props} />
    default:             return <CardClassico {...props} />
  }
}
