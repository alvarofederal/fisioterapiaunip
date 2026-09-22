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
import { CORES_MATERIA, ORDEM_DIAS, ROTULO_DIA, rotuloSemestre } from "@/lib/dominio"
import { criarMateria, atualizarMateria } from "../_actions"
import type { CorTema, DiaSemana, Modalidade } from "@/generated/prisma"

const LIMITE_ANOTACOES = 2000

export type MateriaEditavel = {
  id: string
  nome: string
  professor: string | null
  diaSemana: DiaSemana
  anotacoes: string | null
  cor: CorTema
  modalidade: Modalidade
  semestreId: string
}

/** Vêm da página já ordenados, do mais recente para o mais antigo. */
export type SemestreOpcao = { id: string; ano: number; periodo: number }

export function DialogoMateria({
  materia,
  semestres,
}: {
  materia?: MateriaEditavel
  semestres: SemestreOpcao[]
}) {
  const editando = Boolean(materia)
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [enviando, iniciarEnvio] = useTransition()
  const [erroCampo, setErroCampo] = useState<{ campo: string; mensagem: string } | null>(null)

  // Matéria nova nasce no semestre mais recente, que é o que o ADMIN quer em
  // 99% das vezes.
  const valoresIniciais = () => ({
    nome: materia?.nome ?? "",
    professor: materia?.professor ?? "",
    diaSemana: materia?.diaSemana ?? ("A_DEFINIR" as DiaSemana),
    anotacoes: materia?.anotacoes ?? "",
    cor: materia?.cor ?? ("AZUL" as CorTema),
    modalidade: materia?.modalidade ?? ("EAD" as Modalidade),
    semestreId: materia?.semestreId ?? semestres[0]?.id ?? "",
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
      const resultado = materia
        ? await atualizarMateria(materia.id, dados)
        : await criarMateria(dados)

      if (!resultado.ok) {
        if (resultado.campo) {
          setErroCampo({ campo: resultado.campo, mensagem: resultado.erro })
        } else {
          toast.error(resultado.erro)
        }
        return
      }

      toast.success(editando ? "Matéria atualizada." : "Matéria cadastrada.")
      setAberto(false)
      router.refresh()
    })
  }

  const erroDe = (campo: string) =>
    erroCampo?.campo === campo ? erroCampo.mensagem : null

  return (
    <Dialog open={aberto} onOpenChange={reabrir}>
      <DialogTrigger asChild>
        {editando ? (
          <button
            type="button"
            aria-label={`Editar ${materia?.nome}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-fog transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <Pencil size={14} aria-hidden />
            Editar
          </button>
        ) : (
          <button type="button" className="btn-primario">
            <Plus size={17} aria-hidden />
            Nova matéria
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#1a1b3a] sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="titulo-display text-[22px]">
            {editando ? "Editar matéria" : "Nova matéria"}
          </DialogTitle>
          <DialogDescription className="text-fog">
            {editando
              ? "As alterações aparecem para a turma na hora."
              : "Só o administrador cadastra. Todo mundo vê."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={aoEnviar} className="flex flex-col gap-5" noValidate>
          <div>
            <label htmlFor="nome" className="rotulo">
              Nome da matéria <span className="text-ekko-red">*</span>
            </label>
            <input
              id="nome"
              type="text"
              autoFocus
              required
              maxLength={80}
              value={dados.nome}
              onChange={(e) => setDados({ ...dados, nome: e.target.value })}
              aria-invalid={Boolean(erroDe("nome"))}
              placeholder="Ex.: Anatomia Humana"
              className="campo"
            />
            {erroDe("nome") && (
              <p className="mt-2 text-[12px] text-ekko-red">{erroDe("nome")}</p>
            )}
          </div>

          <div>
            <label htmlFor="professor" className="rotulo">
              Professor
            </label>
            <input
              id="professor"
              type="text"
              maxLength={80}
              value={dados.professor}
              onChange={(e) => setDados({ ...dados, professor: e.target.value })}
              placeholder="Ex.: Prof.ª Helena Prado"
              className="campo"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="semestreId" className="rotulo">
                Semestre <span className="text-ekko-red">*</span>
              </label>
              <select
                id="semestreId"
                required
                value={dados.semestreId}
                onChange={(e) => setDados({ ...dados, semestreId: e.target.value })}
                aria-invalid={Boolean(erroDe("semestreId"))}
                className="campo"
              >
                {semestres.length === 0 && (
                  <option value="">Cadastre um semestre primeiro</option>
                )}
                {semestres.map((s) => (
                  <option key={s.id} value={s.id}>
                    {rotuloSemestre(s.ano, s.periodo)}
                  </option>
                ))}
              </select>
              {erroDe("semestreId") && (
                <p className="mt-2 text-[12px] text-ekko-red">{erroDe("semestreId")}</p>
              )}
            </div>

            <div>
              <label htmlFor="modalidade" className="rotulo">
                Modalidade
              </label>
              <select
                id="modalidade"
                value={dados.modalidade}
                onChange={(e) =>
                  setDados({ ...dados, modalidade: e.target.value as Modalidade })
                }
                className="campo"
              >
                <option value="EAD">EaD</option>
                <option value="PRESENCIAL">Presencial</option>
              </select>
              <p className="mt-1.5 text-[12px] text-greyple">
                EaD tem unidades e teleaulas; presencial tem encontro com data.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="diaSemana" className="rotulo">
              Dia da semana
            </label>
            <select
              id="diaSemana"
              value={dados.diaSemana}
              onChange={(e) =>
                setDados({ ...dados, diaSemana: e.target.value as DiaSemana })
              }
              className="campo"
            >
              {ORDEM_DIAS.map((dia) => (
                <option key={dia} value={dia} className="bg-[#23272a]">
                  {ROTULO_DIA[dia]}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="m-0 border-0 p-0">
            <legend className="rotulo p-0">Cor do card</legend>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(CORES_MATERIA) as CorTema[]).map((codigo) => {
                const tema = CORES_MATERIA[codigo]
                const escolhida = dados.cor === codigo
                return (
                  <label key={codigo} className="relative cursor-pointer" title={tema.rotulo}>
                    <input
                      type="radio"
                      name="cor"
                      value={codigo}
                      checked={escolhida}
                      onChange={() => setDados({ ...dados, cor: codigo })}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden
                      className="grid size-9 place-items-center rounded-full transition-transform hover:scale-110 peer-focus-visible:ring-2 peer-focus-visible:ring-white peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#1a1b3a]"
                      style={{
                        background: tema.base,
                        boxShadow: escolhida
                          ? `0 0 0 3px #1a1b3a, 0 0 0 5px ${tema.base}`
                          : "none",
                      }}
                    >
                      {escolhida && <span className="size-3 rounded-full bg-white" />}
                    </span>
                    <span className="sr-only">{tema.rotulo}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="anotacoes" className="rotulo">
              Anotações e links úteis
            </label>
            <textarea
              id="anotacoes"
              maxLength={LIMITE_ANOTACOES}
              value={dados.anotacoes}
              onChange={(e) => setDados({ ...dados, anotacoes: e.target.value })}
              placeholder="Sala, bibliografia, links de PDF, temas de prova..."
              className="campo"
            />
            <p className="mt-2 flex justify-between gap-3 text-[12px] text-greyple">
              <span>Aparece no card da matéria.</span>
              <span className="tabular-nums">
                {dados.anotacoes.length}/{LIMITE_ANOTACOES}
              </span>
            </p>
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
              {enviando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar matéria"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
