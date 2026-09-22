// src/lib/noticias.ts
import "server-only"

import prisma from "./prisma"
import { separarAtividades } from "./atividades"
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

  // Mesma ordenação do mural de dentro: quem olha de fora e quem olha de
  // dentro têm que ver a mesma coisa na mesma ordem.
  const { aFazer, jaPassaram } = separarAtividades(noticias)

  return { proximas: aFazer, passadas: jaPassaram }
}
