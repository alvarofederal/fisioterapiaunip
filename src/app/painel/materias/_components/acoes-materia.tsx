"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Archive, ArchiveRestore, Trash2, Loader2 } from "lucide-react"
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
import { arquivarMateria, excluirMateria } from "../_actions"
import { DialogoMateria, type MateriaEditavel } from "./dialogo-materia"

export function AcoesMateria({
  materia,
  arquivada,
  temTrabalhos,
}: {
  materia: MateriaEditavel
  arquivada: boolean
  temTrabalhos: boolean
}) {
  const router = useRouter()
  const [processando, iniciar] = useTransition()
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  function alternarArquivo() {
    iniciar(async () => {
      const resultado = await arquivarMateria(materia.id, !arquivada)
      if (!resultado.ok) {
        toast.error(resultado.erro)
        return
      }
      toast.success(arquivada ? "Matéria restaurada." : "Matéria arquivada.")
      router.refresh()
    })
  }

  function confirmarExclusao() {
    iniciar(async () => {
      const resultado = await excluirMateria(materia.id)
      if (!resultado.ok) {
        toast.error(resultado.erro)
        setConfirmandoExclusao(false)
        return
      }
      toast.success("Matéria excluída.")
      setConfirmandoExclusao(false)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-1">
      <DialogoMateria materia={materia} />

      <button
        type="button"
        onClick={alternarArquivo}
        disabled={processando}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-fog transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
      >
        {processando ? (
          <Loader2 size={14} className="animate-spin" aria-hidden />
        ) : arquivada ? (
          <ArchiveRestore size={14} aria-hidden />
        ) : (
          <Archive size={14} aria-hidden />
        )}
        {arquivada ? "Restaurar" : "Arquivar"}
      </button>

      {/* Excluir só aparece quando não há histórico para perder. Com trabalhos
          publicados, arquivar é o caminho — e a ação de servidor recusa mesmo
          que alguém force. */}
      {!temTrabalhos && (
        <button
          type="button"
          onClick={() => setConfirmandoExclusao(true)}
          disabled={processando}
          aria-label={`Excluir ${materia.nome}`}
          className="inline-flex items-center rounded-lg px-2 py-1.5 text-fog transition-colors hover:bg-ekko-red/15 hover:text-ekko-red disabled:opacity-50"
        >
          <Trash2 size={14} aria-hidden />
        </button>
      )}

      <AlertDialog open={confirmandoExclusao} onOpenChange={setConfirmandoExclusao}>
        <AlertDialogContent className="border-white/10 bg-[#1a1b3a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="titulo-display text-[20px]">
              Excluir matéria
            </AlertDialogTitle>
            <AlertDialogDescription className="text-fog">
              Excluir <strong className="font-medium text-white">{materia.nome}</strong>?
              As anotações somem e não há como desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/15 bg-transparent text-fog hover:bg-white/[0.06] hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
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
