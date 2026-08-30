"use client"

import { QRCodeSVG } from "qrcode.react"
import { useEffect, useRef, useState } from "react"
import {
  CardRenderer,
  CARD_SIZES,
  type TamanhoCard,
  type EstiloCard,
} from "@/app/(panel)/dashboard/layout/_components/card-renderer"

// ─── Types ────────────────────────────────────────────────────────────────────

type KeyPos = { x: number; y: number } // percentages 0–100

type Chave = {
  codigo: string
  landingUrl: string | null
}

interface Campanha {
  nome: string
  tipoBeneficio: string
  valorBeneficio: string | null
  descricaoPremio: string | null
  descricao: string | null
  expiraEm: string
}

interface Loja {
  nome: string
  logoUrl: string | null
  corPrimaria: string
  imagemFundoUrl?: string | null
  opacidadeFundo?: number
}

interface LayoutConfig {
  corPrimaria: string
  corFundo: string
  corTexto: string
  corSecundaria: string
  imagem1Url: string | null
  imagem2Url: string | null
  opacidadeFundo: number
  brilho: number
  saturacao: number
  contraste: number
  raioCantos: number
  tamanhoCard: string
  estiloCard: string
  posicaoChaveX: number | null
  posicaoChaveY: number | null
  escalaChave: number
}

interface Props {
  chaves: Chave[]
  campanha: Campanha
  loja: Loja
  layout?: LayoutConfig
  nomeLote: string
  totalChaves: number
  geradoEm: string
  formato: "cartao" | "mdf"
  loteId: string
  autoPrint?: boolean
}

interface KeyOverlayCardProps {
  keyPos: KeyPos | null
  keyLocked: boolean
  keyCor: string
  keyFontSz: number
  modoLimpo: boolean
  onSetKeyPos: (p: KeyPos) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function buildBenefitLabel(campanha: Campanha): { main: string; sub: string } {
  const val = campanha.valorBeneficio ? parseFloat(campanha.valorBeneficio) : null
  switch (campanha.tipoBeneficio) {
    case "DESCONTO_PERCENTUAL":
      return { main: val ? `${val}% OFF` : "Desconto", sub: campanha.descricao ?? "" }
    case "DESCONTO_FIXO":
      return {
        main: val
          ? `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} OFF`
          : "Desconto",
        sub: campanha.descricao ?? "",
      }
    case "BRINDE":
      return { main: campanha.descricaoPremio ?? "Brinde", sub: campanha.descricao ?? "" }
    case "SORTEIO":
      return { main: campanha.descricaoPremio ?? "Sorteio", sub: campanha.descricao ?? "" }
    case "FRETE_GRATIS":
      return { main: "Frete Grátis", sub: campanha.descricao ?? "" }
    default:
      return { main: campanha.nome, sub: campanha.descricao ?? "" }
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

// ─── Card dimension constants ─────────────────────────────────────────────────
// Render 4× o tamanho físico → scale(0.25) → qualidade de impressão 4×

const CARTAO_SCALE = 4
const CARTAO_W_MM = 70
const CARTAO_H_MM = 35
const MM_TO_PX = 3.78
const CARTAO_W_PX = Math.round(CARTAO_W_MM * MM_TO_PX * CARTAO_SCALE) // ~1058
const CARTAO_H_PX = Math.round(CARTAO_H_MM * MM_TO_PX * CARTAO_SCALE) //  ~529
const CARTAO_W_CSS = Math.round(CARTAO_W_MM * MM_TO_PX) //  ~265
const CARTAO_H_CSS = Math.round(CARTAO_H_MM * MM_TO_PX) //  ~132

const MDF_SCALE = 3
const MDF_MM = 90
const MDF_W_PX = Math.round(MDF_MM * MM_TO_PX * MDF_SCALE)
const MDF_CSS = Math.round(MDF_MM * MM_TO_PX)

// ─── Draggable Key Overlay ────────────────────────────────────────────────────
// Posicionado no espaço CSS (fora do div escalado), para que o mouse funcione
// corretamente. Texto vetorial imprime com qualidade idêntica ao restante.

function DraggableKeyOverlay({
  codigo,
  pos,
  locked,
  keyCor,
  keyFontSz,
  brand,
  onDrag,
  wrapperRef,
  cardW,
  cardH,
}: {
  codigo: string
  pos: KeyPos
  locked: boolean
  keyCor: string
  keyFontSz: number
  brand: string
  onDrag: (p: KeyPos) => void
  wrapperRef: React.RefObject<HTMLDivElement | null>
  cardW: number
  cardH: number
}) {
  const handleMouseDown = (e: React.MouseEvent) => {
    if (locked) return
    e.stopPropagation()
    e.preventDefault()
    document.body.style.cursor = "grabbing"

    const move = (ev: MouseEvent) => {
      const rect = wrapperRef.current?.getBoundingClientRect()
      if (!rect) return
      onDrag({
        x: clamp(((ev.clientX - rect.left) / cardW) * 100, 3, 97),
        y: clamp(((ev.clientY - rect.top) / cardH) * 100, 3, 97),
      })
    }
    const up = () => {
      document.body.style.cursor = ""
      document.removeEventListener("mousemove", move)
      document.removeEventListener("mouseup", up)
    }
    document.addEventListener("mousemove", move)
    document.addEventListener("mouseup", up)
  }

  return (
    <div
      style={{
        position: "absolute",
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 20,
        cursor: locked ? "default" : "grab",
        userSelect: "none",
        pointerEvents: "auto",
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.94)",
          border: `1.5px solid ${brand}`,
          borderRadius: 5,
          padding: "2px 8px",
          backdropFilter: "blur(4px)",
          boxShadow: locked ? "none" : "0 2px 10px rgba(0,0,0,0.20)",
          // outline tracejado indica que é arrastável; some quando travado
          outline: locked ? "none" : `1.5px dashed ${brand}88`,
          outlineOffset: 2,
        }}
      >
        <code
          style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: keyFontSz,
            fontWeight: "bold",
            color: keyCor,
            whiteSpace: "nowrap",
            letterSpacing: 1,
            display: "block",
          }}
        >
          {codigo}
        </code>
      </div>
    </div>
  )
}

// ─── CartaoCard (7×3,5 cm) ───────────────────────────────────────────────────
// Chave REMOVIDA do corpo do card — posicionada pelo usuário via drag-and-drop.

function CartaoCard({
  chave,
  campanha,
  loja,
  keyPos,
  keyLocked,
  keyCor,
  keyFontSz,
  modoLimpo,
  onSetKeyPos,
}: { chave: Chave; campanha: Campanha; loja: Loja } & KeyOverlayCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const brand = loja.corPrimaria
  const S = CARTAO_SCALE

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (keyLocked || !wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    onSetKeyPos({
      x: clamp(((e.clientX - rect.left) / CARTAO_W_CSS) * 100, 5, 95),
      y: clamp(((e.clientY - rect.top) / CARTAO_H_CSS) * 100, 5, 95),
    })
  }

  const overlay = keyPos ? (
    <DraggableKeyOverlay
      codigo={chave.codigo}
      pos={keyPos}
      locked={keyLocked}
      keyCor={keyCor}
      keyFontSz={keyFontSz}
      brand={brand}
      onDrag={onSetKeyPos}
      wrapperRef={wrapperRef}
      cardW={CARTAO_W_CSS}
      cardH={CARTAO_H_CSS}
    />
  ) : null

  const outerStyle: React.CSSProperties = {
    width: CARTAO_W_CSS,
    height: CARTAO_H_CSS,
    flexShrink: 0,
    overflow: "hidden",
    position: "relative",
    cursor: keyLocked ? "default" : "crosshair",
  }

  if (modoLimpo) {
    return (
      <div ref={wrapperRef} style={outerStyle} onClick={handleClick}>
        <div
          style={{
            width: CARTAO_W_PX,
            height: CARTAO_H_PX,
            position: "absolute",
            top: 0,
            left: 0,
            transform: `scale(${1 / CARTAO_SCALE})`,
            transformOrigin: "top left",
            borderRadius: 8 * S,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          {loja.imagemFundoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={loja.imagemFundoUrl}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                pointerEvents: "none",
              }}
            />
          )}
        </div>
        {overlay}
      </div>
    )
  }

  const { main, sub } = buildBenefitLabel(campanha)
  const logoSz = CARTAO_H_PX * 0.3
  const qrSz = CARTAO_H_PX * 0.46
  const qrBoxW = qrSz + 24
  const logoColW = logoSz + 20

  return (
    <div ref={wrapperRef} style={outerStyle} onClick={handleClick}>
      {/* ── Conteúdo escalado 4× para qualidade de impressão ── */}
      <div
        style={{
          width: CARTAO_W_PX,
          height: CARTAO_H_PX,
          position: "absolute",
          top: 0,
          left: 0,
          transform: `scale(${1 / CARTAO_SCALE})`,
          transformOrigin: "top left",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          background: "#fffdf7",
          borderRadius: 8 * S,
          overflow: "hidden",
          fontFamily: "'Segoe UI', Arial, sans-serif",
        }}
      >
        {/* Fundo personalizado */}
        {loja.imagemFundoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={loja.imagemFundoUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: (loja.opacidadeFundo ?? 20) / 100,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Faixa de cor esquerda */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 6 * S,
            height: "100%",
            background: `linear-gradient(180deg, ${brand}, ${brand}99)`,
            borderRadius: `${8 * S}px 0 0 ${8 * S}px`,
          }}
        />

        {/* Coluna: logo + nome */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: logoColW,
            paddingLeft: 10 * S,
            flexShrink: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          {loja.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={loja.logoUrl}
              alt={loja.nome}
              style={{
                width: logoSz,
                height: logoSz,
                borderRadius: "50%",
                objectFit: "cover",
                border: `${2 * S}px solid ${brand}`,
                marginBottom: 4 * S,
              }}
            />
          ) : (
            <div
              style={{
                width: logoSz,
                height: logoSz,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${brand}cc, ${brand})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: logoSz * 0.32,
                fontWeight: "bold",
                marginBottom: 4 * S,
                border: `${2 * S}px solid ${brand}`,
              }}
            >
              {initials(loja.nome)}
            </div>
          )}
          <span
            style={{
              fontSize: 7 * S,
              color: brand,
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: 0.4,
              textAlign: "center",
              lineHeight: 1.2,
              maxWidth: logoColW - 8,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {loja.nome}
          </span>
        </div>

        {/* Coluna: informações — SEM chave (posicionada via overlay) */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 3 * S,
            paddingLeft: 8 * S,
            paddingRight: 4 * S,
            overflow: "hidden",
            position: "relative",
            zIndex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 7.5 * S,
              fontWeight: "bold",
              color: "#5a3e28",
              textTransform: "uppercase",
              letterSpacing: 0.6,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {campanha.nome}
          </div>
          <div
            style={{
              fontSize: 14 * S,
              fontWeight: "bold",
              color: brand,
              lineHeight: 1,
            }}
          >
            {main}
          </div>
          {sub && (
            <div
              style={{
                fontSize: 7 * S,
                color: "#777",
                lineHeight: 1.3,
                overflow: "hidden",
                maxHeight: 19 * S,
              }}
            >
              {sub.length > 50 ? sub.slice(0, 48) + "…" : sub}
            </div>
          )}
          <div style={{ fontSize: 6 * S, color: "#aaa", marginTop: 1 * S }}>
            Válido até: {campanha.expiraEm}
          </div>
        </div>

        {/* Coluna: QR code */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3 * S,
            width: qrBoxW,
            paddingRight: 8 * S,
            flexShrink: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              border: `${2 * S}px solid ${brand}`,
              borderRadius: 4 * S,
              padding: 3 * S,
              background: "#fff",
            }}
          >
            {chave.landingUrl ? (
              <QRCodeSVG
                value={chave.landingUrl}
                size={qrSz}
                bgColor="#ffffff"
                fgColor="#111827"
                level="H"
                marginSize={0}
              />
            ) : (
              <div
                style={{
                  width: qrSz,
                  height: qrSz,
                  background: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 7 * S,
                  color: "#9ca3af",
                }}
              >
                sem URL
              </div>
            )}
          </div>
          <span
            style={{
              fontSize: 6.5 * S,
              color: "#aaa",
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            Escaneie
            <br />e ative
          </span>
        </div>

        {/* Marca d'água */}
        <div
          style={{
            position: "absolute",
            bottom: 4 * S,
            right: 8 * S,
            fontSize: 5.5 * S,
            color: brand + "44",
            letterSpacing: 0.4,
          }}
        >
          courtesyfy.com.br
        </div>
      </div>

      {/* ── Overlay da chave — no espaço CSS, arrastável ── */}
      {overlay}
    </div>
  )
}

// ─── MdfCard (9×9 cm) ────────────────────────────────────────────────────────
// Chave REMOVIDA do corpo do card — posicionada pelo usuário via drag-and-drop.

function MdfCard({
  chave,
  campanha,
  loja,
  keyPos,
  keyLocked,
  keyCor,
  keyFontSz,
  modoLimpo,
  onSetKeyPos,
}: { chave: Chave; campanha: Campanha; loja: Loja } & KeyOverlayCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const brand = loja.corPrimaria
  const S = MDF_SCALE
  const { main, sub } = buildBenefitLabel(campanha)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (keyLocked || !wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    onSetKeyPos({
      x: clamp(((e.clientX - rect.left) / MDF_CSS) * 100, 5, 95),
      y: clamp(((e.clientY - rect.top) / MDF_CSS) * 100, 5, 95),
    })
  }

  const overlay = keyPos ? (
    <DraggableKeyOverlay
      codigo={chave.codigo}
      pos={keyPos}
      locked={keyLocked}
      keyCor={keyCor}
      keyFontSz={keyFontSz}
      brand={brand}
      onDrag={onSetKeyPos}
      wrapperRef={wrapperRef}
      cardW={MDF_CSS}
      cardH={MDF_CSS}
    />
  ) : null

  const outerStyle: React.CSSProperties = {
    width: MDF_CSS,
    height: MDF_CSS,
    flexShrink: 0,
    overflow: "hidden",
    position: "relative",
    cursor: keyLocked ? "default" : "crosshair",
  }

  if (modoLimpo) {
    return (
      <div ref={wrapperRef} style={outerStyle} onClick={handleClick}>
        <div
          style={{
            width: MDF_W_PX,
            height: MDF_W_PX,
            position: "absolute",
            top: 0,
            left: 0,
            transform: `scale(${1 / MDF_SCALE})`,
            transformOrigin: "top left",
            borderRadius: 12 * S,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          {loja.imagemFundoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={loja.imagemFundoUrl}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                pointerEvents: "none",
              }}
            />
          )}
        </div>
        {overlay}
      </div>
    )
  }

  const logoSz = MDF_W_PX * 0.2
  const qrSz = MDF_W_PX * 0.32

  return (
    <div ref={wrapperRef} style={outerStyle} onClick={handleClick}>
      <div
        style={{
          width: MDF_W_PX,
          height: MDF_W_PX,
          position: "absolute",
          top: 0,
          left: 0,
          transform: `scale(${1 / MDF_SCALE})`,
          transformOrigin: "top left",
          borderRadius: 12 * S,
          overflow: "hidden",
          background: "#fffdf7",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${14 * S}px ${12 * S}px`,
          fontFamily: "'Segoe UI', Arial, sans-serif",
          boxSizing: "border-box",
        }}
      >
        {loja.imagemFundoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={loja.imagemFundoUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: (loja.opacidadeFundo ?? 20) / 100,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Faixa superior */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6 * S,
            background: `linear-gradient(90deg, ${brand}, ${brand}99)`,
          }}
        />

        {/* Logo + nome */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4 * S,
            marginTop: 2 * S,
            position: "relative",
            zIndex: 1,
          }}
        >
          {loja.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={loja.logoUrl}
              alt={loja.nome}
              style={{
                width: logoSz,
                height: logoSz,
                borderRadius: "50%",
                objectFit: "cover",
                border: `${2 * S}px solid ${brand}`,
              }}
            />
          ) : (
            <div
              style={{
                width: logoSz,
                height: logoSz,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${brand}cc, ${brand})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: logoSz * 0.35,
                fontWeight: "bold",
                border: `${2 * S}px solid ${brand}`,
              }}
            >
              {initials(loja.nome)}
            </div>
          )}
          <span
            style={{
              fontSize: 9 * S,
              color: brand,
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: 0.8,
              textAlign: "center",
            }}
          >
            {loja.nome}
          </span>
        </div>

        {/* Benefício — SEM chave */}
        <div
          style={{
            textAlign: "center",
            position: "relative",
            zIndex: 1,
            overflow: "hidden",
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: 9.5 * S,
              fontWeight: "bold",
              color: "#5a3e28",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 3 * S,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {campanha.nome}
          </div>
          <div
            style={{
              fontSize: 24 * S,
              fontWeight: "bold",
              color: brand,
              lineHeight: 1,
              marginBottom: 3 * S,
            }}
          >
            {main}
          </div>
          {sub && (
            <div
              style={{
                fontSize: 8.5 * S,
                color: "#777",
                lineHeight: 1.3,
                overflow: "hidden",
                maxHeight: 24 * S,
              }}
            >
              {sub.length > 60 ? sub.slice(0, 58) + "…" : sub}
            </div>
          )}
        </div>

        {/* QR code — SEM chave embaixo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4 * S,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              border: `${2 * S}px solid ${brand}`,
              borderRadius: 6 * S,
              padding: 4 * S,
              background: "#fff",
            }}
          >
            {chave.landingUrl ? (
              <QRCodeSVG
                value={chave.landingUrl}
                size={qrSz}
                bgColor="#ffffff"
                fgColor="#111827"
                level="H"
                marginSize={0}
              />
            ) : (
              <div
                style={{
                  width: qrSz,
                  height: qrSz,
                  background: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8 * S,
                  color: "#9ca3af",
                }}
              >
                sem URL
              </div>
            )}
          </div>
          <span style={{ fontSize: 7 * S, color: "#aaa" }}>
            Válido até: {campanha.expiraEm}
          </span>
        </div>

        {/* Marca d'água */}
        <div
          style={{
            position: "absolute",
            bottom: 5 * S,
            right: 9 * S,
            fontSize: 6 * S,
            color: brand + "44",
            letterSpacing: 0.4,
          }}
        >
          courtesyfy.com.br
        </div>
      </div>

      {/* ── Overlay da chave — arrastável ── */}
      {overlay}
    </div>
  )
}

// ─── LayoutCard ──────────────────────────────────────────────────────────────
// Renderiza o CardRenderer real da campanha (com estilo, cores, gradientes)
// e sobrepõe o DraggableKeyOverlay no espaço CSS para arrastar a chave.

function LayoutCard({
  chave,
  campanha,
  loja,
  layout,
  keyPos,
  keyLocked,
  keyCor,
  keyFontSz,
  modoLimpo,
  onSetKeyPos,
}: {
  chave: Chave
  campanha: Campanha
  loja: Loja
  layout: LayoutConfig
} & KeyOverlayCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const cardSizeDef = CARD_SIZES[layout.tamanhoCard as TamanhoCard] ?? CARD_SIZES["PADRAO"]
  const displayW = Math.round(cardSizeDef.mmW * MM_TO_PX)
  const displayH = Math.round(cardSizeDef.mmH * MM_TO_PX)
  const scale = displayW / cardSizeDef.preW

  const { main, sub } = buildBenefitLabel(campanha)
  const expiraFmt = `Válido até: ${campanha.expiraEm}`

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (keyLocked || !wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    onSetKeyPos({
      x: clamp(((e.clientX - rect.left) / displayW) * 100, 5, 95),
      y: clamp(((e.clientY - rect.top) / displayH) * 100, 5, 95),
    })
  }

  return (
    <div
      ref={wrapperRef}
      style={{
        width: displayW,
        height: displayH,
        flexShrink: 0,
        overflow: "hidden",
        position: "relative",
        cursor: keyLocked ? "default" : "crosshair",
      }}
      onClick={handleClick}
    >
      {/* Conteúdo escalado para caber no container mm */}
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          pointerEvents: "none",
          width: cardSizeDef.preW,
          height: cardSizeDef.preH,
        }}
      >
        <CardRenderer
          estilo={layout.estiloCard as EstiloCard}
          size={cardSizeDef}
          corPrimaria={layout.corPrimaria}
          corFundo={layout.corFundo}
          corTexto={layout.corTexto}
          corSecundaria={layout.corSecundaria}
          img1={layout.imagem1Url ?? ""}
          img2={layout.imagem2Url ?? ""}
          opacidade={layout.opacidadeFundo}
          brilho={layout.brilho}
          saturacao={layout.saturacao}
          contraste={layout.contraste}
          raioCantos={layout.raioCantos}
          nomeLoja={loja.nome}
          nomeCampanha={campanha.nome}
          posicaoChave={null}
          modoLimpo={modoLimpo}
          beneficioMain={main}
          beneficioSub={sub || undefined}
          validadeTxt={expiraFmt}
          qrUrl={chave.landingUrl ?? undefined}
        />
      </div>

      {/* Overlay da chave — no espaço CSS, arrastável */}
      {keyPos && (
        <DraggableKeyOverlay
          codigo={chave.codigo}
          pos={keyPos}
          locked={keyLocked}
          keyCor={keyCor}
          keyFontSz={keyFontSz}
          brand={layout.corPrimaria}
          onDrag={onSetKeyPos}
          wrapperRef={wrapperRef}
          cardW={displayW}
          cardH={displayH}
        />
      )}
    </div>
  )
}

// ─── PrintGrid ────────────────────────────────────────────────────────────────

export function PrintGrid({
  chaves,
  campanha,
  loja,
  layout,
  nomeLote,
  totalChaves,
  geradoEm,
  formato,
  loteId,
  autoPrint,
}: Props) {
  // Inicializar posição da chave a partir do layout salvo
  const initialKeyPos: KeyPos | null =
    layout?.posicaoChaveX != null && layout?.posicaoChaveY != null
      ? { x: layout.posicaoChaveX, y: layout.posicaoChaveY }
      : null

  // Converter escalaChave do layout para keyFontSz em px (base 11px × escala)
  const initialFontSz = layout
    ? Math.round(Math.min(18, Math.max(7, 11 * (layout.escalaChave ?? 1))))
    : 11

  const [keyPos, setKeyPos] = useState<KeyPos | null>(initialKeyPos)
  const [keyLocked, setKeyLocked] = useState(initialKeyPos !== null)
  const [keyFontSz, setKeyFontSz] = useState(initialFontSz)
  const [keyCor, setKeyCor] = useState(loja.corPrimaria)
  const [modoLimpo, setModoLimpo] = useState(false)
  const isCartao = formato === "cartao"

  // Quando há layout associado à campanha, usar o LayoutCard com CardRenderer real
  const useLayoutCard = !!layout
  const layoutCardDef = layout
    ? (CARD_SIZES[layout.tamanhoCard as TamanhoCard] ?? CARD_SIZES["PADRAO"])
    : null
  const gridCols = layoutCardDef ? layoutCardDef.cols : 2

  const handleSetKeyPos = (pos: KeyPos) => {
    if (!keyLocked) setKeyPos(pos)
  }

  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 1200)
      return () => clearTimeout(t)
    }
  }, [autoPrint])

  // ── CSS de impressão ─────────────────────────────────────────────────────
  const printCSS = `
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@700&display=swap');

    @page {
      size: A4 portrait;
      margin: 8mm;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
    }

    @media print {
      /* ── Forçar modo claro: cancela a classe .dark do layout raiz ── */
      html, html.dark {
        background: white !important;
        color: black !important;
        color-scheme: light !important;
      }

      .no-print          { display: none !important; }
      aside, header, nav { display: none !important; }

      /* Dashboard layout: remove paddings e overflow que cortam o conteúdo */
      body, body > div, body > div > div, main {
        overflow: visible !important;
        height: auto !important;
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .screen-wrapper {
        background: transparent !important;
        padding: 0 !important;
        min-height: 0 !important;
      }

      .a4-sheet {
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        padding: 0 !important;
        width: auto !important;
        min-height: 0 !important;
      }

      /* Grade em mm para garantir tamanho físico correto no papel */
      .print-grid {
        gap: 4mm !important;
        grid-template-columns: repeat(${gridCols}, auto) !important;
      }
    }
  `

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${gridCols}, auto)`,
    gap: "4mm",
    justifyContent: "start",
    alignContent: "start",
  }

  const btnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontWeight: 600,
    fontSize: 13,
    padding: "9px 18px",
    borderRadius: 10,
    cursor: "pointer",
    border: "none",
  }

  const sharedProps = {
    campanha,
    loja,
    keyPos,
    keyLocked,
    keyCor,
    keyFontSz,
    modoLimpo,
    onSetKeyPos: handleSetKeyPos,
  }

  return (
    <>
      <style>{printCSS}</style>

      <div
        className="screen-wrapper"
        style={{ paddingTop: 28, paddingBottom: 40, background: "#e8e8e8", minHeight: "100vh" }}
      >
        {/* ── Toolbar ── */}
        <div
          className="no-print"
          style={{
            width: "100%",
            maxWidth: 794,
            margin: "0 auto 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {/* Voltar */}
          <button
            onClick={() => window.history.back()}
            style={{ ...btnBase, background: "#fff", color: "#374151", border: "1.5px solid #e5e7eb" }}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>

          {/* ── Controles centrais ── */}
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              flexWrap: "wrap",
              flex: 1,
              justifyContent: "center",
            }}
          >
            {/* Modo arte própria */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                cursor: "pointer",
                background: "#fff",
                padding: "9px 14px",
                borderRadius: 10,
                border: modoLimpo ? "1.5px solid #10b981" : "1.5px solid #e5e7eb",
                fontSize: 13,
                fontWeight: 600,
                color: modoLimpo ? "#065f46" : "#374151",
                whiteSpace: "nowrap",
              }}
            >
              <input
                type="checkbox"
                checked={modoLimpo}
                onChange={(e) => setModoLimpo(e.target.checked)}
                style={{ accentColor: "#10b981", width: 14, height: 14 }}
              />
              🖼️ Modo arte própria
            </label>

            {/* Painel da chave */}
            {!keyPos ? (
              /* Sem chave posicionada — instrução */
              <div
                style={{
                  background: "#fff",
                  padding: "9px 14px",
                  borderRadius: 10,
                  border: "1.5px solid #e5e7eb",
                  fontSize: 12,
                  color: "#6b7280",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <span style={{ fontSize: 16 }}>🎯</span>
                <span>Clique em qualquer card para posicionar a chave</span>
              </div>
            ) : (
              /* Com chave posicionada — controles */
              <div
                style={{
                  background: "#fff",
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${keyLocked ? "#10b981" : "#e5e7eb"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                {/* Cor */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  Cor
                  <input
                    type="color"
                    value={keyCor}
                    disabled={keyLocked}
                    onChange={(e) => setKeyCor(e.target.value)}
                    style={{
                      width: 30,
                      height: 26,
                      borderRadius: 4,
                      border: "1px solid #e5e7eb",
                      cursor: keyLocked ? "not-allowed" : "pointer",
                      padding: 2,
                    }}
                  />
                </label>

                {/* Tamanho */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  Tamanho
                  <input
                    type="range"
                    min={7}
                    max={18}
                    value={keyFontSz}
                    disabled={keyLocked}
                    onChange={(e) => setKeyFontSz(Number(e.target.value))}
                    style={{ width: 72, accentColor: keyCor }}
                  />
                  <span style={{ color: "#374151", fontWeight: 700, minWidth: 20 }}>
                    {keyFontSz}
                  </span>
                </label>

                {/* Travar / Destravar */}
                <button
                  type="button"
                  onClick={() => setKeyLocked(!keyLocked)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 11px",
                    borderRadius: 7,
                    border: `1.5px solid ${keyLocked ? "#10b981" : "#d1d5db"}`,
                    background: keyLocked ? "#ecfdf5" : "#fff",
                    color: keyLocked ? "#065f46" : "#6b7280",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {keyLocked ? "🔒 Travada" : "🔓 Travar"}
                </button>

                {/* Remover (só quando destravada) */}
                {!keyLocked && (
                  <button
                    type="button"
                    onClick={() => {
                      setKeyPos(null)
                      setKeyLocked(false)
                    }}
                    style={{
                      fontSize: 12,
                      color: "#ef4444",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "5px 4px",
                      fontWeight: 600,
                    }}
                  >
                    ✕ Remover
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Imprimir — window.print() no HTML renderizado (qualidade idêntica ao preview) */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <button
              onClick={() => window.print()}
              style={{ ...btnBase, background: "#111827", color: "#fff" }}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M6 9V2h9l3 3v4M6 9H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2h-1M6 9h8M9 14h6m-6 4h3" />
              </svg>
              Imprimir / Salvar PDF
            </button>
            {keyPos && !keyLocked && (
              <span style={{ fontSize: 11, color: "#f59e0b" }}>
                ⚠️ Trave a chave antes de imprimir
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div
          className="no-print"
          style={{
            width: "100%",
            maxWidth: 794,
            margin: "0 auto 10px",
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "#6b7280",
              background: "#fff",
              padding: "5px 12px",
              borderRadius: 20,
              border: "1px solid #e5e7eb",
            }}
          >
            📄 {nomeLote} · {totalChaves} chaves · gerado em {geradoEm}
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>
            💡 Arraste a chave para reposicionar · clique{" "}
            <strong>🔓 Travar</strong> antes de imprimir
          </span>
        </div>

        {/* A4 Sheet */}
        <div
          className="a4-sheet"
          style={{
            width: 794,
            minHeight: 1123,
            padding: "8mm",
            background: "#fff",
            boxShadow: "0 4px 32px rgba(0,0,0,0.2)",
            margin: "0 auto 32px",
            boxSizing: "border-box",
          }}
        >
          <div className="print-grid" style={gridStyle}>
            {chaves.map((chave) =>
              useLayoutCard && layout ? (
                <LayoutCard
                  key={chave.codigo}
                  chave={chave}
                  campanha={campanha}
                  loja={loja}
                  layout={layout}
                  keyPos={keyPos}
                  keyLocked={keyLocked}
                  keyCor={keyCor}
                  keyFontSz={keyFontSz}
                  modoLimpo={modoLimpo}
                  onSetKeyPos={handleSetKeyPos}
                />
              ) : isCartao ? (
                <CartaoCard key={chave.codigo} chave={chave} {...sharedProps} />
              ) : (
                <MdfCard key={chave.codigo} chave={chave} {...sharedProps} />
              ),
            )}
          </div>
        </div>
      </div>
    </>
  )
}
