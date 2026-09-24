"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Loader2, Plus, Pencil } from "lucide-react"
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
import { LIMITE_RESUMO } from "@/lib/validators/unidade"
import { cn } from "@/lib/utils"
import { criarAviso, atualizarAviso } from "../_actions"

const EditorResumo = dynamic(
  () => import("../../materias/[id]/_components/editor-resumo").then((m) => m.EditorResumo),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-[13px] text-greyple">
        Carregando o editor…
      </div>
    ),
  }
)

export type AvisoEditavel = {
  id: string
  titulo: string
  conteudo: string
  ordem: number
  ativo: boolean
  publico: boolean
}

export function DialogoAviso({ aviso }: { aviso?: AvisoEditavel }) {
  const editando = Boolean(aviso)
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [enviando, iniciarEnvio] = useTransition()
  const [erroCampo, setErroCampo] = useState<{ campo: string; mensagem: string } | null>(null)
  const [tamanho, setTamanho] = useState(0)

  const valoresIniciais = () => ({
    titulo: aviso?.titulo ?? "",
    conteudo: aviso?.conteudo ?? "",
    ordem: String(aviso?.ordem ?? 0),
    ativo: aviso?.ativo ?? true,
    publico: aviso?.publico ?? true,
  })

  const [dados, setDados] = useState(valoresIniciais)

  function reabrir(estado: boolean) {
    setAberto(estado)
    if (estado) {
      setErroCampo(null)
      setDados(valoresIniciais())
    }
  }

  function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault()
    setErroCampo(null)

    iniciarEnvio(async () => {
      const carga = {
        titulo: dados.titulo,
        conteudo: dados.conteudo,
        // O input devolve texto; o schema espera número.
        ordem: Number(dados.ordem) || 0,
        ativo: dados.ativo,
        publico: dados.publico,
      }

      const resultado = aviso
        ? await atualizarAviso(aviso.id, carga)
        : await criarAviso(carga)

      if (!resultado.ok) {
        if (resultado.campo) {
          setErroCampo({ campo: resultado.campo, mensagem: resultado.erro })
        } else {
          toast.error(resultado.erro)
        }
        return
      }

      toast.success(editando ? "Aviso atualizado." : "Aviso publicado.")
      setAberto(false)
      router.refresh()
    })
  }

  const erroDe = (campo: string) => (erroCampo?.campo === campo ? erroCampo.mensagem : null)

  return (
    <Dialog open={aberto} onOpenChange={reabrir}>
      <DialogTrigger asChild>
        {editando ? (
          <button
            type="button"
            aria-label={`Editar ${aviso?.titulo}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-fog transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <Pencil size={14} aria-hidden />
            Editar
          </button>
        ) : (
          <button type="button" className="btn-primario">
            <Plus size={17} aria-hidden />
            Novo aviso
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#1a1b3a] sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="titulo-display text-[22px]">
            {editando ? "Editar aviso" : "Novo aviso"}
          </DialogTitle>
          <DialogDescription className="text-fog">
            Recado fixo: fica no mural até você desligar. Não tem prazo nem vence sozinho.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={aoEnviar} className="flex flex-col gap-5" noValidate>
          <div>
            <label htmlFor="titulo-aviso" className="rotulo">
              Título <span className="text-ekko-red">*</span>
            </label>
            <input
              id="titulo-aviso"
              type="text"
              required
              autoFocus
              maxLength={160}
              value={dados.titulo}
              onChange={(e) => setDados({ ...dados, titulo: e.target.value })}
              aria-invalid={Boolean(erroDe("titulo"))}
              placeholder="Ex.: Entrega dos relatórios só no fim do semestre"
              className="campo"
            />
            {erroDe("titulo") && (
              <p className="mt-2 text-[12px] text-ekko-red">{erroDe("titulo")}</p>
            )}
          </div>

          <div>
            <p className="rotulo mb-2">
              Texto do aviso <span className="text-ekko-red">*</span>
            </p>
            <EditorResumo
              valor={dados.conteudo}
              aoMudar={(html) => setDados((d) => ({ ...d, conteudo: html }))}
              aoContar={setTamanho}
            />
            {erroDe("conteudo") && (
              <p className="mt-2 text-[12px] text-ekko-red">{erroDe("conteudo")}</p>
            )}
            <p
              className={cn(
                "mt-2 text-[12px] tabular-nums",
                tamanho > LIMITE_RESUMO ? "text-ekko-red" : "text-greyple"
              )}
            >
              {tamanho.toLocaleString("pt-BR")} / {LIMITE_RESUMO.toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ordem-aviso" className="rotulo">
                Ordem no mural
              </label>
              <input
                id="ordem-aviso"
                type="number"
                min={-999}
                max={999}
                value={dados.ordem}
                onChange={(e) => setDados({ ...dados, ordem: e.target.value })}
                className="campo"
              />
              <p className="mt-1.5 text-[12px] text-greyple">
                Menor aparece primeiro. Use um número negativo para fixar no topo.
              </p>
            </div>

            <div>
              <p className="rotulo">Estado</p>
              <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <input
                  type="checkbox"
                  checked={dados.ativo}
                  onChange={(e) => setDados({ ...dados, ativo: e.target.checked })}
                  className="size-4 accent-blurple"
                />
                <span className="text-[14px] text-fog">
                  {dados.ativo ? "Visível no mural" : "Guardado, fora do mural"}
                </span>
              </label>
            </div>
          </div>

          {/* Fora do portal qualquer pessoa lê, inclusive quem não é da turma.
              Por isso a escolha é por aviso, e não uma chave geral. */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <input
              type="checkbox"
              checked={dados.publico}
              onChange={(e) => setDados({ ...dados, publico: e.target.checked })}
              className="mt-0.5 size-4 shrink-0 accent-blurple"
            />
            <span className="min-w-0">
              <span className="block text-[14px] font-medium text-white">
                Mostrar também fora do portal
              </span>
              <span className="mt-0.5 block text-[13px] leading-relaxed text-greyple">
                {dados.publico
                  ? "Aparece na página inicial e em /avisos, para qualquer pessoa. Desmarque se o recado cita nome ou combinação interna."
                  : "Fica só para quem entra no portal."}
              </span>
            </span>
          </label>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="btn-secundario"
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primario"
              disabled={enviando || tamanho > LIMITE_RESUMO}
            >
              {enviando && <Loader2 size={16} className="animate-spin" aria-hidden />}
              {editando ? "Salvar" : "Publicar aviso"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
