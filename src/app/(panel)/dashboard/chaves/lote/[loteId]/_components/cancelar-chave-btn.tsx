"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { cancelarChave } from "../../../_actions/cancelar-chave"
import { X } from "lucide-react"

interface Props {
  chaveId: string
  status: string
}

export function CancelarChaveBtn({ chaveId, status }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const bloqueado = status === "RESGATADA" || status === "CANCELADA"
  if (bloqueado) return null

  function handleClick() {
    if (!confirm("Cancelar esta chave? Ela não poderá mais ser ativada.")) return
    startTransition(async () => {
      const res = await cancelarChave(chaveId)
      if (res.error) {
        alert(res.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title="Cancelar chave"
      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 disabled:opacity-40 transition-colors"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  )
}
