"use client"

import { CardRenderer, CARD_SIZES, type TamanhoCard, type EstiloCard } from "./card-renderer"

interface Props {
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
  nomeLoja: string
  /** Largura de exibição em px (o card será escalado para caber) */
  displayWidth?: number
}

export function LayoutMiniPreview({
  corPrimaria, corFundo, corTexto, corSecundaria,
  imagem1Url, imagem2Url,
  opacidadeFundo, brilho, saturacao, contraste, raioCantos,
  tamanhoCard, estiloCard, nomeLoja,
  displayWidth = 240,
}: Props) {
  const size   = CARD_SIZES[tamanhoCard as TamanhoCard] ?? CARD_SIZES.PADRAO
  const estilo = (estiloCard as EstiloCard) ?? "CLASSICO"

  const scale        = displayWidth / size.preW
  const displayHeight = Math.round(size.preH * scale)

  return (
    <div
      style={{ width: displayWidth, height: displayHeight, overflow: "hidden", position: "relative", flexShrink: 0 }}
      className="rounded-xl"
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", pointerEvents: "none" }}>
        <CardRenderer
          size={size}
          estilo={estilo}
          corPrimaria={corPrimaria}
          corFundo={corFundo}
          corTexto={corTexto}
          corSecundaria={corSecundaria}
          img1={imagem1Url ?? ""}
          img2={imagem2Url ?? ""}
          opacidade={opacidadeFundo}
          brilho={brilho}
          saturacao={saturacao}
          contraste={contraste}
          raioCantos={raioCantos}
          nomeLoja={nomeLoja}
          nomeCampanha="Campanha"
        />
      </div>
    </div>
  )
}
