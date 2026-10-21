"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, ClipboardCopy, Loader2, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"
import { definirParticipacao } from "../atividades/_actions"

/**
 * Copia pela API da área de transferência e, se o navegador recusar (página
 * sem foco, navegador antigo, WebView de app), pelo caminho antigo: um
 * textarea escondido e o comando de copiar.
 */
async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    const area = document.createElement("textarea")
    area.value = texto
    area.setAttribute("readonly", "")
    area.style.position = "fixed"
    area.style.opacity = "0"
    document.body.appendChild(area)
    area.select()
    try {
      return document.execCommand("copy")
    } catch {
      return false
    } finally {
      area.remove()
    }
  }
}

/**
 * Botão "Participar" de um evento que pede confirmação.
 *
 * O aluno vê o próprio estado e quantos já confirmaram. O ADMIN vê também a
 * lista com nome e RA e copia pronta para mandar ao professor — os nomes e
 * RAs só chegam ao navegador do ADMIN (`lista` vem vazia para aluno).
 *
 * O estado local responde na hora e volta atrás se o servidor recusar, como
 * no carimbo do trabalho.
 */
export function ParticipacaoEvento({
  atividadeId,
  vou,
  total,
  aberta,
  lista,
  textoParaCopiar,
}: {
  atividadeId: string
  vou: boolean
  total: number
  aberta: boolean
  lista?: { nome: string; ra: string }[]
  textoParaCopiar?: string
}) {
  const router = useRouter()
  const [salvando, iniciar] = useTransition()
  const [estado, setEstado] = useState({ vou, total })

  function mudar(vai: boolean) {
    const anterior = estado
    setEstado({ vou: vai, total: estado.total + (vai ? 1 : -1) })

    iniciar(async () => {
      const r = await definirParticipacao(atividadeId, vai)
      if (!r.ok) {
        setEstado(anterior)
        toast.error(r.erro)
        return
      }
      toast.success(vai ? "Você está na lista." : "Você saiu da lista.")
      router.refresh()
    })
  }

  async function copiar() {
    if (!textoParaCopiar) return
    if (await copiarTexto(textoParaCopiar)) {
      toast.success("Lista copiada. É só colar na conversa com a professora.")
    } else {
      toast.error("Não deu para copiar. Selecione a lista abaixo e copie.")
    }
  }

  const confirmados = estado.total === 1 ? "1 confirmado" : `${estado.total} confirmados`

  return (
    <div className="border-t border-white/[0.08] pt-3">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-greyple">
        <Users size={13} aria-hidden />
        Participação
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        {!aberta ? (
          <span className="text-[13px] text-greyple">
            {estado.vou ? "Você confirmou presença. " : ""}Confirmações encerradas.
          </span>
        ) : estado.vou ? (
          <>
            <span className="inline-flex items-center gap-2 rounded-lg border border-spring-green/40 bg-spring-green/[0.12] px-3 py-2 text-[13px] font-medium text-spring-green">
              <Check size={15} aria-hidden />
              Você vai participar
            </span>
            <button
              type="button"
              onClick={() => mudar(false)}
              disabled={salvando}
              className="rounded-lg px-2.5 py-2 text-[13px] text-fog underline-offset-2 transition-colors hover:text-white hover:underline disabled:opacity-60"
            >
              Cancelar participação
            </button>
          </>
        ) : (
          <button type="button" onClick={() => mudar(true)} disabled={salvando} className="btn-primario">
            {salvando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <UserPlus size={16} aria-hidden />
            )}
            Participar
          </button>
        )}

        <span className="text-[13px] text-fog" aria-live="polite">
          {confirmados}
        </span>
      </div>

      {/* Só o ADMIN recebe a lista: é ela que vai para o professor. */}
      {lista && (
        <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/20 p-3.5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] font-semibold text-white">Quem vai</p>
            <button
              type="button"
              onClick={copiar}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-[13px] font-medium text-fog transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <ClipboardCopy size={14} aria-hidden />
              Copiar lista
            </button>
          </div>

          {lista.length === 0 ? (
            <p className="text-[13px] text-greyple">Ninguém confirmou ainda.</p>
          ) : (
            <ol className="list-decimal space-y-1 pl-5 text-[14px] text-white marker:text-greyple">
              {lista.map((pessoa) => (
                <li key={`${pessoa.nome}-${pessoa.ra}`}>
                  {pessoa.nome} <span className="font-mono text-[12px] text-greyple">RA {pessoa.ra}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}
