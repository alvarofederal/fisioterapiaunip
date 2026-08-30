"use client"

import { useState, useTransition } from "react"
import { X, Loader2 } from "lucide-react"
import { cancelarSolicitacao } from "../_actions/impressao-actions"

export function CancelarSolicitacaoBtn({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)

  function handleClick() {
    if (!confirm) { setConfirm(true); return }
    startTransition(async () => {
      await cancelarSolicitacao(id)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors flex-shrink-0 ${
        confirm
          ? "border-red-300 text-red-600 bg-red-50 hover:bg-red-100"
          : "border-gray-200 dark:border-white/10 dash-subtitle hover:text-red-600 hover:border-red-200"
      }`}
    >
      {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
      {confirm ? "Confirmar cancelamento" : "Cancelar"}
    </button>
  )
}
