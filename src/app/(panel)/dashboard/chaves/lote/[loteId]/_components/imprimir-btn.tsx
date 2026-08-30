"use client"

import { useState } from "react"
import { Printer, Crown } from "lucide-react"
import Link from "next/link"

interface Props {
  loteId: string
}

const FORMATS = [
  { value: "cartao", label: "Cartão (3,5 × 7 cm) — 10 por A4" },
  { value: "mdf",    label: "MDF Sublimação (9 × 9 cm) — 4 por A4" },
]

export function ImprimirBtn({ loteId }: Props) {
  const [formato, setFormato] = useState("cartao")

  return (
    <div className="flex items-center gap-0 rounded-xl border border-gray-200 overflow-hidden">
      {/* Premium badge + select */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border-r border-gray-200">
        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <select
          value={formato}
          onChange={(e) => setFormato(e.target.value)}
          className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer pr-1"
        >
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Preview button */}
      <Link
        href={`/dashboard/chaves/lote/${loteId}/imprimir?formato=${formato}`}
        className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 transition-colors"
      >
        <Printer className="w-4 h-4" />
        Preview / Imprimir
      </Link>
    </div>
  )
}
