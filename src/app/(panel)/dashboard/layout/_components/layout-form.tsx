"use client"

import { useActionState, useState, useTransition, useEffect, useRef } from "react"
import { useFormStatus } from "react-dom"
import {
  CheckCircle, Loader2, Upload, X, Star, LayoutGrid,
  Palette, ImageIcon, Sliders, Maximize2, Info, Printer, ScanLine,
} from "lucide-react"
import type { LayoutState } from "../_actions/layout-actions"
import {
  CardRenderer, CARD_SIZES, CardProps,
  type TamanhoCard, type EstiloCard, type CardSize, type PosicaoChave,
} from "./card-renderer"

// ─── Tipos de modo da chave ───────────────────────────────────────────────────

/**
 * none     — sem chave no preview
 * tracking — chave segue o cursor livremente (até clicar para fixar)
 * locked   — chave fixada; duplo-clique para redimensionar
 * resizing — modo redimensionamento ativo (arrastar handle)
 */
type KeyMode = "none" | "tracking" | "locked" | "resizing"

// ─── Estilos ─────────────────────────────────────────────────────────────────

const ESTILOS: Record<EstiloCard, { label: string; desc: string }> = {
  CLASSICO:    { label: "Clássico",    desc: "Logo · Info · QR" },
  MODERNO:     { label: "Moderno",     desc: "Barra + conteúdo" },
  MINIMALISTA: { label: "Minimalista", desc: "Limpo e elegante"  },
  GRADIENTE:   { label: "Gradiente",   desc: "Fundo degradê"    },
  NEON:        { label: "Neon",        desc: "Dark com brilho"  },
}

// ─── A4 PRINT MODAL ───────────────────────────────────────────────────────────

function computeA4Layout(def: CardSize, mmToPx: number) {
  const marginPx = Math.round(5 * mmToPx)
  const gapPx    = Math.round(2 * mmToPx)
  const cardW    = Math.round(def.mmW * mmToPx)
  const cardH    = Math.round(def.mmH * mmToPx)
  const scale    = cardW / def.preW
  const canvasW  = Math.round(210 * mmToPx)
  const canvasH  = Math.round(297 * mmToPx)
  return { marginPx, gapPx, cardW, cardH, scale, canvasW, canvasH }
}

interface ModalProps {
  onClose: () => void
  tamanho: TamanhoCard
  estilo: EstiloCard
  cardProps: CardProps
}

function A4PrintModal({ onClose, tamanho, estilo, cardProps }: ModalProps) {
  const def    = CARD_SIZES[tamanho]
  const mmToPx = 680 / 210
  const { marginPx, gapPx, cardW, cardH, scale, canvasW, canvasH } = computeA4Layout(def, mmToPx)

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  function handleGeneratePdf() {
    const params = new URLSearchParams({
      tamanho,
      estilo,
      corPrimaria:   cardProps.corPrimaria,
      corFundo:      cardProps.corFundo,
      corTexto:      cardProps.corTexto,
      corSecundaria: cardProps.corSecundaria,
      nomeLoja:      cardProps.nomeLoja,
      nomeCampanha:  cardProps.nomeCampanha,
      opacidade:     String(cardProps.opacidade),
      brilho:        String(cardProps.brilho),
      saturacao:     String(cardProps.saturacao),
      contraste:     String(cardProps.contraste),
      raioCantos:    String(cardProps.raioCantos),
      modoLimpo:     cardProps.modoLimpo ? "1" : "0",
      keyScale:      String(cardProps.escalaChave ?? 1),
    })
    if (cardProps.img2) params.set("logoUrl", cardProps.img2)
    if (cardProps.img1) params.set("bgUrl",   cardProps.img1)
    if (cardProps.posicaoChave) {
      params.set("keyX", String(cardProps.posicaoChave.x))
      params.set("keyY", String(cardProps.posicaoChave.y))
    }
    // Abre a página de impressão real (renderiza o CardRenderer, não jsPDF)
    window.open(`/print/layout?${params.toString()}`, "_blank")
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="my-6 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#181818", maxWidth: canvasW + 64, width: "100%" }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <h3 className="font-semibold text-white text-sm">Preview de Impressão — {def.label}</h3>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>
              {def.mmW}×{def.mmH} mm · {def.perFolha} cards · {def.cols}×{def.rows} · escala {Math.round(scale * 100)}%
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleGeneratePdf}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.28)" }}>
              <Printer className="w-3.5 h-3.5" /> Gerar PDF
            </button>
            <button type="button" onClick={onClose}
              className="p-2 rounded-lg" style={{ color: "rgba(255,255,255,0.45)" }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-8 overflow-auto" style={{ background: "#111" }}>
          <div style={{
            width: canvasW, height: canvasH, background: "#fff",
            boxShadow: "0 8px 48px rgba(0,0,0,0.5)", padding: marginPx,
            display: "grid",
            gridTemplateColumns: `repeat(${def.cols}, ${cardW}px)`,
            gap: gapPx, alignContent: "start", flexShrink: 0,
          }}>
            {Array.from({ length: def.perFolha }).map((_, i) => (
              <div key={i} style={{ width: cardW, height: cardH, overflow: "hidden", position: "relative", flexShrink: 0 }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute" }}>
                  <CardRenderer {...cardProps} estilo={estilo} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>Clique fora para fechar</span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>A4 · 5mm margem · 2mm espaçamento</span>
        </div>
      </div>
    </div>
  )
}

// ─── MINI A4 (sidebar) ────────────────────────────────────────────────────────

function SheetPreview({ onOpenModal, tamanho, estilo, ...cardProps }: CardProps & {
  estilo: EstiloCard; tamanho: TamanhoCard; onOpenModal: () => void
}) {
  const def = CARD_SIZES[tamanho]
  const { marginPx, gapPx, cardW, cardH, scale, canvasW, canvasH } = computeA4Layout(def, 1)
  return (
    <div className="flex flex-col items-center">
      <button type="button" onClick={onOpenModal} className="relative group cursor-pointer"
        title="Clique para ver o preview de impressão completo">
        <div style={{
          width: canvasW, height: canvasH, background: "#fff",
          border: "1px solid #d1d5db", borderRadius: 3, padding: marginPx,
          display: "grid",
          gridTemplateColumns: `repeat(${def.cols}, ${cardW}px)`,
          gap: gapPx, alignContent: "start", overflow: "hidden",
        }}>
          {Array.from({ length: def.perFolha }).map((_, i) => (
            <div key={i} style={{ width: cardW, height: cardH, overflow: "hidden", position: "relative" }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", pointerEvents: "none" }}>
                <CardRenderer {...cardProps} estilo={estilo} />
              </div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 rounded opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"
          style={{ background: "rgba(0,0,0,0.55)" }}>
          <Maximize2 className="w-7 h-7 text-white" />
          <span className="text-white text-xs font-medium">Ver impressão completa</span>
        </div>
      </button>
      <p className="text-xs dash-muted text-center mt-2">{def.perFolha} cards · {def.cols}×{def.rows} · clique para ampliar</p>
    </div>
  )
}

// ─── PREVIEW INTERATIVO — aba "Card" ─────────────────────────────────────────
//
// Estados da chave:
//   none     → clique → tracking (chave segue o cursor)
//   tracking → clique → locked   (chave fixada)
//   locked   → clique → tracking (desfixar / reposicionar)
//   locked   → duplo-clique → resizing (modo redimensionamento)
//   resizing → clique (fora do handle) → locked
//
// Redimensionamento: arraste o handle ◢ no canto inferior-direito da badge.

const PREVIEW_WIDTH = 520

interface InteractivePreviewProps {
  cardProps: CardProps
  estilo: EstiloCard
  keyMode: KeyMode
  onSetKeyPos:  (pos: PosicaoChave) => void
  onSetKeyMode: (mode: KeyMode) => void
  onSetKeyScale: (scale: number) => void
}

function InteractiveCardPreview({
  cardProps, estilo, keyMode, onSetKeyPos, onSetKeyMode, onSetKeyScale,
}: InteractivePreviewProps) {
  const def      = cardProps.size
  const cssScale = PREVIEW_WIDTH / def.preW
  const displayW = Math.round(def.preW * cssScale)
  const displayH = Math.round(def.preH * cssScale)
  const wrapperRef     = useRef<HTMLDivElement>(null)
  const pendingRef     = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

  // Converter coords de tela → percentual do card
  const toPct = (clientX: number, clientY: number) => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (!rect) return null
    return {
      x: clamp(((clientX - rect.left) / rect.width)  * 100, 2, 98),
      y: clamp(((clientY - rect.top)  / rect.height) * 100, 2, 98),
    }
  }

  // Chave segue o cursor no modo "tracking"
  const handleMouseMove = (e: React.MouseEvent) => {
    if (keyMode !== "tracking") return
    const pos = toPct(e.clientX, e.clientY)
    if (pos) onSetKeyPos(pos)
  }

  // Distinguir clique simples vs duplo via delay de 220ms
  const handleClick = (e: React.MouseEvent) => {
    const { clientX, clientY } = e // capturar antes de o evento ser reciclado

    if (pendingRef.current) {
      // Segundo clique dentro de 220ms → duplo-clique
      clearTimeout(pendingRef.current)
      pendingRef.current = null
      if (keyMode === "locked")   onSetKeyMode("resizing")
      if (keyMode === "resizing") onSetKeyMode("locked")
      return
    }

    pendingRef.current = setTimeout(() => {
      pendingRef.current = null
      // Clique simples
      if (keyMode === "none") {
        const pos = toPct(clientX, clientY)
        if (pos) { onSetKeyPos(pos); onSetKeyMode("tracking") }
      } else if (keyMode === "tracking") {
        onSetKeyMode("locked")
      } else if (keyMode === "locked") {
        onSetKeyMode("tracking") // desbloquear → reposicionar
      } else if (keyMode === "resizing") {
        onSetKeyMode("locked")  // concluir redimensionamento
      }
    }, 220)
  }

  // Estimar bounding box da KeyBadge no espaço CSS (para mostrar handles)
  const getKeyBounds = () => {
    const pos    = cardProps.posicaoChave
    const kScale = cardProps.escalaChave ?? 1
    if (!pos) return null
    const fs      = def.preH * 0.065 * kScale
    const preKeyW = 19 * fs * 0.585 + fs * 0.65 * 2 + 3   // texto + padding + borda
    const preKeyH = fs + fs * 0.28 * 2 + 3
    const cssW    = preKeyW * cssScale
    const cssH    = preKeyH * cssScale
    const cssCX   = (pos.x / 100) * displayW
    const cssCY   = (pos.y / 100) * displayH
    return { left: cssCX - cssW / 2, top: cssCY - cssH / 2, width: cssW, height: cssH }
  }

  // Arrastar handle de redimensionamento
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const startX     = e.clientX
    const startY     = e.clientY
    const startScale = cardProps.escalaChave ?? 1
    document.body.style.cursor = "nwse-resize"

    const onMove = (ev: MouseEvent) => {
      const dx       = ev.clientX - startX
      const dy       = ev.clientY - startY
      const newScale = clamp(startScale + (dx + dy) / 120, 0.35, 3.5)
      onSetKeyScale(newScale)
    }
    const onUp = () => {
      document.body.style.cursor = ""
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  const hasKey = !!cardProps.posicaoChave
  const bounds = (keyMode === "resizing" || keyMode === "locked") ? getKeyBounds() : null

  // Cores de borda por modo
  const outlineStyle: React.CSSProperties = (() => {
    if (keyMode === "tracking") return { outline: "2px solid #10b981", outlineOffset: 2 }
    if (keyMode === "resizing") return { outline: `2px solid ${cardProps.corPrimaria}`, outlineOffset: 2 }
    if (!hasKey)                return { outline: "2px dashed rgba(16,185,129,0.40)", outlineOffset: 2 }
    return {}
  })()

  // Cursor por modo
  const cursor = keyMode === "tracking" ? "crosshair"
               : keyMode === "resizing" ? "default"
               : "pointer"

  // Tooltip de hint por modo
  const hint = keyMode === "none"     ? "Clique para posicionar a chave"
             : keyMode === "tracking" ? "Mova o mouse · Clique para fixar"
             : keyMode === "locked"   ? "🔒 Fixada · Clique para mover · Duplo-clique para redimensionar"
             : "↔ Arraste ◢ para redimensionar · Clique para concluir"

  const hintColor = keyMode === "tracking" ? "rgba(16,185,129,0.90)"
                  : keyMode === "resizing" ? `${cardProps.corPrimaria}dd`
                  : "rgba(0,0,0,0.55)"

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={wrapperRef}
        style={{
          width: displayW, height: displayH,
          overflow: "hidden", position: "relative",
          cursor,
          borderRadius: cardProps.raioCantos * cssScale,
          userSelect: "none",
          ...outlineStyle,
        }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      >
        {/* Render do card (sem pointer-events para o mouse não parar no card) */}
        <div style={{
          transform: `scale(${cssScale})`,
          transformOrigin: "top left",
          position: "absolute",
          pointerEvents: "none",
        }}>
          <CardRenderer {...cardProps} estilo={estilo} />
        </div>

        {/* Outline da KeyBadge quando locked ou resizing */}
        {bounds && keyMode === "locked" && (
          <div style={{
            position: "absolute",
            left: bounds.left - 2,
            top: bounds.top - 2,
            width: bounds.width + 4,
            height: bounds.height + 4,
            border: `1px dashed ${cardProps.corPrimaria}88`,
            borderRadius: 5,
            pointerEvents: "none",
            zIndex: 22,
          }} />
        )}

        {/* Outline de redimensionamento */}
        {bounds && keyMode === "resizing" && (
          <div style={{
            position: "absolute",
            left: bounds.left - 2,
            top: bounds.top - 2,
            width: bounds.width + 4,
            height: bounds.height + 4,
            border: `2px dashed ${cardProps.corPrimaria}`,
            borderRadius: 5,
            pointerEvents: "none",
            zIndex: 22,
          }} />
        )}

        {/* Handle de redimensionamento — canto inferior-direito */}
        {bounds && keyMode === "resizing" && (
          <div
            style={{
              position: "absolute",
              left: bounds.left + bounds.width - 5,
              top: bounds.top + bounds.height - 5,
              width: 14,
              height: 14,
              background: cardProps.corPrimaria,
              border: "2px solid #fff",
              borderRadius: 3,
              cursor: "nwse-resize",
              zIndex: 30,
              boxShadow: "0 1px 6px rgba(0,0,0,0.35)",
            }}
            onMouseDown={handleResizeMouseDown}
          />
        )}

        {/* Hint flutuante */}
        <div style={{
          position: "absolute", bottom: 8, left: 0, right: 0,
          display: "flex", justifyContent: "center",
          pointerEvents: "none", zIndex: 25,
        }}>
          <span style={{
            background: hintColor,
            color: "#fff", fontSize: 10, fontWeight: 500,
            borderRadius: 7, padding: "3px 10px",
            maxWidth: "90%", textAlign: "center",
          }}>
            {hint}
          </span>
        </div>
      </div>

      {/* Linha de status abaixo do card */}
      <p className="text-xs dash-muted text-center">
        {def.mmW}×{def.mmH} mm · {def.perFolha}/folha A4
        {keyMode === "tracking"  && <span className="text-emerald-500 ml-1">· movendo</span>}
        {keyMode === "locked"    && <span className="ml-1" style={{ color: cardProps.corPrimaria }}>· fixada</span>}
        {keyMode === "resizing"  && <span className="ml-1" style={{ color: cardProps.corPrimaria }}>· redimensionando ({((cardProps.escalaChave ?? 1) * 100).toFixed(0)}%)</span>}
      </p>
    </div>
  )
}

// ─── Form utilities ───────────────────────────────────────────────────────────

function useImageUpload(initial: string | null) {
  const [url, setUrl]             = useState(initial ?? "")
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState("")

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
      const { imageUrl } = await res.json()
      setUrl(imageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no upload")
    } finally {
      setUploading(false)
    }
  }

  return { url, setUrl, uploading, error, handleFile }
}

function ColorPicker({ label, name, value, onChange, allowTransparent = false }: {
  label: string; name: string; value: string; onChange: (v: string) => void; allowTransparent?: boolean
}) {
  const isTransp = value === "transparent"
  // <input type="color"> não aceita "transparent" — usar fallback branco
  const colorInputVal = isTransp ? "#ffffff" : value

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-medium dash-muted">{label}</label>
        {allowTransparent && (
          <button
            type="button"
            onClick={() => onChange(isTransp ? "#fffdf7" : "transparent")}
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border transition-all ${
              isTransp
                ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-300 dark:border-violet-500/40"
                : "dash-muted border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/30"
            }`}
          >
            {isTransp ? "✓ Transparente" : "◻ Transparente"}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isTransp ? (
          <>
            {/* campo oculto envia "transparent" no submit do form */}
            <input type="hidden" name={name} value="transparent" />
            {/* Xadrez clássico de transparência (repeating-conic-gradient) */}
            <div
              className="flex-1 h-9 rounded-xl border-2 border-dashed border-violet-200 dark:border-violet-500/30 flex items-center justify-center gap-2"
              style={{
                background:
                  "repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 0 0 / 14px 14px",
              }}
            >
              <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-white/80 dark:bg-black/40 px-2 py-0.5 rounded-full">
                Sem fundo — transparente
              </span>
            </div>
          </>
        ) : (
          <>
            <input
              type="color"
              value={colorInputVal}
              onChange={e => onChange(e.target.value)}
              className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 dark:border-white/10 p-0.5 flex-shrink-0"
            />
            <input
              name={name}
              type="text"
              value={value}
              onChange={e => onChange(e.target.value)}
              className="dash-input font-mono w-28 !py-1.5 !px-3 !text-xs"
            />
            <div
              className="flex-1 h-9 rounded-xl border border-gray-100 dark:border-white/5"
              style={{ backgroundColor: value }}
            />
          </>
        )}
      </div>
    </div>
  )
}

function SliderField({ label, name, value, min, max, step = 1, unit = "%", onChange }: {
  label: string; name: string; value: number; min: number; max: number;
  step?: number; unit?: string; onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs font-medium dash-muted">{label}</label>
        <span className="text-xs font-mono dash-title">{value}{unit}</span>
      </div>
      <input type="range" name={name} min={min} max={max} step={step}
        value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-emerald-500" />
    </div>
  )
}

function ImageField({ label, hint, fieldName, hook }: {
  label: string; hint: string; fieldName: string; hook: ReturnType<typeof useImageUpload>
}) {
  return (
    <div>
      <p className="text-sm font-medium dash-subtitle mb-0.5">{label}</p>
      <p className="text-xs dash-muted mb-2">{hint}</p>
      <input type="hidden" name={fieldName} value={hook.url} />
      <div className="flex items-center gap-3">
        <label className="inline-flex items-center gap-2 cursor-pointer dash-card border text-xs font-medium px-3 py-2 rounded-xl transition-colors hover:border-emerald-400">
          {hook.uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          <span className="dash-subtitle">{hook.uploading ? "Enviando…" : "Escolher"}</span>
          <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={hook.handleFile} disabled={hook.uploading} className="hidden" />
        </label>
        {hook.url && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hook.url} alt="preview" className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-white/10" />
            <button type="button" onClick={() => hook.setUrl("")}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <X className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
        )}
      </div>
      {hook.error && <p className="text-red-500 text-xs mt-1">{hook.error}</p>}
    </div>
  )
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="inline-flex items-center gap-2 dash-btn-primary disabled:opacity-50 text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? "Salvando…" : "Salvar layout"}
    </button>
  )
}

function Section({ icon: Icon, title, children, compact = false }: {
  icon: React.ElementType; title: string; children: React.ReactNode; compact?: boolean
}) {
  return (
    <div className={`dash-card ${compact ? "p-3.5" : "p-5"} space-y-3`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-emerald-500" />
        <h2 className={`font-semibold dash-title ${compact ? "text-xs" : "text-sm"}`}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LayoutData {
  id?: string
  nome: string
  corPrimaria: string
  corFundo: string
  corTexto: string
  corSecundaria: string
  imagem1Url: string | null
  imagem2Url: string | null
  imagem3Url: string | null
  opacidadeFundo: number
  brilho: number
  saturacao: number
  contraste: number
  tamanhoCard: TamanhoCard
  estiloCard: EstiloCard
  raioCantos: number
  padrao: boolean
  posicaoChaveX?: number | null
  posicaoChaveY?: number | null
  escalaChave?:   number | null
}

interface Props {
  action: (prev: LayoutState, fd: FormData) => Promise<LayoutState>
  initial?: LayoutData
  nomeLoja: string
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function LayoutForm({ action, initial, nomeLoja }: Props) {
  const [state, formAction]  = useActionState<LayoutState, FormData>(action, {})
  const [, startTransition]  = useTransition()

  const [tamanho, setTamanho]         = useState<TamanhoCard>(initial?.tamanhoCard ?? "PADRAO")
  const [estilo, setEstilo]           = useState<EstiloCard>(initial?.estiloCard ?? "CLASSICO")
  const [corPrimaria, setCorPri]      = useState(initial?.corPrimaria ?? "#c8a96e")
  const [corFundo, setCorFundo]       = useState(initial?.corFundo ?? "#fffdf7")
  const [corTexto, setCorTexto]       = useState(initial?.corTexto ?? "#3a2510")
  const [corSec, setCorSec]           = useState(initial?.corSecundaria ?? "#5a3e28")
  const [opacidade, setOpacidade]     = useState(initial?.opacidadeFundo ?? 20)
  const [brilho, setBrilho]           = useState(initial?.brilho ?? 100)
  const [saturacao, setSaturacao]     = useState(initial?.saturacao ?? 100)
  const [contraste, setContraste]     = useState(initial?.contraste ?? 100)
  const [raioCantos, setRaio]         = useState(initial?.raioCantos ?? 8)
  const [posicaoChave, setPosicao]    = useState<PosicaoChave>(
    initial?.posicaoChaveX != null && initial?.posicaoChaveY != null
      ? { x: initial.posicaoChaveX, y: initial.posicaoChaveY }
      : null
  )
  const [escalaChave, setEscala]      = useState(initial?.escalaChave ?? 1.0)
  const [keyMode, setKeyMode]         = useState<KeyMode>(
    initial?.posicaoChaveX != null ? "locked" : "none"
  )
  const [modoLimpo, setModoLimpo]     = useState(false)
  const [nomeCampanha, setNomeCampanha] = useState("Campanha Exemplo")
  const [previewTab, setPreviewTab]   = useState<"card" | "folha">("card")
  const [showModal, setShowModal]     = useState(false)

  const img1 = useImageUpload(initial?.imagem1Url ?? null)
  const img2 = useImageUpload(initial?.imagem2Url ?? null)
  const img3 = useImageUpload(initial?.imagem3Url ?? null)

  const sizeInfo   = CARD_SIZES[tamanho]
  const cardProps: CardProps = {
    size: sizeInfo, corPrimaria, corFundo, corTexto,
    corSecundaria: corSec, img1: img1.url, img2: img2.url,
    opacidade, brilho, saturacao, contraste, raioCantos,
    nomeLoja, nomeCampanha, posicaoChave, escalaChave, modoLimpo,
  }

  // Remover chave + reset completo
  const removeKey = () => {
    setPosicao(null)
    setEscala(1.0)
    setKeyMode("none")
  }

  // ── Preview Panel ─────────────────────────────────────────────────────────
  const PreviewContent = () => (
    <div className="flex flex-col gap-3 h-full">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
        {(["card", "folha"] as const).map(tab => (
          <button key={tab} type="button" onClick={() => setPreviewTab(tab)}
            className={`flex-1 text-xs font-medium py-1.5 px-2 rounded-lg transition-all ${
              previewTab === tab ? "bg-white dark:bg-white/10 dash-title shadow-sm" : "dash-muted"
            }`}>
            {tab === "card" ? "Card" : "Folha A4"}
          </button>
        ))}
      </div>

      {/* Nome de preview */}
      <input type="text" value={nomeCampanha} onChange={e => setNomeCampanha(e.target.value)}
        placeholder="Nome da campanha (preview)" className="dash-input !text-xs !py-1.5" />

      {/* ── Aba Card: preview interativo, sem click para modal ── */}
      {previewTab === "card" && (
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
          <div className="overflow-auto w-full flex justify-center">
            <InteractiveCardPreview
              cardProps={cardProps}
              estilo={estilo}
              keyMode={keyMode}
              onSetKeyPos={setPosicao}
              onSetKeyMode={setKeyMode}
              onSetKeyScale={setEscala}
            />
          </div>
        </div>
      )}

      {/* ── Aba Folha A4 ── */}
      {previewTab === "folha" && (
        <div className="flex-1 flex justify-center items-start overflow-auto pt-1">
          <SheetPreview {...cardProps} estilo={estilo} tamanho={tamanho} onOpenModal={() => setShowModal(true)} />
        </div>
      )}

      {/* Stats chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs dash-muted bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-full">
          {sizeInfo.label} {sizeInfo.mmW}×{sizeInfo.mmH}mm
        </span>
        <span className="text-xs dash-muted bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-full">
          {sizeInfo.perFolha}×/A4
        </span>
        {posicaoChave ? (
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            Chave: {posicaoChave.x.toFixed(0)}%, {posicaoChave.y.toFixed(0)}%
            {escalaChave !== 1 && ` · ${(escalaChave * 100).toFixed(0)}%`}
          </span>
        ) : (
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 dash-muted">
            Chave: não posicionada
          </span>
        )}
      </div>
    </div>
  )

  return (
    <>
      {showModal && (
        <A4PrintModal onClose={() => setShowModal(false)} tamanho={tamanho} estilo={estilo} cardProps={cardProps} />
      )}

      {/* ── Mobile: Preview sticky no topo ──────────────────────────────── */}
      <div className="xl:hidden sticky top-0 z-20"
        style={{
          height: "46vh",
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        <div className="dark:hidden absolute inset-0" style={{ background: "rgba(255,255,255,0.96)" }} />
        <div className="hidden dark:block absolute inset-0" style={{ background: "rgba(17,17,17,0.96)" }} />
        <div className="relative h-full p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold dash-title flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Preview ao vivo
            </span>
            <span className="text-xs dash-muted">{sizeInfo.label}</span>
          </div>
          <PreviewContent />
        </div>
      </div>

      {/* ── Layout principal ─────────────────────────────────────────────── */}
      <div className="xl:grid xl:grid-cols-2 xl:gap-8 xl:items-start mt-4 xl:mt-0">

        {/* ── FORM (esquerda) ──────────────────────────────────────────── */}
        <form action={(fd) => startTransition(() => formAction(fd))} className="space-y-4 pb-8">
          {initial?.id && <input type="hidden" name="id" value={initial.id} />}
          <input type="hidden" name="tamanhoCard" value={tamanho} />
          <input type="hidden" name="estiloCard"  value={estilo} />
          <input type="hidden" name="imagem1Url"  value={img1.url} />
          <input type="hidden" name="imagem2Url"  value={img2.url} />
          <input type="hidden" name="imagem3Url"  value={img3.url} />
          {/* Posição da chave — salva quando o usuário posiciona no preview */}
          <input type="hidden" name="posicaoChaveX" value={posicaoChave?.x ?? ""} />
          <input type="hidden" name="posicaoChaveY" value={posicaoChave?.y ?? ""} />
          <input type="hidden" name="escalaChave"   value={escalaChave} />

          {state.success && (
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" /> Layout salvo com sucesso.
            </div>
          )}
          {state.error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm">
              {state.error}
            </div>
          )}

          {/* 1 — Identificação */}
          <Section icon={Info} title="Identificação">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium dash-subtitle mb-1.5">
                  Nome do layout <span className="text-red-500">*</span>
                </label>
                <input name="nome" defaultValue={initial?.nome ?? ""}
                  placeholder="Ex: Layout Natal 2025" className="dash-input" />
                {state.fieldErrors?.nome && (
                  <p className="text-red-500 text-xs mt-1">{state.fieldErrors.nome[0]}</p>
                )}
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="padrao" defaultChecked={initial?.padrao ?? false}
                    className="w-4 h-4 rounded accent-emerald-500" />
                  <span className="text-xs dash-subtitle font-medium flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    Layout padrão da loja
                  </span>
                </label>
              </div>
            </div>
          </Section>

          {/* 2+3 — Tamanho + Estilo */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Section icon={Maximize2} title="Tamanho" compact>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(CARD_SIZES) as [TamanhoCard, CardSize][]).map(([key, def]) => (
                  <button key={key} type="button"
                    title={`${def.mmW}×${def.mmH} mm · ${def.perFolha}/folha`}
                    onClick={() => setTamanho(key)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                      tamanho === key
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "dash-card border hover:border-emerald-400 dash-subtitle"
                    }`}>
                    {def.label}
                  </button>
                ))}
              </div>
              <p className="text-xs dash-muted flex items-center gap-1">
                <Info className="w-3 h-3" />
                {sizeInfo.mmW}×{sizeInfo.mmH} mm · {sizeInfo.perFolha}/folha · {sizeInfo.cols}×{sizeInfo.rows}
              </p>
            </Section>

            <Section icon={LayoutGrid} title="Estilo Visual" compact>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(ESTILOS) as [EstiloCard, { label: string; desc: string }][]).map(([key, def]) => (
                  <button key={key} type="button" title={def.desc}
                    onClick={() => setEstilo(key)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                      estilo === key
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "dash-card border hover:border-emerald-400 dash-subtitle"
                    }`}>
                    {def.label}
                  </button>
                ))}
              </div>
              <p className="text-xs dash-muted flex items-center gap-1">
                <Info className="w-3 h-3" />
                {ESTILOS[estilo].desc}
              </p>
            </Section>
          </div>

          {/* 4 — Posição da Chave */}
          <Section icon={ScanLine} title="Posição da Chave">
            {/* Modo arte própria */}
            <label className="flex items-start gap-3 cursor-pointer dash-card border p-3 rounded-xl transition-all hover:border-emerald-400">
              <input type="checkbox" checked={modoLimpo}
                onChange={e => setModoLimpo(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded accent-emerald-500 flex-shrink-0" />
              <div>
                <span className="text-xs font-semibold dash-subtitle">🖼️ Modo arte própria</span>
                <p className="text-xs dash-muted mt-0.5 leading-relaxed">
                  Oculta o template. Só imagem de fundo + chave overlay. Ideal para artes do Canva / Photoshop.
                </p>
              </div>
            </label>

            {/* Instruções */}
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/8 p-3 space-y-1">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                🎯 Interaja com o card ao vivo (aba <strong>Card</strong>):
              </p>
              <ul className="text-xs dash-muted space-y-0.5 pl-2">
                <li>• <strong>Clique</strong> — posiciona a chave, ela segue o mouse</li>
                <li>• <strong>Clique novamente</strong> — fixa a posição</li>
                <li>• <strong>Duplo-clique</strong> — modo redimensionamento</li>
                <li>• <strong>Arraste ◢</strong> — estica / encolhe a chave</li>
              </ul>
            </div>

            {/* Estado atual + botão remover */}
            {posicaoChave && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs dash-muted">
                  Posição: <code className="dash-title">{posicaoChave.x.toFixed(0)}%, {posicaoChave.y.toFixed(0)}%</code>
                  {" · "}
                  Tamanho: <code className="dash-title">{(escalaChave * 100).toFixed(0)}%</code>
                </span>
                <button type="button" onClick={removeKey}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                  Remover
                </button>
              </div>
            )}
          </Section>

          {/* 5 — Cores */}
          <Section icon={Palette} title="Paleta de Cores">
            <div className="grid sm:grid-cols-2 gap-4">
              <ColorPicker label="Cor de Destaque / Marca"  name="corPrimaria"   value={corPrimaria} onChange={setCorPri} />
              <ColorPicker label="Cor de Fundo do Card"     name="corFundo"      value={corFundo}   onChange={setCorFundo} allowTransparent />
              <ColorPicker label="Cor do Texto Principal"   name="corTexto"      value={corTexto}   onChange={setCorTexto} />
              <ColorPicker label="Cor do Texto Secundário"  name="corSecundaria" value={corSec}     onChange={setCorSec} />
            </div>
            <SliderField label="Arredondamento dos cantos" name="raioCantos"
              value={raioCantos} min={0} max={24} unit="px" onChange={setRaio} />
          </Section>

          {/* 6 — Imagens */}
          <Section icon={ImageIcon} title="Imagens">
            <ImageField label="Imagem de fundo"
              hint="Aparece atrás do conteúdo com a opacidade configurada abaixo."
              fieldName="imagem1Url" hook={img1} />
            <div className="border-t border-gray-100 dark:border-white/5 pt-3">
              <ImageField label="Logo personalizada"
                hint="Substitui o círculo de iniciais. Use PNG com fundo transparente."
                fieldName="imagem2Url" hook={img2} />
            </div>
            <div className="border-t border-gray-100 dark:border-white/5 pt-3">
              <ImageField label="Imagem extra"
                hint="Elemento decorativo adicional (imagem3)."
                fieldName="imagem3Url" hook={img3} />
            </div>
          </Section>

          {/* 7 — Filtros */}
          <Section icon={Sliders} title="Filtros Visuais">
            <p className="text-xs dash-muted -mt-1">
              Afetam a imagem de fundo quando carregada. Cores e opacidade alteram o card mesmo sem imagem.
            </p>
            <SliderField label="Opacidade da imagem de fundo" name="opacidadeFundo"
              value={opacidade} min={5} max={100} step={5} onChange={setOpacidade} />
            <SliderField label="Brilho"    name="brilho"    value={brilho}    min={0}  max={200} onChange={setBrilho} />
            <SliderField label="Saturação" name="saturacao" value={saturacao} min={0}  max={200} onChange={setSaturacao} />
            <SliderField label="Contraste" name="contraste" value={contraste} min={50} max={200} onChange={setContraste} />
          </Section>

          <div className="flex justify-end pt-2">
            <SaveButton />
          </div>
        </form>

        {/* ── PREVIEW DESKTOP (direita, sticky) ───────────────────────── */}
        <div className="hidden xl:flex flex-col gap-4 sticky top-6 self-start">
          <div className="dash-card p-5" style={{ minHeight: 520 }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold dash-title flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Preview ao vivo
              </span>
              <button type="button" onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 text-xs dash-muted hover:text-emerald-500 transition-colors border border-gray-200 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5">
                <Printer className="w-3.5 h-3.5" />
                Ver Folha A4
              </button>
            </div>
            <PreviewContent />
          </div>
        </div>
      </div>
    </>
  )
}
