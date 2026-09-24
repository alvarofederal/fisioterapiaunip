// src/lib/avisos.ts
import "server-only"

import prisma from "./prisma"

export type AvisoPublico = {
  id: string
  titulo: string
  conteudo: string
}

/**
 * Avisos da vitrine aberta, em /avisos e no topo da página inicial.
 *
 * As duas condições do `where` são a barreira: `ativo` é o que está no mural,
 * `publico` é o que pode sair do portal. Um recado interno — que cita nome de
 * pessoa ou combinação da turma — fica com `publico: false` e nem chega a ser
 * lido do banco aqui.
 *
 * O `select` também é barreira: quem escreveu e quando não saem. Fora do
 * portal ninguém precisa saber quem é o representante nem quando ele mexeu.
 */
export async function buscarAvisosPublicos(limite = 20): Promise<AvisoPublico[]> {
  return prisma.aviso.findMany({
    where: { ativo: true, publico: true },
    orderBy: [{ ordem: "asc" }, { criadoEm: "desc" }],
    select: { id: true, titulo: true, conteudo: true },
    take: limite,
  })
}
