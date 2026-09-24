"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { DialogoAviso, type AvisoEditavel } from "./dialogo-aviso"
import { alternarAviso, excluirAviso } from "../_actions"

export function AcoesAviso({ aviso }: { aviso: AvisoEditavel }) {
  const router = useRouter()
  const [processando, iniciar] = useTransition()
  const [confirmando, setConfirmando] = useState(false)

  function alternar() {
    iniciar(async () => {
      const r = await alternarAviso(aviso.id, !aviso.ativo)
      if (!r.ok) {
        toast.error(r.erro)
        return
      }
      toast.success(aviso.ativo ? "Aviso guardado." : "Aviso de volta ao mural.")
      router.refresh()
    })
  }

  function excluir() {
    iniciar(async () => {
      const r = await excluirAviso(aviso.id)
      if (!r.ok) {
        toast.error(r.erro)
        return
      }
      toast.success("Aviso excluído.")
      setConfirmando(false)
      router.refresh()
    })
  }

  if (confirmando) {
    return (
      <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-3">
        <p className="text-[13px] text-fog">
          Excluir de vez? Guardar já tira do mural e permite trazer de volta.
        </p>
        <button
          type="button"
          onClick={excluir}
          disabled={processando}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ekko-red/15 px-2.5 py-1.5 text-[13px] font-medium text-ekko-red transition-colors hover:bg-ekko-red/25 disabled:opacity-50"
        >
          {processando && <Loader2 size={14} className="animate-spin" aria-hidden />}
          Excluir
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-fog hover:bg-white/[0.08] hover:text-white"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-t border-white/[0.08] pt-3">
      <DialogoAviso aviso={aviso} />

      <button
        type="button"
        onClick={alternar}
        disabled={processando}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-fog transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
      >
        {processando ? (
          <Loader2 size={14} className="animate-spin" aria-hidden />
        ) : aviso.ativo ? (
          <EyeOff size={14} aria-hidden />
        ) : (
          <Eye size={14} aria-hidden />
        )}
        {aviso.ativo ? "Guardar" : "Mostrar"}
      </button>

      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-ekko-red transition-colors hover:bg-ekko-red/10"
      >
        <Trash2 size={14} aria-hidden />
        Excluir
      </button>
    </div>
  )
}
