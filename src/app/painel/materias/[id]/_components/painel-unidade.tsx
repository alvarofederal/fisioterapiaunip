"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Loader2, Trash2, Plus, NotebookPen } from "lucide-react"
import { toast } from "sonner"
import { STATUS_ESTUDO, ORDEM_STATUS } from "@/lib/dominio"
import {
  ITENS_DA_UNIDADE,
  progressoDaUnidade,
  rotuloUnidade,
  type UnidadeComProgresso,
  type ProgressoDaUnidade,
  type TeleaulaComEstudo,
  type CampoDaUnidade,
} from "@/lib/unidades"
import { cn } from "@/lib/utils"
import type { StatusEstudo } from "@/generated/prisma"
import {
  salvarProgressoUnidade,
  salvarEstudoTeleaula,
  excluirUnidade,
  excluirTeleaula,
  criarTeleaula,
} from "../_actions"

const LIMITE_RESUMO = 10000

export function PainelUnidade({
  unidade,
  corDaMateria,
  ehAdmin,
}: {
  unidade: UnidadeComProgresso
  corDaMateria: string
  ehAdmin: boolean
}) {
  const router = useRouter()
  const [salvando, iniciar] = useTransition()

  // Espelho local do que está no servidor: a marcação precisa responder na
  // hora, senão o aluno clica duas vezes achando que não pegou.
  const [marcado, setMarcado] = useState<ProgressoDaUnidade>(unidade.progresso)

  const contagem = progressoDaUnidade({ ...unidade, progresso: marcado })

  function alternar(campo: CampoDaUnidade) {
    const anterior = marcado
    const novo = { ...marcado, [campo]: !marcado[campo] }
    setMarcado(novo)

    iniciar(async () => {
      const r = await salvarProgressoUnidade(unidade.id, novo)
      if (!r.ok) {
        // Devolve o visual ao que o servidor ainda tem, para a tela não
        // mentir que salvou.
        setMarcado(anterior)
        toast.error(r.erro)
        return
      }
      router.refresh()
    })
  }

  function apagarUnidade() {
    if (
      !confirm(
        `Excluir a ${rotuloUnidade(unidade)}?\n\nAs teleaulas e os resumos de TODA a turma vão junto. Não há como desfazer.`
      )
    ) {
      return
    }

    iniciar(async () => {
      const r = await excluirUnidade(unidade.id)
      if (!r.ok) {
        toast.error(r.erro)
        return
      }
      toast.success("Unidade excluída.")
      router.refresh()
    })
  }

  function novaTeleaula() {
    const numero = (unidade.teleaulas.at(-1)?.numero ?? 0) + 1

    iniciar(async () => {
      const r = await criarTeleaula({ unidadeId: unidade.id, numero, titulo: "" })
      if (!r.ok) {
        toast.error(r.erro)
        return
      }
      toast.success(`Teleaula ${numero} criada.`)
      router.refresh()
    })
  }

  return (
    <details className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] [&[open]]:border-white/20">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5 transition-colors hover:bg-white/[0.03]">
        <div className="min-w-0 flex-1">
          <h3 className="titulo-display text-[17px] leading-tight">{rotuloUnidade(unidade)}</h3>
          <p className="mt-1 text-[13px] text-greyple">
            {unidade.teleaulas.length === 0
              ? "Sem teleaulas"
              : `${unidade.teleaulas.length} ${
                  unidade.teleaulas.length === 1 ? "teleaula" : "teleaulas"
                }`}
            {" · "}
            {contagem.feitos} de {contagem.total} cumpridos
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span
            className="w-11 text-right text-[13px] font-semibold tabular-nums"
            style={{ color: contagem.percentual === 100 ? corDaMateria : undefined }}
          >
            {contagem.percentual}%
          </span>
          <ChevronDown
            size={18}
            aria-hidden
            className="text-greyple transition-transform group-open:rotate-180"
          />
        </div>
      </summary>

      <div className="border-t border-white/[0.08] p-5">
        <fieldset>
          <legend className="text-[11px] font-semibold uppercase tracking-[0.08em] text-greyple">
            Material da unidade
          </legend>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ITENS_DA_UNIDADE.map(({ campo, rotulo, ajuda }) => (
              <label
                key={campo}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                  marcado[campo]
                    ? "border-white/20 bg-white/[0.07]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                )}
              >
                <input
                  type="checkbox"
                  checked={marcado[campo]}
                  onChange={() => alternar(campo)}
                  disabled={salvando}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--acento-item)]"
                  style={{ ["--acento-item" as string]: corDaMateria }}
                />
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-[14px] font-medium",
                      marcado[campo] ? "text-white" : "text-fog"
                    )}
                  >
                    {rotulo}
                  </span>
                  <span className="block text-[12px] text-greyple">{ajuda}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {unidade.teleaulas.length > 0 && (
          <div className="mt-6 flex flex-col gap-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-greyple">
              Teleaulas
            </h4>
            {unidade.teleaulas.map((teleaula) => (
              <BlocoTeleaula
                key={teleaula.id}
                teleaula={teleaula}
                corDaMateria={corDaMateria}
                ehAdmin={ehAdmin}
              />
            ))}
          </div>
        )}

        {ehAdmin && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-white/[0.08] pt-4">
            <button
              type="button"
              onClick={novaTeleaula}
              disabled={salvando}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-fog transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
            >
              <Plus size={14} aria-hidden />
              Nova teleaula
            </button>
            <button
              type="button"
              onClick={apagarUnidade}
              disabled={salvando}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-ekko-red transition-colors hover:bg-ekko-red/10 disabled:opacity-50"
            >
              {salvando ? (
                <Loader2 size={14} className="animate-spin" aria-hidden />
              ) : (
                <Trash2 size={14} aria-hidden />
              )}
              Excluir unidade
            </button>
          </div>
        )}
      </div>
    </details>
  )
}

function BlocoTeleaula({
  teleaula,
  corDaMateria,
  ehAdmin,
}: {
  teleaula: TeleaulaComEstudo
  corDaMateria: string
  ehAdmin: boolean
}) {
  const router = useRouter()
  const [salvando, iniciar] = useTransition()
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(teleaula.anotacoes ?? "")
  const [status, setStatus] = useState<StatusEstudo>(teleaula.status)

  const tema = STATUS_ESTUDO[status]
  const rotulo = teleaula.titulo
    ? `Aula ${teleaula.numero} · ${teleaula.titulo}`
    : `Aula ${teleaula.numero}`

  function salvar(novoStatus: StatusEstudo, novoTexto: string) {
    iniciar(async () => {
      const r = await salvarEstudoTeleaula(teleaula.id, {
        status: novoStatus,
        anotacoes: novoTexto,
      })
      if (!r.ok) {
        toast.error(r.erro)
        return
      }
      setEditando(false)
      router.refresh()
    })
  }

  function apagar() {
    if (!confirm(`Excluir a ${rotulo}?\n\nO resumo de toda a turma nessa aula vai junto.`)) return

    iniciar(async () => {
      const r = await excluirTeleaula(teleaula.id)
      if (!r.ok) {
        toast.error(r.erro)
        return
      }
      toast.success("Teleaula excluída.")
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] font-medium text-white">{rotulo}</p>

        <div className="flex flex-wrap items-center gap-1">
          {ORDEM_STATUS.map((codigo) => {
            const info = STATUS_ESTUDO[codigo]
            const ativo = status === codigo
            return (
              <button
                key={codigo}
                type="button"
                disabled={salvando}
                aria-pressed={ativo}
                onClick={() => {
                  setStatus(codigo)
                  salvar(codigo, texto)
                }}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors disabled:opacity-50",
                  ativo ? "" : "text-greyple hover:bg-white/[0.06] hover:text-white"
                )}
                style={ativo ? { background: info.suave, color: info.cor } : undefined}
              >
                {info.curto}
              </button>
            )
          })}
        </div>
      </div>

      {editando ? (
        <div className="mt-3">
          <label htmlFor={`resumo-${teleaula.id}`} className="sr-only">
            Resumo da {rotulo}
          </label>
          <textarea
            id={`resumo-${teleaula.id}`}
            autoFocus
            rows={6}
            maxLength={LIMITE_RESUMO}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="O que você entendeu desta aula. Isto vai para o PDF de revisão."
            className="campo resize-y"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12px] text-greyple tabular-nums">
              {texto.length} / {LIMITE_RESUMO}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setTexto(teleaula.anotacoes ?? "")
                  setEditando(false)
                }}
                disabled={salvando}
                className="btn-secundario"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => salvar(status, texto)}
                disabled={salvando}
                className="btn-primario"
              >
                {salvando && <Loader2 size={16} className="animate-spin" aria-hidden />}
                Salvar resumo
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {teleaula.anotacoes?.trim() && (
            <p
              className="mt-3 whitespace-pre-line rounded-lg border-l-2 bg-black/20 px-3 py-2 text-[13px] leading-relaxed text-fog"
              style={{ borderLeftColor: corDaMateria }}
            >
              {teleaula.anotacoes}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-fog transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <NotebookPen size={14} aria-hidden />
              {teleaula.anotacoes?.trim() ? "Editar resumo" : "Escrever resumo"}
            </button>

            {ehAdmin && (
              <button
                type="button"
                onClick={apagar}
                disabled={salvando}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-ekko-red transition-colors hover:bg-ekko-red/10 disabled:opacity-50"
              >
                <Trash2 size={14} aria-hidden />
                Excluir
              </button>
            )}

            <span className="ml-auto text-[12px]" style={{ color: tema.cor }}>
              {tema.rotulo}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
