"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Clock,
  NotebookPen,
  Check,
  Loader2,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  CORES_MATERIA,
  ORDEM_STATUS,
  STATUS_ESTUDO,
  diasAte,
  formatarDataCurta,
  textoDeProximidade,
} from "@/lib/dominio"
import type { CorTema, StatusEstudo } from "@/generated/prisma"
import { salvarEstudo, salvarConteudoAula, excluirAula } from "../_actions"

export type AulaDoCronograma = {
  id: string
  data: Date
  horaInicio: string | null
  horaFim: string | null
  conteudo: string | null
  materia: { id: string; nome: string; cor: CorTema; professor: string | null }
  meuEstudo: { status: StatusEstudo; anotacoes: string | null } | null
}

export function CardAula({
  aula,
  ehAdmin,
}: {
  aula: AulaDoCronograma
  ehAdmin: boolean
}) {
  const router = useRouter()
  const [salvando, iniciar] = useTransition()

  const [status, setStatus] = useState<StatusEstudo>(
    aula.meuEstudo?.status ?? "A_ESTUDAR"
  )
  const [anotacoes, setAnotacoes] = useState(aula.meuEstudo?.anotacoes ?? "")
  const [anotacoesSalvas, setAnotacoesSalvas] = useState(aula.meuEstudo?.anotacoes ?? "")
  const [aberto, setAberto] = useState(false)

  const [editandoConteudo, setEditandoConteudo] = useState(false)
  const [conteudo, setConteudo] = useState(aula.conteudo ?? "")

  const tema = CORES_MATERIA[aula.materia.cor]
  const dias = diasAte(aula.data)
  const passou = dias < 0
  const ehHoje = dias === 0
  const anotacoesMudaram = anotacoes !== anotacoesSalvas

  // Encontro que já passou e ainda não foi estudado: é o que cobra atenção.
  const atrasado = passou && status === "A_ESTUDAR"

  function gravar(novoStatus: StatusEstudo, novasAnotacoes: string) {
    iniciar(async () => {
      const resultado = await salvarEstudo(aula.id, {
        status: novoStatus,
        anotacoes: novasAnotacoes,
      })
      if (!resultado.ok) {
        toast.error(resultado.erro)
        return
      }
      setAnotacoesSalvas(novasAnotacoes)
      router.refresh()
    })
  }

  function trocarStatus(novo: StatusEstudo) {
    setStatus(novo)
    gravar(novo, anotacoes)
    if (novo === "REVISADO") toast.success("Marcado como revisado.")
  }

  function gravarConteudo() {
    iniciar(async () => {
      const resultado = await salvarConteudoAula(aula.id, conteudo)
      if (!resultado.ok) {
        toast.error(resultado.erro)
        return
      }
      setEditandoConteudo(false)
      toast.success("Conteúdo atualizado.")
      router.refresh()
    })
  }

  function apagar() {
    iniciar(async () => {
      const resultado = await excluirAula(aula.id)
      if (!resultado.ok) {
        toast.error(resultado.erro)
        return
      }
      toast.success("Encontro removido.")
      router.refresh()
    })
  }

  return (
    <article
      className={cn(
        "acento-lateral relative overflow-hidden rounded-2xl border bg-white/[0.04] transition-colors",
        atrasado ? "border-ekko-red/40" : "border-white/10 hover:border-white/20",
        passou && !atrasado && "opacity-70"
      )}
      style={{ ["--acento" as string]: tema.base }}
    >
      <div className="flex flex-wrap items-start gap-4 p-5 pl-6">
        {/* Bloco da data */}
        <div className="flex w-[74px] shrink-0 flex-col items-center rounded-xl border border-white/10 bg-black/25 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-greyple">
            {aula.data.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" })}
          </span>
          <span className="titulo-display text-[26px] leading-none">
            {aula.data.toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "UTC" })}
          </span>
          <span className="mt-0.5 text-[10px] uppercase tracking-wide text-greyple">
            {aula.data.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" })}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: tema.suave, color: tema.base, borderColor: tema.borda }}
            >
              {aula.materia.nome}
            </span>

            {(aula.horaInicio || aula.horaFim) && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-fog">
                <Clock size={12} aria-hidden />
                {aula.horaInicio}
                {aula.horaFim ? ` às ${aula.horaFim}` : ""}
              </span>
            )}

            <span
              className={cn(
                "text-[12px] font-medium",
                ehHoje ? "text-spring-green" : atrasado ? "text-ekko-red" : "text-greyple"
              )}
            >
              {ehHoje ? "é hoje" : textoDeProximidade(dias)}
            </span>
          </div>

          {/* Conteúdo do encontro — informação da turma */}
          {editandoConteudo ? (
            <div className="mb-3">
              <textarea
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                maxLength={2000}
                placeholder="O que será visto nesse encontro..."
                className="campo min-h-[80px]"
                autoFocus
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={gravarConteudo}
                  disabled={salvando}
                  className="btn-primario px-4 py-2 text-[14px]"
                >
                  {salvando && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConteudo(aula.conteudo ?? "")
                    setEditandoConteudo(false)
                  }}
                  className="rounded-xl px-4 py-2 text-[14px] font-medium text-fog hover:bg-white/[0.06] hover:text-white"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-3 flex items-start gap-2">
              <p
                className={cn(
                  "flex-1 whitespace-pre-line text-[15px] leading-relaxed",
                  aula.conteudo ? "text-white" : "italic text-greyple"
                )}
              >
                {aula.conteudo || "Conteúdo ainda não informado"}
              </p>
              {ehAdmin && (
                <button
                  type="button"
                  onClick={() => setEditandoConteudo(true)}
                  aria-label="Editar conteúdo do encontro"
                  className="shrink-0 rounded-lg p-1.5 text-greyple transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <Pencil size={13} aria-hidden />
                </button>
              )}
            </div>
          )}

          {/* Meu estudo */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Meu andamento neste encontro"
              className="flex gap-1 rounded-xl border border-white/10 bg-black/20 p-1"
            >
              {ORDEM_STATUS.map((codigo) => {
                const info = STATUS_ESTUDO[codigo]
                const escolhido = status === codigo
                return (
                  <button
                    key={codigo}
                    type="button"
                    onClick={() => trocarStatus(codigo)}
                    disabled={salvando}
                    aria-pressed={escolhido}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-60",
                      !escolhido && "text-greyple hover:bg-white/[0.06] hover:text-white"
                    )}
                    style={
                      escolhido
                        ? { background: info.suave, color: info.cor }
                        : undefined
                    }
                  >
                    {escolhido && codigo === "REVISADO" && (
                      <Check size={12} className="mr-1 inline" aria-hidden />
                    )}
                    {info.curto}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setAberto((v) => !v)}
              aria-expanded={aberto}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-fog transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <NotebookPen size={14} aria-hidden />
              {anotacoesSalvas ? "Minhas anotações" : "Anotar"}
              {anotacoesSalvas && (
                <span className="size-1.5 rounded-full bg-vivid-cerulean" aria-hidden />
              )}
              <ChevronDown
                size={14}
                className={cn("transition-transform", aberto && "rotate-180")}
                aria-hidden
              />
            </button>

            {ehAdmin && (
              <button
                type="button"
                onClick={apagar}
                disabled={salvando}
                aria-label="Excluir encontro"
                className="ml-auto rounded-lg p-1.5 text-greyple transition-colors hover:bg-ekko-red/15 hover:text-ekko-red disabled:opacity-50"
              >
                <Trash2 size={13} aria-hidden />
              </button>
            )}
          </div>

          {aberto && (
            <div className="mt-3">
              <textarea
                value={anotacoes}
                onChange={(e) => setAnotacoes(e.target.value)}
                onBlur={() => {
                  if (anotacoesMudaram) gravar(status, anotacoes)
                }}
                maxLength={5000}
                placeholder="O que você precisa revisar deste encontro: tópicos, dúvidas, páginas do livro..."
                className="campo min-h-[110px]"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="m-0 text-[12px] text-greyple">
                  {salvando
                    ? "Salvando..."
                    : anotacoesMudaram
                      ? "Sai do campo para salvar"
                      : "Só você vê estas anotações"}
                </p>
                {anotacoesMudaram && (
                  <button
                    type="button"
                    onClick={() => gravar(status, anotacoes)}
                    disabled={salvando}
                    className="btn-primario px-4 py-2 text-[13px]"
                  >
                    {salvando && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
                    Salvar anotações
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export { formatarDataCurta }
