"use client"

import { Download } from "lucide-react"

interface Props {
  loteId: string
}

export function ExportarCsv({ loteId }: Props) {
  return (
    <a
      href={`/api/lotes/${loteId}/export`}
      download
      className="inline-flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
    >
      <Download className="w-4 h-4" />
      Exportar CSV
    </a>
  )
}
