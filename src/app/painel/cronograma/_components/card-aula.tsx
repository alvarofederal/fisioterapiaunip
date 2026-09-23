"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  Loader2,
  NotebookPen,
  Pencil,
  Trash2,
  Clock,
  RotateCcw,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { htmlTemConteudo as temConteudo } from "@/lib/unidades"
import { cn } from "@/lib/utils"
import { CORES_MATERIA, STATUS_ESTUDO, diasAte, textoDeProximidade } from "@/lib/dominio"
import type { CorTema, StatusEstudo } from "@/generated/prisma"
import { salvarEstudo, excluirAula } from "../_actions"
import { DialogoAula } from "./dialogo-aula"

export type AulaDoCronograma = {
  id: string
  data: Date
  modalidade: "PRESENCIAL" | "EAD"
  /** EaD registrado pelo próprio aluno — só ele vê e só ele altera. */
  ehMeu: boolean
  horaInicio: string | null
  horaFim: string | null
  /** Tema da aula — "Sistema Respiratório". */
  titulo: string | null
  conteudo: string | null
  materia: { id: string; nome: string; cor: CorTema; professor: string | null }
  meuEstudo: { status: StatusEstudo; anotacoes: string | null } | null
}

/** Um clique avança o estado. Três estados, um alvo só. */
const PROXIMO: Record<StatusEstudo, StatusEstudo> = {
  A_ESTUDAR: "ESTUDANDO",
  ESTUDANDO: "REVISADO",
  REVISADO: "A_ESTUDAR",
}

export function CardAula({
  aula,
  ehAdmin,
  destaque,
  materias = [],
  naoFeita,
}: {
  aula: AulaDoCronograma
  ehAdmin: boolean
  destaque?: boolean
  materias?: { id: string; nome: string }[]
  /** Já passou sem estudo: fica alaranjado, não esmaecido. */
  naoFeita?: boolean
}) {
  const router = useRouter()
  const [salvando, iniciar] = useTransition()

  const [status, setStatus] = useState<StatusEstudo>(aula.meuEstudo?.status ?? "A_ESTUDAR")
  const [anotacoes, setAnotacoes] = useState(aula.meuEstudo?.anotacoes ?? "")
  const [anotacoesSalvas, setAnotacoesSalvas] = useState(aula.meuEstudo?.anotacoes ?? "")
  const [anotando, setAnotando] = useState(false)

  const tema = CORES_MATERIA[aula.materia.cor]
  const info = STATUS_ESTUDO[status]
  const dias = diasAte(aula.data)
  const ehHoje = dias === 0
  const anotacoesMudaram = anotacoes !== anotacoesSalvas

  function gravar(novoStatus: StatusEstudo, novasAnotacoes: string) {
    iniciar(async () => {
      const r = await salvarEstudo(aula.id, { status: novoStatus, anotacoes: novasAnotacoes })
      if (!r.ok) {
        toast.error(r.erro)
        return
      }
      setAnotacoesSalvas(novasAnotacoes)
      router.refresh()
    })
  }

  function avancar() {
    const novo = PROXIMO[status]
    setStatus(novo)
    gravar(novo, anotacoes)
    if (novo === "REVISADO") toast.success("Revisado. Bom trabalho.")
  }

  return (
    <article
      className={cn(
        "acento-lateral relative overflow-hidden rounded-2xl border transition-colors",
        // A aula que passou sem estudo não fica esmaecida como as revisadas:
        // ela ainda pede ação, e apagar a cor seria escondê-la.
        naoFeita
          ? "border-ember-orange/35 bg-ember-orange/[0.06] hover:border-ember-orange/55"
          : destaque
            ? "border-white/25 bg-white/[0.04]"
            : "border-white/10 bg-white/[0.04] hover:border-white/20",
        status === "REVISADO" && !destaque && !naoFeita && "opacity-60"
      )}
      style={{ ["--acento" as string]: tema.base }}
    >
      <div className="flex items-start gap-3 p-4 pl-5">
        {/* O controle: um alvo, um clique, o estado escrito por extenso */}
        <button
          type="button"
          onClick={avancar}
          disabled={salvando}
          aria-label={`Andamento: ${info.rotulo}. Clique para marcar como ${STATUS_ESTUDO[PROXIMO[status]].rotulo}.`}
          title={`Marcar como "${STATUS_ESTUDO[PROXIMO[status]].rotulo}"`}
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors disabled:opacity-60"
          style={{
            borderColor: status === "A_ESTUDAR" ? "rgba(255,255,255,0.25)" : info.cor,
            background: status === "REVISADO" ? info.cor : "transparent",
          }}
        >
          {salvando ? (
            <Loader2 size={13} className="animate-spin text-fog" aria-hidden />
          ) : status === "REVISADO" ? (
            <Check size={15} strokeWidth={3} className="text-[#0e0f2d]" aria-hidden />
          ) : status === "ESTUDANDO" ? (
            <span className="size-2.5 rounded-full" style={{ background: info.cor }} />
          ) : null}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-[15px] font-semibold text-white">
              {aula.data.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                timeZone: "UTC",
              })}
            </span>

            <span
              className="inline-flex max-w-[240px] items-center truncate rounded-full border px-2 py-0.5 text-[11px] font-semibold"
              style={{ background: tema.suave, color: tema.base, borderColor: tema.borda }}
            >
              {aula.materia.nome}
            </span>

            {aula.horaInicio && (
              <span className="inline-flex items-center gap-1 text-[12px] text-greyple">
                <Clock size={11} aria-hidden />
                {aula.horaInicio}
              </span>
            )}

            <span
              className={cn(
                "text-[12px]",
                ehHoje ? "font-semibold text-spring-green" : "text-greyple"
              )}
            >
              {ehHoje ? "é hoje" : textoDeProximidade(dias)}
            </span>

            <span
              className="ml-auto text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: info.cor }}
            >
              {info.rotulo}
            </span>
          </div>

          {/* O tema da aula: é o que identifica o encontro numa lista de
              sete sábados iguais. */}
          {aula.titulo && (
            <p className="mt-1.5 text-[15px] font-medium text-white">{aula.titulo}</p>
          )}

          {/* A matéria dada no encontro.

              Só leitura aqui: o texto virou HTML do editor, e o textarea que
              existia neste lugar devolveria as tags cruas e apagaria a
              formatação no primeiro salvamento. Escrever é na tela da
              matéria, que tem o editor. */}
          {temConteudo(aula.conteudo) && (
            <div
              className="conteudo-rico mt-1.5 text-[14px] leading-relaxed text-fog"
              dangerouslySetInnerHTML={{ __html: aula.conteudo ?? "" }}
            />
          )}

          {ehAdmin && (
            <Link
              href={`/painel/materias/${aula.materia.id}`}
              className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-greyple transition-colors hover:text-white"
            >
              <NotebookPen size={12} aria-hidden />
              {temConteudo(aula.conteudo) ? "Editar a matéria dada" : "Escrever a matéria dada"}
            </Link>
          )}

          {/* Anotação pessoal — aberta só quando se quer escrever */}
          {anotando ? (
            <div className="mt-2.5">
              <textarea
                value={anotacoes}
                onChange={(e) => setAnotacoes(e.target.value)}
                onBlur={() => anotacoesMudaram && gravar(status, anotacoes)}
                maxLength={5000}
                autoFocus
                placeholder="Tópicos, dúvidas, páginas do livro..."
                className="campo min-h-[90px]"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (anotacoesMudaram) gravar(status, anotacoes)
                    setAnotando(false)
                  }}
                  disabled={salvando}
                  className="btn-primario px-3.5 py-1.5 text-[13px]"
                >
                  {salvando && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
                  Salvar nota
                </button>
                <span className="text-[12px] text-greyple">Só você vê</span>
              </div>
            </div>
          ) : (
            anotacoesSalvas && (
              <p className="mt-2 whitespace-pre-line rounded-lg border-l-2 border-vivid-cerulean/50 bg-black/20 px-3 py-2 text-[13px] leading-relaxed text-fog">
                {anotacoesSalvas}
              </p>
            )
          )}

          {/* Ações discretas, embaixo */}
          <div className="mt-2 flex items-center gap-1">
            {!anotando && (
              <button
                type="button"
                onClick={() => setAnotando(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-greyple transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <NotebookPen size={13} aria-hidden />
                {anotacoesSalvas ? "Editar nota" : "Anotar"}
              </button>
            )}

            {/* Só aparece quando há o que desfazer. Volta direto para o início,
                sem ter que clicar no círculo até dar a volta. */}
            {status !== "A_ESTUDAR" && (
              <button
                type="button"
                onClick={() => {
                  setStatus("A_ESTUDAR")
                  gravar("A_ESTUDAR", anotacoes)
                  toast.success("Progresso zerado. A anotação continua salva.")
                }}
                disabled={salvando}
                title="Voltar para 'A estudar'"
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-greyple transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
              >
                <RotateCcw size={12} aria-hidden />
                Zerar
              </button>
            )}

            {(ehAdmin || aula.ehMeu) && (
              <>

                {materias.length > 0 && (
                  <DialogoAula
                    materias={materias}
                    aula={{
                      id: aula.id,
                      materiaId: aula.materia.id,
                      titulo: aula.titulo,
                      data: aula.data,
                      horaInicio: aula.horaInicio,
                      horaFim: aula.horaFim,
                      conteudo: aula.conteudo,
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() =>
                    iniciar(async () => {
                      const r = await excluirAula(aula.id)
                      if (!r.ok) {
                        toast.error(r.erro)
                        return
                      }
                      toast.success("Encontro removido.")
                      router.refresh()
                    })
                  }
                  disabled={salvando}
                  aria-label="Excluir encontro"
                  className="ml-auto rounded-lg p-1 text-greyple transition-colors hover:bg-ekko-red/15 hover:text-ekko-red disabled:opacity-50"
                >
                  <Trash2 size={12} aria-hidden />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
