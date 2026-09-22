"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, MoreHorizontal, ShieldCheck, UserMinus, X } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  liberarAcesso,
  desativarAcesso,
  trocarPapel,
  recusarCadastro,
} from "../_actions"

export function AcoesUsuario({
  usuarioId,
  nome,
  ativo,
  role,
  souEu,
}: {
  usuarioId: string
  nome: string
  ativo: boolean
  role: "ADMIN" | "ALUNO"
  souEu: boolean
}) {
  const router = useRouter()
  const [processando, iniciar] = useTransition()
  const [confirmandoRecusa, setConfirmandoRecusa] = useState(false)

  function executar(acao: () => Promise<{ ok: boolean; erro?: string }>, sucesso: string) {
    iniciar(async () => {
      const r = await acao()
      if (!r.ok) {
        toast.error(r.erro ?? "Não foi possível concluir.")
        return
      }
      toast.success(sucesso)
      setConfirmandoRecusa(false)
      router.refresh()
    })
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {!ativo && (
        <>
          {confirmandoRecusa ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-fog">Recusar?</span>
              <button
                type="button"
                disabled={processando}
                onClick={() => executar(() => recusarCadastro(usuarioId), "Cadastro recusado.")}
                className="rounded-lg bg-ekko-red px-2.5 py-1 text-[12px] font-semibold text-white hover:bg-ekko-red/85 disabled:opacity-50"
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoRecusa(false)}
                className="rounded-lg px-2 py-1 text-[12px] font-medium text-fog hover:bg-white/[0.08] hover:text-white"
              >
                Não
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={processando}
                onClick={() =>
                  executar(() => liberarAcesso(usuarioId), `${nome.split(" ")[0]} liberado.`)
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-spring-green/15 px-3 py-1.5 text-[13px] font-semibold text-spring-green transition-colors hover:bg-spring-green/25 disabled:opacity-50"
              >
                {processando ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden />
                ) : (
                  <Check size={14} aria-hidden />
                )}
                Liberar
              </button>
              <button
                type="button"
                disabled={processando}
                onClick={() => setConfirmandoRecusa(true)}
                aria-label={`Recusar cadastro de ${nome}`}
                className="rounded-lg p-1.5 text-greyple transition-colors hover:bg-ekko-red/15 hover:text-ekko-red disabled:opacity-50"
              >
                <X size={15} aria-hidden />
              </button>
            </>
          )}
        </>
      )}

      {ativo && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={processando}
              aria-label={`Ações para ${nome}`}
              className="rounded-lg p-1.5 text-greyple transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
            >
              {processando ? (
                <Loader2 size={16} className="animate-spin" aria-hidden />
              ) : (
                <MoreHorizontal size={16} aria-hidden />
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="border-white/10 bg-[#23272a]">
            <DropdownMenuItem
              onClick={() =>
                executar(
                  () => trocarPapel(usuarioId, role === "ADMIN" ? "ALUNO" : "ADMIN"),
                  role === "ADMIN" ? "Agora é aluno." : "Agora é administrador."
                )
              }
              className="gap-2 text-fog focus:bg-white/[0.08] focus:text-white"
            >
              <ShieldCheck size={14} aria-hidden />
              {role === "ADMIN" ? "Tornar aluno" : "Tornar administrador"}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/10" />

            <DropdownMenuItem
              onClick={() =>
                executar(() => desativarAcesso(usuarioId), `${nome.split(" ")[0]} desativado.`)
              }
              className="gap-2 text-ekko-red focus:bg-ekko-red/15 focus:text-ekko-red"
            >
              <UserMinus size={14} aria-hidden />
              Desativar acesso
              {souEu && <span className="ml-1 text-[11px] text-greyple">(você)</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
