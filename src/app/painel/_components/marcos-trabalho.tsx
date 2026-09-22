"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Stamp } from "lucide-react"
import { toast } from "sonner"
import { MARCOS_DO_TRABALHO, type ProgressoDoTrabalho } from "@/lib/atividades"
import { cn } from "@/lib/utils"
import { salvarProgressoAtividade } from "../materias/[id]/_actions"

/**
 * Carimbo e correção do trabalho presencial, marcados por cada aluno.
 *
 * O estado local responde na hora e volta atrás se o servidor recusar — sem
 * isso o aluno clica de novo achando que não pegou, e acaba desmarcando.
 */
export function MarcosDoTrabalho({
  atividadeId,
  progresso,
}: {
  atividadeId: string
  progresso: ProgressoDoTrabalho
}) {
  const router = useRouter()
  const [salvando, iniciar] = useTransition()
  const [marcado, setMarcado] = useState(progresso)

  function alternar(campo: keyof ProgressoDoTrabalho) {
    const anterior = marcado
    const novo = { ...marcado, [campo]: !marcado[campo] }
    setMarcado(novo)

    iniciar(async () => {
      const r = await salvarProgressoAtividade(atividadeId, novo)
      if (!r.ok) {
        setMarcado(anterior)
        toast.error(r.erro)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="border-t border-white/[0.08] pt-3">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-greyple">
        <Stamp size={13} aria-hidden />
        Sua folha
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {MARCOS_DO_TRABALHO.map(({ campo, rotulo, ajuda }) => (
          <label
            key={campo}
            title={ajuda}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors",
              marcado[campo]
                ? "border-spring-green/40 bg-spring-green/[0.12] text-spring-green"
                : "border-white/10 bg-white/[0.02] text-fog hover:border-white/20"
            )}
          >
            <input
              type="checkbox"
              checked={marcado[campo]}
              onChange={() => alternar(campo)}
              disabled={salvando}
              className="size-4 accent-spring-green"
            />
            {rotulo}
          </label>
        ))}
      </div>
    </div>
  )
}
