"use client"

import { Printer } from "lucide-react"

/**
 * Chama a impressão do navegador, onde o destino "Salvar como PDF" existe em
 * todos os sistemas. Precisa ser cliente só por causa do `window.print()`.
 */
export function BotaoImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primario">
      <Printer size={16} aria-hidden />
      Salvar como PDF
    </button>
  )
}
