// src/lib/aulas-publicas.ts
import "server-only"

import prisma from "./prisma"
import { hojeNoBrasil } from "./datas"
import type { CorTema } from "@/generated/prisma"

export type ProximaAulaPublica = {
  data: Date
  horaInicio: string | null
  horaFim: string | null
  tema: string | null
  /** Quem ministra; cai no professor da matéria quando a aula não diz. */
  professor: string | null
  materia: { nome: string; cor: CorTema }
}

/**
 * A próxima aula presencial da turma, para a página inicial aberta.
 *
 * O `select` é a barreira, como em noticias.ts: sai a data, o horário, o tema
 * e quem ministra — o que alguém precisa para chegar na aula. O conteúdo da
 * aula não sai: a matéria dada é da turma, e fica dentro do portal.
 *
 * `hojeNoBrasil()`, e não `new Date()`, porque a aula de sábado está gravada
 * como sábado 00:00Z — sexta às 21h no Brasil. Com o agora, a aula do dia
 * sumiria da página no dia dela.
 */
export async function buscarProximaAula(): Promise<ProximaAulaPublica | null> {
  const aula = await prisma.aula.findFirst({
    where: {
      donoId: null,
      modalidade: "PRESENCIAL",
      data: { gte: hojeNoBrasil() },
    },
    orderBy: [{ data: "asc" }, { horaInicio: "asc" }],
    select: {
      data: true,
      horaInicio: true,
      horaFim: true,
      titulo: true,
      professor: true,
      materia: { select: { nome: true, cor: true, professor: true } },
    },
  })

  if (!aula) return null

  return {
    data: aula.data,
    horaInicio: aula.horaInicio,
    horaFim: aula.horaFim,
    tema: aula.titulo,
    professor: aula.professor || aula.materia.professor,
    materia: { nome: aula.materia.nome, cor: aula.materia.cor },
  }
}
