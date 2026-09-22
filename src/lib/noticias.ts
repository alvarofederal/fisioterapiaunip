// src/lib/noticias.ts
import "server-only"

import prisma from "./prisma"
import { diasAte } from "./dominio"
import type { NoticiaPublica } from "@/components/card-noticia"

/**
 * Atividades para a vitrine pública.
 *
 * O `select` é a barreira de privacidade: descrição, integrantes, local e as
 * URLs dos anexos NÃO saem daqui. Filtrar isso no componente seria frágil —
 * bastaria alguém montar outra tela com o mesmo dado para vazar. Aqui os
 * campos sensíveis nem chegam a sair do banco.
 */
export async function buscarNoticias(limite = 40): Promise<{
  proximas: NoticiaPublica[]
  passadas: NoticiaPublica[]
}> {
  const atividades = await prisma.atividade.findMany({
    where: { arquivada: false },
    select: {
      id: true,
      tipo: true,
      titulo: true,
      entregaEm: true,
      dataInicio: true,
      dataFim: true,
      horaInicio: true,
      criadoEm: true,
      materia: { select: { nome: true, cor: true } },
      _count: { select: { anexos: true } },
    },
    take: limite,
  })

  const noticias: (NoticiaPublica & { criadoEm: Date })[] = atividades.map((a) => ({
    id: a.id,
    tipo: a.tipo,
    titulo: a.titulo,
    entregaEm: a.entregaEm,
    dataInicio: a.dataInicio,
    dataFim: a.dataFim,
    horaInicio: a.horaInicio,
    qtdAnexos: a._count.anexos,
    materia: a.materia,
    criadoEm: a.criadoEm,
  }))

  const dataDe = (n: NoticiaPublica) => n.entregaEm ?? n.dataInicio

  // Sem data nenhuma conta como "próxima": é aviso em aberto, não coisa vencida.
  const proximas = noticias
    .filter((n) => {
      const d = dataDe(n)
      return d === null || diasAte(d) >= 0
    })
    .sort((a, b) => {
      const da = dataDe(a)
      const db = dataDe(b)
      if (!da && !db) return b.criadoEm.getTime() - a.criadoEm.getTime()
      if (!da) return 1
      if (!db) return -1
      return da.getTime() - db.getTime()
    })

  const passadas = noticias
    .filter((n) => {
      const d = dataDe(n)
      return d !== null && diasAte(d) < 0
    })
    .sort((a, b) => dataDe(b)!.getTime() - dataDe(a)!.getTime())

  return { proximas, passadas }
}
