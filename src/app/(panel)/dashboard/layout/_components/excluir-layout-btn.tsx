"use client"

import { Trash2 } from "lucide-react"
import { excluirLayout } from "../_actions/layout-actions"

interface Props {
  layoutId: string
  disabled?: boolean
}

export function ExcluirLayoutBtn({ layoutId, disabled }: Props) {
  async function handle() {
    if (!confirm("Excluir este layout? Esta ação não pode ser desfeita.")) return
    await excluirLayout(layoutId)
  }

  return (
    <button
      onClick={handle}
      disabled={disabled}
      title={disabled ? "Layout em uso por campanhas" : "Excluir layout"}
      className="inline-flex items-center justify-center w-9 h-9 border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-400 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}
