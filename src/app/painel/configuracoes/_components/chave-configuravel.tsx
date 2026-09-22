"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { alternarConfiguracao } from "../_actions"

/**
 * Uma opção da tela de configurações.
 *
 * O estado local responde na hora e volta atrás se o servidor recusar — sem
 * isso o ADMIN clica de novo achando que não pegou, e acaba religando o que
 * queria desligar.
 */
export function ChaveConfiguravel({
  chave,
  rotulo,
  descricao,
  perigo,
  ligada,
}: {
  chave: string
  rotulo: string
  descricao: string
  perigo?: string
  ligada: boolean
}) {
  const router = useRouter()
  const [salvando, iniciar] = useTransition()
  const [marcada, setMarcada] = useState(ligada)

  function alternar() {
    const anterior = marcada
    const nova = !marcada
    setMarcada(nova)

    iniciar(async () => {
      const r = await alternarConfiguracao(chave, nova)
      if (!r.ok) {
        setMarcada(anterior)
        toast.error(r.erro)
        return
      }
      toast.success(nova ? `${rotulo}: ligado.` : `${rotulo}: desligado.`)
      router.refresh()
    })
  }

  const idDescricao = `desc-${chave}`

  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-colors",
        marcada
          ? "border-white/20 bg-white/[0.06]"
          : "border-white/10 bg-white/[0.02] hover:border-white/20"
      )}
    >
      <input
        type="checkbox"
        checked={marcada}
        onChange={alternar}
        disabled={salvando}
        aria-describedby={idDescricao}
        className="mt-1 size-[18px] shrink-0 accent-blurple"
      />

      <div className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "text-[15px] font-medium",
              marcada ? "text-white" : "text-fog"
            )}
          >
            {rotulo}
          </span>
          {salvando && <Loader2 size={13} className="animate-spin text-greyple" aria-hidden />}
          {!marcada && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-greyple">
              Desligado
            </span>
          )}
        </span>

        <span id={idDescricao} className="mt-1 block text-[14px] leading-relaxed text-fog">
          {descricao}
        </span>

        {/* O aviso só aparece quando a opção já está desligada: antes disso
            seria alarme sobre algo que não aconteceu. */}
        {perigo && !marcada && (
          <span className="mt-2 flex items-start gap-2 text-[13px] leading-relaxed text-ember-orange">
            <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden />
            {perigo}
          </span>
        )}
      </div>
    </label>
  )
}
