"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { ChevronDown, Loader2, NotebookPen, CalendarDays, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { htmlTemConteudo } from "@/lib/unidades"
import { LIMITE_RESUMO } from "@/lib/validators/unidade"
import { cn } from "@/lib/utils"
import { salvarConteudoAula, excluirAula } from "../../../cronograma/_actions"

const EditorResumo = dynamic(
  () => import("./editor-resumo").then((m) => m.EditorResumo),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-[13px] text-greyple">
        Carregando o editor…
      </div>
    ),
  }
)

export type AulaDada = {
  id: string
  data: Date
  horaInicio: string | null
  horaFim: string | null
  titulo: string | null
  conteudo: string | null
}

const dataLonga = (d: Date) =>
  d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })

const dataCurta = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })

/**
 * As aulas dadas na matéria presencial.
 *
 * O conteúdo mora no mesmo campo que o Cronograma já usa — a aula é o
 * encontro, e encontro só tem um conteúdo. Editar aqui muda lá, de propósito:
 * dois registros para a mesma aula acabariam divergindo.
 */
export function AulasPresenciais({
  aulas,
  ehAdmin,
  corDaMateria,
}: {
  aulas: AulaDada[]
  ehAdmin: boolean
  corDaMateria: string
}) {
  if (aulas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-blurple/15 text-hover-blurple">
          <CalendarDays size={26} aria-hidden />
        </span>
        <h3 className="titulo-display text-[22px]">Nenhuma aula no cronograma</h3>
        <p className="max-w-[460px] text-[15px] leading-relaxed text-fog">
          As datas desta matéria vêm do Cronograma. Cadastre lá e elas aparecem aqui para receber
          a matéria dada.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {aulas.map((aula) => (
        <BlocoAula key={aula.id} aula={aula} ehAdmin={ehAdmin} corDaMateria={corDaMateria} />
      ))}
    </div>
  )
}

function BlocoAula({
  aula,
  ehAdmin,
  corDaMateria,
}: {
  aula: AulaDada
  ehAdmin: boolean
  corDaMateria: string
}) {
  const router = useRouter()
  const [salvando, iniciar] = useTransition()
  const [editando, setEditando] = useState(false)
  const [titulo, setTitulo] = useState(aula.titulo ?? "")
  const [texto, setTexto] = useState(aula.conteudo ?? "")
  const [tamanho, setTamanho] = useState(0)

  const temMateria = htmlTemConteudo(aula.conteudo)

  function apagar() {
    // O encontro leva junto o estudo de TODA a turma nele — status e
    // anotação de cada aluno. Sem o aviso, um clique apagaria trabalho de
    // nove pessoas sem elas saberem.
    const aviso = temMateria
      ? "A matéria escrita e as anotações de estudo de toda a turma neste encontro vão junto."
      : "As anotações de estudo de toda a turma neste encontro vão junto."

    const quando = dataLonga(aula.data)
    if (!confirm(`Excluir a aula de ${quando}?\n\n${aviso}\n\nNão há como desfazer.`)) return

    iniciar(async () => {
      const r = await excluirAula(aula.id)
      if (!r.ok) {
        toast.error(r.erro)
        return
      }
      toast.success("Aula excluída.")
      router.refresh()
    })
  }

  function salvar() {
    iniciar(async () => {
      const r = await salvarConteudoAula(aula.id, { titulo, conteudo: texto })
      if (!r.ok) {
        toast.error(r.erro)
        return
      }
      toast.success("Aula salva.")
      setEditando(false)
      router.refresh()
    })
  }

  return (
    <details className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] [&[open]]:border-white/20">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5 transition-colors hover:bg-white/[0.03]">
        <span
          className="grid size-12 shrink-0 place-items-center rounded-xl text-[13px] font-semibold tabular-nums"
          style={{ background: corDaMateria + "22", color: corDaMateria }}
        >
          {dataCurta(aula.data)}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="titulo-display text-[17px] leading-tight">
            {aula.titulo || <span className="text-greyple">Tema não informado</span>}
          </h3>
          <p className="mt-1 text-[13px] text-greyple">
            {dataLonga(aula.data)}
            {aula.horaInicio && ` · ${aula.horaInicio}`}
            {aula.horaFim && ` às ${aula.horaFim}`}
          </p>
        </div>

        <span className="flex shrink-0 items-center gap-3">
          {!temMateria && (
            <span className="hidden rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-greyple sm:inline">
              Sem anotação
            </span>
          )}
          <ChevronDown
            size={18}
            aria-hidden
            className="text-greyple transition-transform group-open:rotate-180"
          />
        </span>
      </summary>

      <div className="border-t border-white/[0.08] p-5">
        {editando ? (
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor={`tema-${aula.id}`} className="rotulo">
                Tema da aula
              </label>
              <input
                id={`tema-${aula.id}`}
                type="text"
                maxLength={160}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Sistema Respiratório"
                className="campo"
              />
            </div>

            <div>
              <p className="rotulo mb-2">Matéria dada</p>
              <EditorResumo valor={texto} aoMudar={setTexto} aoContar={setTamanho} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={cn(
                  "text-[12px] tabular-nums",
                  tamanho > LIMITE_RESUMO ? "text-ekko-red" : "text-greyple"
                )}
              >
                {tamanho.toLocaleString("pt-BR")} / {LIMITE_RESUMO.toLocaleString("pt-BR")}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTitulo(aula.titulo ?? "")
                    setTexto(aula.conteudo ?? "")
                    setEditando(false)
                  }}
                  disabled={salvando}
                  className="btn-secundario"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={salvar}
                  disabled={salvando || tamanho > LIMITE_RESUMO}
                  className="btn-primario"
                >
                  {salvando && <Loader2 size={16} className="animate-spin" aria-hidden />}
                  Salvar aula
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {temMateria ? (
              // O HTML já foi limpo por allowlist na gravação (src/lib/sanitizar.ts).
              <div
                className="conteudo-rico text-[15px] leading-relaxed text-fog"
                dangerouslySetInnerHTML={{ __html: aula.conteudo ?? "" }}
              />
            ) : (
              <p className="text-[14px] text-greyple">
                {ehAdmin
                  ? "Ainda não há a matéria desta aula. Escreva para a turma consultar."
                  : "O administrador ainda não publicou a matéria desta aula."}
              </p>
            )}

            {ehAdmin && (
              <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-white/[0.08] pt-3">
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-fog transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <NotebookPen size={14} aria-hidden />
                  {temMateria ? "Editar aula" : "Escrever a aula"}
                </button>

                <button
                  type="button"
                  onClick={apagar}
                  disabled={salvando}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-ekko-red transition-colors hover:bg-ekko-red/10 disabled:opacity-50"
                >
                  {salvando ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden />
                  ) : (
                    <Trash2 size={14} aria-hidden />
                  )}
                  Excluir aula
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </details>
  )
}
