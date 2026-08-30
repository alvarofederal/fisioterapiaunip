"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { alterarStatusCampanha } from "../_actions/alterar-status-campanha"

type Status = "RASCUNHO" | "ATIVA" | "PAUSADA" | "ENCERRADA" | "CANCELADA"

interface Props {
  campanhaId: string
  status: Status
}

export function AcoesCampanha({ campanhaId, status }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handle(novoStatus: "ATIVA" | "PAUSADA" | "ENCERRADA") {
    startTransition(async () => {
      const res = await alterarStatusCampanha(campanhaId, novoStatus)
      if (res.error) {
        alert(res.error)
      } else {
        router.refresh()
      }
    })
  }

  const encerrada = status === "ENCERRADA" || status === "CANCELADA"

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {status === "RASCUNHO" && (
        <button
          onClick={() => handle("ATIVA")}
          disabled={isPending}
          className="text-sm font-medium px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
        >
          Ativar campanha
        </button>
      )}
      {status === "ATIVA" && (
        <button
          onClick={() => handle("PAUSADA")}
          disabled={isPending}
          className="text-sm font-medium px-4 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors"
        >
          Pausar
        </button>
      )}
      {status === "PAUSADA" && (
        <button
          onClick={() => handle("ATIVA")}
          disabled={isPending}
          className="text-sm font-medium px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
        >
          Reativar
        </button>
      )}
      {!encerrada && (
        <button
          onClick={() => {
            if (confirm("Encerrar esta campanha? Esta ação é irreversível.")) {
              handle("ENCERRADA")
            }
          }}
          disabled={isPending}
          className="text-sm font-medium px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          Encerrar
        </button>
      )}
    </div>
  )
}
