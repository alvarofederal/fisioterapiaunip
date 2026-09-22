"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"
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
import { romano } from "@/lib/unidades"
import { criarUnidade } from "../_actions"

export function DialogoUnidade({
  materiaId,
  proximoNumero,
  ehAdmin,
}: {
  materiaId: string
  proximoNumero: number
  /** ADMIN cria a unidade da turma; aluno cria a dele. */
  ehAdmin: boolean
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [enviando, iniciarEnvio] = useTransition()

  const valoresIniciais = () => ({
    numero: String(proximoNumero),
    titulo: "",
    quantidadeTeleaulas: "4",
  })

  const [dados, setDados] = useState(valoresIniciais)

  function reabrir(estado: boolean) {
    setAberto(estado)
    if (estado) setDados(valoresIniciais())
  }

  function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault()

    iniciarEnvio(async () => {
      const resultado = await criarUnidade({
        materiaId,
        numero: Number(dados.numero),
        titulo: dados.titulo,
        quantidadeTeleaulas: Number(dados.quantidadeTeleaulas),
      })

      if (!resultado.ok) {
        toast.error(resultado.erro)
        return
      }

      toast.success(`Unidade ${romano(Number(dados.numero))} criada.`)
      setAberto(false)
      router.refresh()
    })
  }

  const quantas = Number(dados.quantidadeTeleaulas)

  return (
    <Dialog open={aberto} onOpenChange={reabrir}>
      <DialogTrigger asChild>
        <button type="button" className="btn-primario">
          <Plus size={17} aria-hidden />
          Nova unidade
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#1a1b3a] sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="titulo-display text-[22px]">Nova unidade</DialogTitle>
          <DialogDescription className="text-fog">
            {ehAdmin
              ? "A estrutura é da turma toda. Cada aluno marca o próprio progresso."
              : "Esta unidade é só sua — nem o administrador vê o que você montar aqui."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={aoEnviar} className="flex flex-col gap-5" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="numero" className="rotulo">
                Número <span className="text-ekko-red">*</span>
              </label>
              <input
                id="numero"
                type="number"
                required
                min={1}
                max={20}
                value={dados.numero}
                onChange={(e) => setDados({ ...dados, numero: e.target.value })}
                className="campo"
              />
              <p className="mt-1.5 text-[12px] text-greyple">
                Aparece como Unidade {romano(Number(dados.numero) || 1)}
              </p>
            </div>

            <div>
              <label htmlFor="quantidadeTeleaulas" className="rotulo">
                Teleaulas
              </label>
              <input
                id="quantidadeTeleaulas"
                type="number"
                min={0}
                max={20}
                value={dados.quantidadeTeleaulas}
                onChange={(e) => setDados({ ...dados, quantidadeTeleaulas: e.target.value })}
                className="campo"
              />
              <p className="mt-1.5 text-[12px] text-greyple">
                {quantas > 0
                  ? `Cria Aula 1 a ${quantas} já numeradas`
                  : "Nenhuma — dá para criar depois"}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="titulo" className="rotulo">
              Título
            </label>
            <input
              id="titulo"
              type="text"
              maxLength={120}
              value={dados.titulo}
              onChange={(e) => setDados({ ...dados, titulo: e.target.value })}
              placeholder="Ex.: Bioquímica celular"
              className="campo"
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="btn-secundario"
              disabled={enviando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primario" disabled={enviando}>
              {enviando && <Loader2 size={16} className="animate-spin" aria-hidden />}
              Criar unidade
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
