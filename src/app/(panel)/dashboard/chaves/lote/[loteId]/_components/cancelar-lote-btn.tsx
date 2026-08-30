"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { cancelarLote } from "../../../_actions/cancelar-chave"
import { Trash2 } from "lucide-react"

export function CancelarLoteBtn({ loteId }: { loteId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (
      !confirm(
        "Cancelar TODAS as chaves disponíveis deste lote? Chaves já resgatadas não serão afetadas. Esta ação não pode ser desfeita.",
      )
    )
      return

    startTransition(async () => {
      const res = await cancelarLote(loteId)
      if (res.error) {
        alert(res.error)
      } else {
        alert(`${res.canceladas} chave(s) cancelada(s).`)
        router.refresh()
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-2 border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
      {isPending ? "Cancelando..." : "Cancelar lote"}
    </button>
  )
}
