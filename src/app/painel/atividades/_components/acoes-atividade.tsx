"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Archive, ArchiveRestore, Copy, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { arquivarAtividade, clonarAtividade, excluirAtividade } from "../_actions"
import { DialogoAtividade, type AtividadeEditavel } from "./dialogo-atividade"

export function AcoesAtividade({
  atividade,
  arquivada,
  materias,
}: {
  atividade: AtividadeEditavel
  arquivada: boolean
  materias: { id: string; nome: string }[]
}) {
  const router = useRouter()
  const [processando, iniciar] = useTransition()
  const [confirmando, setConfirmando] = useState(false)

  function alternarArquivo() {
    iniciar(async () => {
      const r = await arquivarAtividade(atividade.id, !arquivada)
      if (!r.ok) {
        toast.error(r.erro)
        return
      }
      toast.success(arquivada ? "Atividade restaurada." : "Atividade arquivada.")
      router.refresh()
    })
  }

  function clonar() {
    iniciar(async () => {
      const r = await clonarAtividade(atividade.id)
      if (!r.ok) {
        toast.error(r.erro)
        return
      }
      toast.success("Cópia criada — ajuste a data e publique.")
      router.refresh()
    })
  }

  function excluir() {
    iniciar(async () => {
      const r = await excluirAtividade(atividade.id)
      if (!r.ok) {
        toast.error(r.erro)
        setConfirmando(false)
        return
      }
      toast.success("Atividade excluída.")
      setConfirmando(false)
      router.refresh()
    })
  }

  const botao =
    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-fog transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-50"

  return (
    <div className="flex items-center gap-1">
      <DialogoAtividade materias={materias} atividade={atividade} />

      <button type="button" onClick={clonar} disabled={processando} className={botao}>
        {processando ? (
          <Loader2 size={14} className="animate-spin" aria-hidden />
        ) : (
          <Copy size={14} aria-hidden />
        )}
        Clonar
      </button>

      <button type="button" onClick={alternarArquivo} disabled={processando} className={botao}>
        {arquivada ? <ArchiveRestore size={14} aria-hidden /> : <Archive size={14} aria-hidden />}
        {arquivada ? "Restaurar" : "Arquivar"}
      </button>

      <button
        type="button"
        onClick={() => setConfirmando(true)}
        disabled={processando}
        aria-label={`Excluir ${atividade.titulo}`}
        className="inline-flex items-center rounded-lg px-2 py-1.5 text-fog transition-colors hover:bg-ekko-red/15 hover:text-ekko-red disabled:opacity-50"
      >
        <Trash2 size={14} aria-hidden />
      </button>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent className="border-white/10 bg-[#1a1b3a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="titulo-display text-[20px]">
              Excluir atividade
            </AlertDialogTitle>
            <AlertDialogDescription className="text-fog">
              Excluir <strong className="font-medium text-white">{atividade.titulo}</strong>?
              Os anexos vão junto e não há como desfazer. Se for só para tirar do mural,
              arquive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/15 bg-transparent text-fog hover:bg-white/[0.06] hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={excluir}
              className="bg-ekko-red text-white hover:bg-ekko-red/85"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
