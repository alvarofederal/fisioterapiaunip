"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { CalendarRange, Loader2 } from "lucide-react"
import { rotuloSemestre } from "@/lib/dominio"
import type { SemestreBase } from "@/lib/semestres"

export const TODOS = "todos"

/**
 * Escolhe qual semestre a listagem mostra.
 *
 * O valor vive na URL, não no estado local: assim o link é compartilhável, o
 * botão voltar funciona, e a página continua sendo Server Component — quem
 * filtra é a consulta, não o navegador escondendo cards.
 */
export function SeletorSemestre({
  semestres,
  selecionado,
  idVigente,
}: {
  semestres: SemestreBase[]
  selecionado: string
  idVigente: string | null
}) {
  const router = useRouter()
  const parametros = useSearchParams()
  const [navegando, iniciar] = useTransition()

  function escolher(valor: string) {
    const novos = new URLSearchParams(parametros.toString())

    // O vigente é o padrão da tela, então não precisa sujar a URL.
    if (valor === idVigente) novos.delete("semestre")
    else novos.set("semestre", valor)

    const busca = novos.toString()
    iniciar(() => router.push(busca ? `/painel/materias?${busca}` : "/painel/materias"))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label
        htmlFor="filtro-semestre"
        className="inline-flex items-center gap-2 text-[13px] font-medium text-greyple"
      >
        <CalendarRange size={15} aria-hidden />
        Semestre
      </label>

      <select
        id="filtro-semestre"
        value={selecionado}
        onChange={(e) => escolher(e.target.value)}
        disabled={navegando}
        className="campo w-auto min-w-[200px] py-2 text-[14px] disabled:opacity-60"
      >
        {semestres.map((s) => (
          <option key={s.id} value={s.id}>
            {rotuloSemestre(s.ano, s.periodo)}
            {s.id === idVigente ? " · em curso" : ""}
          </option>
        ))}
        <option value={TODOS}>Todos os semestres</option>
      </select>

      {navegando && <Loader2 size={15} className="animate-spin text-greyple" aria-hidden />}
    </div>
  )
}
