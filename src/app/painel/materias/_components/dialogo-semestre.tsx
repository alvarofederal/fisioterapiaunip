"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CalendarRange } from "lucide-react"
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
import { rotuloSemestre } from "@/lib/dominio"
import { criarSemestre } from "../_actions"

const ANO_CORRENTE = new Date().getFullYear()

export function DialogoSemestre() {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [enviando, iniciarEnvio] = useTransition()
  const [erroCampo, setErroCampo] = useState<{ campo: string; mensagem: string } | null>(null)

  const valoresIniciais = () => ({
    ano: String(ANO_CORRENTE),
    periodo: "2",
    inicioEm: "",
    fimEm: "",
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
      const resultado = await criarSemestre({
        // Os selects devolvem texto; o schema espera número.
        ano: Number(dados.ano),
        periodo: Number(dados.periodo),
        inicioEm: dados.inicioEm,
        fimEm: dados.fimEm,
      })

      if (!resultado.ok) {
        if (resultado.campo) {
          setErroCampo({ campo: resultado.campo, mensagem: resultado.erro })
        } else {
          toast.error(resultado.erro)
        }
        return
      }

      toast.success("Semestre cadastrado.")
      setAberto(false)
      router.refresh()
    })
  }

  const erroDe = (campo: string) => (erroCampo?.campo === campo ? erroCampo.mensagem : null)

  const previa =
    Number(dados.ano) > 0
      ? rotuloSemestre(Number(dados.ano), Number(dados.periodo))
      : null

  return (
    <Dialog open={aberto} onOpenChange={reabrir}>
      <DialogTrigger asChild>
        <button type="button" className="btn-secundario">
          <CalendarRange size={16} aria-hidden />
          Novo semestre
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#1a1b3a] sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="titulo-display text-[22px]">Novo semestre</DialogTitle>
          <DialogDescription className="text-fog">
            As matérias ficam agrupadas por semestre na listagem.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={aoEnviar} className="flex flex-col gap-5" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ano" className="rotulo">
                Ano <span className="text-ekko-red">*</span>
              </label>
              <input
                id="ano"
                type="number"
                required
                min={2020}
                max={2100}
                value={dados.ano}
                onChange={(e) => setDados({ ...dados, ano: e.target.value })}
                aria-invalid={Boolean(erroDe("ano"))}
                className="campo"
              />
              {erroDe("ano") && (
                <p className="mt-2 text-[12px] text-ekko-red">{erroDe("ano")}</p>
              )}
            </div>

            <div>
              <label htmlFor="periodo" className="rotulo">
                Período <span className="text-ekko-red">*</span>
              </label>
              <select
                id="periodo"
                value={dados.periodo}
                onChange={(e) => setDados({ ...dados, periodo: e.target.value })}
                className="campo"
              >
                <option value="1">1º (primeiro)</option>
                <option value="2">2º (segundo)</option>
              </select>
            </div>
          </div>

          {previa && (
            <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] text-fog">
              Vai aparecer como <strong className="text-white">{previa}</strong>
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="inicioEm" className="rotulo">
                Começa em
              </label>
              <input
                id="inicioEm"
                type="date"
                value={dados.inicioEm}
                onChange={(e) => setDados({ ...dados, inicioEm: e.target.value })}
                className="campo"
              />
            </div>

            <div>
              <label htmlFor="fimEm" className="rotulo">
                Termina em
              </label>
              <input
                id="fimEm"
                type="date"
                value={dados.fimEm}
                onChange={(e) => setDados({ ...dados, fimEm: e.target.value })}
                aria-invalid={Boolean(erroDe("fimEm"))}
                className="campo"
              />
              {erroDe("fimEm") && (
                <p className="mt-2 text-[12px] text-ekko-red">{erroDe("fimEm")}</p>
              )}
            </div>
          </div>

          <p className="text-[12px] text-greyple">
            As datas são só informativas — nada no portal depende delas.
          </p>

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
              Cadastrar
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
