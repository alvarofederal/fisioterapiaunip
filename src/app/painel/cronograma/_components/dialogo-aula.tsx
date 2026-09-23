"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CalendarPlus, CalendarCog } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { criarAula, atualizarAula } from "../_actions"

type MateriaOpcao = { id: string; nome: string }

export type AulaEditavel = {
  id: string
  materiaId: string
  titulo: string | null
  data: Date
  horaInicio: string | null
  horaFim: string | null
  conteudo: string | null
}

/** Date -> "2026-10-17" para o input[type=date]. Lê em UTC, como foi gravado. */
function paraInput(data: Date): string {
  return data.toISOString().slice(0, 10)
}

export function DialogoAula({
  materias,
  aula,
}: {
  materias: MateriaOpcao[]
  aula?: AulaEditavel
}) {
  const editando = Boolean(aula)
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [enviando, iniciar] = useTransition()

  const inicial = () => ({
    materiaId: aula?.materiaId ?? materias[0]?.id ?? "",
    titulo: aula?.titulo ?? "",
    data: aula ? paraInput(aula.data) : "",
    horaInicio: aula?.horaInicio ?? "",
    horaFim: aula?.horaFim ?? "",
    conteudo: aula?.conteudo ?? "",
  })

  const [dados, setDados] = useState(inicial)

  function reabrir(estado: boolean) {
    setAberto(estado)
    if (estado) setDados(inicial())
  }

  function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault()

    iniciar(async () => {
      const r = aula ? await atualizarAula(aula.id, dados) : await criarAula(dados)
      if (!r.ok) {
        toast.error(r.erro)
        return
      }
      toast.success(
        editando ? "Encontro corrigido." : "Encontro adicionado ao cronograma."
      )
      setAberto(false)
      if (!editando) setDados({ ...dados, data: "", conteudo: "" })
      router.refresh()
    })
  }

  const mudar = (chave: keyof typeof dados, valor: string) =>
    setDados((atual) => ({ ...atual, [chave]: valor }))

  return (
    <Dialog open={aberto} onOpenChange={reabrir}>
      <DialogTrigger asChild>
        {editando ? (
          <button
            type="button"
            title="Corrigir data, horário ou matéria"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-greyple transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <CalendarCog size={12} aria-hidden />
            Corrigir
          </button>
        ) : (
          <button type="button" className="btn-primario">
            <CalendarPlus size={17} aria-hidden />
            Novo encontro
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#1a1b3a] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="titulo-display text-[22px]">
            {editando ? "Corrigir encontro" : "Novo encontro"}
          </DialogTitle>
          <DialogDescription className="text-fog">
            {editando
              ? "As anotações de estudo da turma neste encontro continuam salvas."
              : "Uma data do cronograma. A turma toda vê; cada um marca o próprio estudo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={aoEnviar} className="flex flex-col gap-5" noValidate>
          <div>
            <label htmlFor={`materia-${aula?.id ?? "novo"}`} className="rotulo">
              Matéria
            </label>
            <select
              id={`materia-${aula?.id ?? "novo"}`}
              value={dados.materiaId}
              onChange={(e) => mudar("materiaId", e.target.value)}
              className="campo"
              required
            >
              {materias.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#23272a]">
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`tema-${aula?.id ?? "novo"}`} className="rotulo">
              Tema da aula
            </label>
            <input
              id={`tema-${aula?.id ?? "novo"}`}
              type="text"
              maxLength={160}
              value={dados.titulo}
              onChange={(e) => mudar("titulo", e.target.value)}
              placeholder="Ex.: Sistema Respiratório"
              className="campo"
            />
          </div>

          <div>
            <label htmlFor={`data-${aula?.id ?? "novo"}`} className="rotulo">
              Data <span className="text-ekko-red">*</span>
            </label>
            <input
              id={`data-${aula?.id ?? "novo"}`}
              type="date"
              required
              value={dados.data}
              onChange={(e) => mudar("data", e.target.value)}
              className="campo"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`inicio-${aula?.id ?? "novo"}`} className="rotulo">
                Início
              </label>
              <input
                id={`inicio-${aula?.id ?? "novo"}`}
                type="time"
                value={dados.horaInicio}
                onChange={(e) => mudar("horaInicio", e.target.value)}
                className="campo"
              />
            </div>
            <div>
              <label htmlFor={`fim-${aula?.id ?? "novo"}`} className="rotulo">
                Fim
              </label>
              <input
                id={`fim-${aula?.id ?? "novo"}`}
                type="time"
                value={dados.horaFim}
                onChange={(e) => mudar("horaFim", e.target.value)}
                className="campo"
              />
            </div>
          </div>

          <div>
            <label htmlFor={`conteudo-${aula?.id ?? "novo"}`} className="rotulo">
              O que será visto
            </label>
            <textarea
              id={`conteudo-${aula?.id ?? "novo"}`}
              maxLength={2000}
              value={dados.conteudo}
              onChange={(e) => mudar("conteudo", e.target.value)}
              placeholder="Tópicos do encontro. Dá para preencher depois."
              className="campo min-h-[90px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="rounded-xl border border-white/15 px-5 py-3 text-[15px] font-medium text-fog transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              Cancelar
            </button>
            <button type="submit" disabled={enviando} className="btn-primario">
              {enviando && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {enviando ? "Salvando..." : editando ? "Salvar correção" : "Adicionar"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
