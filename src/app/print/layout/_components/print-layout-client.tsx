"use client"

import { useEffect } from "react"
import { Printer } from "lucide-react"
import {
  CardRenderer,
  CARD_SIZES,
  type CardProps,
  type TamanhoCard,
  type EstiloCard,
  type PosicaoChave,
} from "@/app/(panel)/dashboard/layout/_components/card-renderer"

// 96dpi CSS reference: 1mm = 3.7795px
// Garante que o CardRenderer (em pixels) caiba exatamente no container mm.
const MM_TO_PX = 3.7795

// Margem e gap internos da folha A4 (mesmos do preview do modal)
const MARGIN_MM = 5
const GAP_MM    = 2

interface Props {
  params: Record<string, string>
}

export function PrintLayoutClient({ params }: Props) {
  // ── Forçar modo claro nesta página ─────────────────────────────────────────
  // O layout raiz injeta a classe "dark" no <html>. Removemos aqui e
  // restauramos ao sair para não afetar outras abas.
  useEffect(() => {
    const html = document.documentElement
    const wasDark = html.classList.contains("dark")
    html.classList.remove("dark")
    return () => {
      if (wasDark) html.classList.add("dark")
    }
  }, [])

  // ── Params ─────────────────────────────────────────────────────────────────
  const tamanho = (params.tamanho ?? "PADRAO") as TamanhoCard
  const estilo  = (params.estilo  ?? "CLASSICO") as EstiloCard
  const def     = CARD_SIZES[tamanho] ?? CARD_SIZES["PADRAO"]

  const kx = params.keyX ? parseFloat(params.keyX) : null
  const ky = params.keyY ? parseFloat(params.keyY) : null
  const posicaoChave: PosicaoChave =
    kx !== null && ky !== null ? { x: kx, y: ky } : null

  const cardProps: CardProps = {
    size:          def,
    corPrimaria:   params.corPrimaria   ?? "#c8a96e",
    corFundo:      params.corFundo      ?? "#fffdf7",
    corTexto:      params.corTexto      ?? "#3a2510",
    corSecundaria: params.corSecundaria ?? "#5a3e28",
    img1:          params.bgUrl         ?? "",
    img2:          params.logoUrl       ?? "",
    opacidade:     parseInt(params.opacidade  ?? "20"),
    brilho:        parseInt(params.brilho     ?? "100"),
    saturacao:     parseInt(params.saturacao  ?? "100"),
    contraste:     parseInt(params.contraste  ?? "100"),
    raioCantos:    parseInt(params.raioCantos ?? "8"),
    nomeLoja:      decodeURIComponent(params.nomeLoja     ?? "Minha Loja"),
    nomeCampanha:  decodeURIComponent(params.nomeCampanha ?? "Campanha Exemplo"),
    posicaoChave,
    escalaChave:   parseFloat(params.keyScale ?? "1"),
    modoLimpo:     params.modoLimpo === "1",
  }

  // ── Escala: CardRenderer renderiza em pixels (preW × preH).
  // Precisamos que caiba no container mm. A escala CSS garante isso
  // tanto na tela (96dpi) quanto na impressão (o browser mapeia mm → dpi do
  // printer automaticamente — texto e CSS ficam vetoriais, imagens em alta res).
  const printScale = (def.mmW * MM_TO_PX) / def.preW

  // ── CSS inline injetado uma única vez ─────────────────────────────────────
  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* Forçar modo claro mesmo com a classe .dark no <html> */
    :root { color-scheme: light !important; }
    html, html.dark, body {
      background: #f3f4f6 !important;
      color: #111 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Barra de UI (some no print) */
    .pbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: #1e1e2e; color: #fff;
      padding: 10px 20px;
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px;
      box-shadow: 0 2px 16px rgba(0,0,0,.4);
    }
    .pbar-btn {
      display: flex; align-items: center; gap: 7px;
      background: #10b981; color: #fff;
      border: none; border-radius: 8px;
      padding: 9px 18px; font-size: 13px; font-weight: 600;
      cursor: pointer; white-space: nowrap;
      transition: background .15s;
    }
    .pbar-btn:hover { background: #059669; }

    /* Página */
    .page-body {
      margin-top: 56px;
      padding: ${MARGIN_MM}mm;
      min-height: 100vh;
      background: #f3f4f6;
      display: flex;
      justify-content: center;
    }

    /* Grade de cards — mesmas medidas do modal de preview */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(${def.cols}, ${def.mmW}mm);
      gap: ${GAP_MM}mm;
      width: fit-content;
      align-content: start;
    }

    /* Célula do card: container mm com overflow hidden */
    .card-cell {
      width:  ${def.mmW}mm;
      height: ${def.mmH}mm;
      overflow: hidden;
      position: relative;
      flex-shrink: 0;
      border-radius: ${Math.round(def.mmW * 0.02)}mm;
    }

    /* Conteúdo interno escalado para caber no container mm */
    .card-inner {
      transform: scale(${printScale});
      transform-origin: top left;
      position: absolute;
      pointer-events: none;
      /* Dimensões nativas do CardRenderer — não alterar */
      width:  ${def.preW}px;
      height: ${def.preH}px;
    }

    /* ── Print ────────────────────────────────────────────────── */
    @media print {
      @page { size: A4 portrait; margin: ${MARGIN_MM}mm; }

      .pbar        { display: none !important; }
      .page-body   { margin-top: 0 !important; padding: 0 !important;
                     background: white !important; min-height: unset; }
      html, body   { background: white !important; }
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ── Barra de controle ─────────────────────────────────────────────── */}
      <div className="pbar">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <strong style={{ fontSize: 14 }}>
            Preview de Impressão — {def.label}
          </strong>
          <span style={{ fontSize: 12, opacity: 0.55 }}>
            {def.mmW}×{def.mmH} mm · {def.perFolha} cards por folha A4 ·{" "}
            {def.cols}×{def.rows}
          </span>
        </div>

        <button className="pbar-btn" onClick={() => window.print()}>
          <Printer size={15} />
          Imprimir / Salvar PDF
        </button>
      </div>

      {/* ── Grade de cards ────────────────────────────────────────────────── */}
      <div className="page-body">
        <div className="card-grid">
          {Array.from({ length: def.perFolha }).map((_, i) => (
            <div key={i} className="card-cell">
              <div className="card-inner">
                <CardRenderer {...cardProps} estilo={estilo} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
