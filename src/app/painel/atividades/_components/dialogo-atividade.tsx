"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
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
import { cn } from "@/lib/utils"
import { ORDEM_TIPOS_ATIVIDADE, TIPOS_ATIVIDADE } from "@/lib/dominio"
import type { TipoAtividade } from "@/generated/prisma"
import { criarAtividade, atualizarAtividade } from "../_actions"

type MateriaOpcao = { id: string; nome: string }

export type AtividadeEditavel = {
  id: string
  tipo: TipoAtividade
  titulo: string
  descricao: string | null
  materiaId: string | null
  entregaEm: Date | null
  dataInicio: Date | null
  dataFim: Date | null
  horaInicio: string | null
  horaFim: string | null
  local: string | null
  linkExterno: string | null
  cargaHoraria: number | null
  integrantes: string | null
}

/** Date -> "2026-10-17" para o input[type=date]. Lê em UTC, como foi gravado. */
function paraInput(data: Date | null): string {
  if (!data) return ""
  return data.toISOString().slice(0, 10)
}

function estadoInicial(atividade?: AtividadeEditavel) {
  return {
    tipo: atividade?.tipo ?? ("TRABALHO_EXTRA_CLASSE" as TipoAtividade),
    titulo: atividade?.titulo ?? "",
    descricao: atividade?.descricao ?? "",
    materiaId: atividade?.materiaId ?? "",
    entregaEm: paraInput(atividade?.entregaEm ?? null),
    dataInicio: paraInput(atividade?.dataInicio ?? null),
    dataFim: paraInput(atividade?.dataFim ?? null),
    horaInicio: atividade?.horaInicio ?? "",
    horaFim: atividade?.horaFim ?? "",
    local: atividade?.local ?? "",
    linkExterno: atividade?.linkExterno ?? "",
    cargaHoraria: atividade?.cargaHoraria != null ? String(atividade.cargaHoraria) : "",
    integrantes: atividade?.integrantes ?? "",
  }
}

export function DialogoAtividade({
  materias,
  atividade,
}: {
  materias: MateriaOpcao[]
  atividade?: AtividadeEditavel
}) {
  const editando = Boolean(atividade)
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [enviando, iniciar] = useTransition()
  const [erro, setErro] = useState<{ campo: string; mensagem: string } | null>(null)
  const [dados, setDados] = useState(estadoInicial(atividade))

  const campos = TIPOS_ATIVIDADE[dados.tipo].campos
  const erroDe = (campo: string) => (erro?.campo === campo ? erro.mensagem : null)
  const mudar = (chave: keyof typeof dados, valor: string) =>
    setDados((atual) => ({ ...atual, [chave]: valor }))

  function reabrir(estado: boolean) {
    setAberto(estado)
    if (estado) {
      setErro(null)
      setDados(estadoInicial(atividade))
    }
  }

  function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)

    iniciar(async () => {
      const resultado = atividade
        ? await atualizarAtividade(atividade.id, dados)
        : await criarAtividade(dados)

      if (!resultado.ok) {
        if (resultado.campo) setErro({ campo: resultado.campo, mensagem: resultado.erro })
        else toast.error(resultado.erro)
        return
      }

      toast.success(editando ? "Atividade atualizada." : "Atividade publicada.")
      setAberto(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={aberto} onOpenChange={reabrir}>
      <DialogTrigger asChild>
        {editando ? (
          <button
            type="button"
            aria-label={`Editar ${atividade?.titulo}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-fog transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <Pencil size={14} aria-hidden />
            Editar
          </button>
        ) : (
          <button type="button" className="btn-primario">
            <Plus size={17} aria-hidden />
            Nova atividade
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#1a1b3a] sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="titulo-display text-[22px]">
            {editando ? "Editar atividade" : "Nova atividade"}
          </DialogTitle>
          <DialogDescription className="text-fog">
            {TIPOS_ATIVIDADE[dados.tipo].explicacao}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={aoEnviar} className="flex flex-col gap-5" noValidate>
          {/* O tipo primeiro: é ele que decide o resto do formulário */}
          <fieldset className="m-0 border-0 p-0">
            <legend className="rotulo p-0">Tipo</legend>
            <div className="grid grid-cols-2 gap-2">
              {ORDEM_TIPOS_ATIVIDADE.map((codigo) => {
                const info = TIPOS_ATIVIDADE[codigo]
                const escolhido = dados.tipo === codigo
                return (
                  <label
                    key={codigo}
                    className={cn(
                      "cursor-pointer rounded-xl border px-3 py-2.5 transition-colors",
                      escolhido
                        ? "border-transparent"
                        : "border-white/10 bg-black/20 hover:border-white/25"
                    )}
                    style={escolhido ? { background: info.suave, borderColor: info.cor } : undefined}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={codigo}
                      checked={escolhido}
                      onChange={() => mudar("tipo", codigo)}
                      className="sr-only"
                    />
                    <span
                      className="block text-[13px] font-semibold"
                      style={{ color: escolhido ? info.cor : "#ffffff" }}
                    >
                      {info.rotulo}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="titulo" className="rotulo">
              Título <span className="text-ekko-red">*</span>
            </label>
            <input
              id="titulo"
              type="text"
              autoFocus
              required
              maxLength={120}
              value={dados.titulo}
              onChange={(e) => mudar("titulo", e.target.value)}
              aria-invalid={Boolean(erroDe("titulo"))}
              placeholder="Ex.: Relatório de anatomia do membro superior"
              className="campo"
            />
            {erroDe("titulo") && <p className="mt-2 text-[12px] text-ekko-red">{erroDe("titulo")}</p>}
          </div>

          <div>
            <label htmlFor="materiaId" className="rotulo">
              Matéria{" "}
              {campos.materiaObrigatoria ? (
                <span className="text-ekko-red">*</span>
              ) : (
                <span className="font-normal text-greyple">(opcional)</span>
              )}
            </label>
            <select
              id="materiaId"
              value={dados.materiaId}
              onChange={(e) => mudar("materiaId", e.target.value)}
              aria-invalid={Boolean(erroDe("materiaId"))}
              className="campo"
            >
              <option value="" className="bg-[#23272a]">
                {campos.materiaObrigatoria ? "Escolha a matéria" : "Sem matéria específica"}
              </option>
              {materias.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#23272a]">
                  {m.nome}
                </option>
              ))}
            </select>
            {erroDe("materiaId") && (
              <p className="mt-2 text-[12px] text-ekko-red">{erroDe("materiaId")}</p>
            )}
          </div>

          {campos.usaEntrega && (
            <div>
              <label htmlFor="entregaEm" className="rotulo">
                Prazo de entrega <span className="text-ekko-red">*</span>
              </label>
              <input
                id="entregaEm"
                type="date"
                value={dados.entregaEm}
                onChange={(e) => mudar("entregaEm", e.target.value)}
                aria-invalid={Boolean(erroDe("entregaEm"))}
                className="campo"
              />
              {erroDe("entregaEm") && (
                <p className="mt-2 text-[12px] text-ekko-red">{erroDe("entregaEm")}</p>
              )}
            </div>
          )}

          {campos.usaData && (
            <div>
              <label htmlFor="dataInicio" className="rotulo">
                Data <span className="text-ekko-red">*</span>
              </label>
              <input
                id="dataInicio"
                type="date"
                value={dados.dataInicio}
                onChange={(e) => mudar("dataInicio", e.target.value)}
                aria-invalid={Boolean(erroDe("dataInicio"))}
                className="campo"
              />
              {erroDe("dataInicio") && (
                <p className="mt-2 text-[12px] text-ekko-red">{erroDe("dataInicio")}</p>
              )}
            </div>
          )}

          {campos.usaPeriodo && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="dataInicio" className="rotulo">
                  Começa <span className="text-ekko-red">*</span>
                </label>
                <input
                  id="dataInicio"
                  type="date"
                  value={dados.dataInicio}
                  onChange={(e) => mudar("dataInicio", e.target.value)}
                  aria-invalid={Boolean(erroDe("dataInicio"))}
                  className="campo"
                />
                {erroDe("dataInicio") && (
                  <p className="mt-2 text-[12px] text-ekko-red">{erroDe("dataInicio")}</p>
                )}
              </div>
              <div>
                <label htmlFor="dataFim" className="rotulo">
                  Termina
                </label>
                <input
                  id="dataFim"
                  type="date"
                  value={dados.dataFim}
                  onChange={(e) => mudar("dataFim", e.target.value)}
                  aria-invalid={Boolean(erroDe("dataFim"))}
                  className="campo"
                />
                {erroDe("dataFim") && (
                  <p className="mt-2 text-[12px] text-ekko-red">{erroDe("dataFim")}</p>
                )}
              </div>
            </div>
          )}

          {campos.usaHorario && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="horaInicio" className="rotulo">
                  Início
                </label>
                <input
                  id="horaInicio"
                  type="time"
                  value={dados.horaInicio}
                  onChange={(e) => mudar("horaInicio", e.target.value)}
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
                  onChange={(e) => mudar("horaFim", e.target.value)}
                  aria-invalid={Boolean(erroDe("horaFim"))}
                  className="campo"
                />
                {erroDe("horaFim") && (
                  <p className="mt-2 text-[12px] text-ekko-red">{erroDe("horaFim")}</p>
                )}
              </div>
            </div>
          )}

          {campos.usaLocal && (
            <div>
              <label htmlFor="local" className="rotulo">
                Local
              </label>
              <input
                id="local"
                type="text"
                maxLength={160}
                value={dados.local}
                onChange={(e) => mudar("local", e.target.value)}
                placeholder="Sala, auditório, endereço ou plataforma"
                className="campo"
              />
            </div>
          )}

          {campos.usaIntegrantes && (
            <div>
              <label htmlFor="integrantes" className="rotulo">
                Integrantes do grupo
              </label>
              <input
                id="integrantes"
                type="text"
                maxLength={1000}
                value={dados.integrantes}
                onChange={(e) => mudar("integrantes", e.target.value)}
                placeholder="Nomes separados por vírgula. Deixe vazio se for individual."
                className="campo"
              />
            </div>
          )}

          {campos.usaCargaHoraria && (
            <div>
              <label htmlFor="cargaHoraria" className="rotulo">
                Carga horária <span className="font-normal text-greyple">(certificado)</span>
              </label>
              <input
                id="cargaHoraria"
                type="number"
                min={0}
                max={999}
                value={dados.cargaHoraria}
                onChange={(e) => mudar("cargaHoraria", e.target.value)}
                aria-invalid={Boolean(erroDe("cargaHoraria"))}
                placeholder="Ex.: 20"
                className="campo"
              />
              {erroDe("cargaHoraria") && (
                <p className="mt-2 text-[12px] text-ekko-red">{erroDe("cargaHoraria")}</p>
              )}
            </div>
          )}

          {campos.usaLink && (
            <div>
              <label htmlFor="linkExterno" className="rotulo">
                Link
              </label>
              <input
                id="linkExterno"
                type="url"
                maxLength={500}
                value={dados.linkExterno}
                onChange={(e) => mudar("linkExterno", e.target.value)}
                aria-invalid={Boolean(erroDe("linkExterno"))}
                placeholder="https://..."
                className="campo"
              />
              {erroDe("linkExterno") && (
                <p className="mt-2 text-[12px] text-ekko-red">{erroDe("linkExterno")}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="descricao" className="rotulo">
              Descrição
            </label>
            <textarea
              id="descricao"
              maxLength={3000}
              value={dados.descricao}
              onChange={(e) => mudar("descricao", e.target.value)}
              placeholder="O que a turma precisa saber para não se perder."
              className="campo min-h-[100px]"
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
              {enviando ? "Salvando..." : editando ? "Salvar alterações" : "Publicar"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
