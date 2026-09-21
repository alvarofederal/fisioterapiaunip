"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CalendarPlus } from "lucide-react"
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
import { criarAula } from "../_actions"

type MateriaOpcao = { id: string; nome: string }

export function DialogoAula({ materias }: { materias: MateriaOpcao[] }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [enviando, iniciar] = useTransition()

  const [dados, setDados] = useState({
    materiaId: materias[0]?.id ?? "",
    data: "",
    horaInicio: "",
    horaFim: "",
    conteudo: "",
  })

  function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault()

    iniciar(async () => {
      const resultado = await criarAula(dados)
      if (!resultado.ok) {
        toast.error(resultado.erro)
        return
      }
      toast.success("Encontro adicionado ao cronograma.")
      setAberto(false)
      setDados({ ...dados, data: "", conteudo: "" })
      router.refresh()
    })
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <button type="button" className="btn-primario">
          <CalendarPlus size={17} aria-hidden />
          Novo encontro
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#1a1b3a] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="titulo-display text-[22px]">Novo encontro</DialogTitle>
          <DialogDescription className="text-fog">
            Uma data do cronograma. A turma toda vê; cada um marca o próprio estudo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={aoEnviar} className="flex flex-col gap-5" noValidate>
          <div>
            <label htmlFor="materiaId" className="rotulo">
              Matéria
            </label>
            <select
              id="materiaId"
              value={dados.materiaId}
              onChange={(e) => setDados({ ...dados, materiaId: e.target.value })}
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
            <label htmlFor="data" className="rotulo">
              Data <span className="text-ekko-red">*</span>
            </label>
            <input
              id="data"
              type="date"
              required
              value={dados.data}
              onChange={(e) => setDados({ ...dados, data: e.target.value })}
              className="campo"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="horaInicio" className="rotulo">
                Início
              </label>
              <input
                id="horaInicio"
                type="time"
                value={dados.horaInicio}
                onChange={(e) => setDados({ ...dados, horaInicio: e.target.value })}
                className="campo"
              />
            </div>
            <div>
              <label htmlFor="horaFim" className="rotulo">
                Fim
              </label>
              <input
                id="horaFim"
                type="time"
                value={dados.horaFim}
                onChange={(e) => setDados({ ...dados, horaFim: e.target.value })}
                className="campo"
              />
            </div>
          </div>

          <div>
            <label htmlFor="conteudo" className="rotulo">
              O que será visto
            </label>
            <textarea
              id="conteudo"
              maxLength={2000}
              value={dados.conteudo}
              onChange={(e) => setDados({ ...dados, conteudo: e.target.value })}
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
              {enviando ? "Salvando..." : "Adicionar"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
