// src/lib/datas.ts

/**
 * Converte "2026-10-17" no valor que o banco guarda para uma data de encontro.
 *
 * Meia-noite UTC, não meio-dia. A coluna é `@db.Date`: o MySQL descarta a hora
 * na gravação e devolve sempre 00:00Z na leitura. Gravar meio-dia funcionava,
 * mas COMPARAR com meio-dia não — e as travas de duplicata comparam.
 * Enquanto a construção e a comparação usaram horas diferentes, a trava nunca
 * casou, e dava para criar dois encontros da mesma matéria no mesmo dia.
 *
 * Meia-noite UTC é seguro porque toda a formatação de data do portal passa
 * `timeZone: "UTC"`, e `diasAte()` compara em UTC. Sem isso, o Brasil (UTC−3)
 * mostraria o dia anterior.
 */
export function dataDeEncontro(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`)
}

/**
 * Hoje, no fuso da turma, no mesmo formato que a coluna de encontro guarda.
 *
 * `new Date()` não serve para comparar com data de encontro. A aula de sábado
 * está gravada como sábado 00:00Z, e no Brasil (UTC−3) esse instante é sexta
 * às 21h. Comparar com o agora fazia a aula do dia sumir da "próxima aula" já
 * na sexta à noite — e continuar sumida o sábado inteiro, que é justamente
 * quando a turma mais abre o portal.
 */
export function hojeNoBrasil(agora = new Date()): Date {
  // en-CA formata como AAAA-MM-DD, que é o que dataDeEncontro espera.
  const iso = agora.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })
  return dataDeEncontro(iso)
}

/**
 * Quantos dias faltam para a data de encontro, contados no fuso da turma.
 *
 * As duas pontas são meia-noite UTC, então a diferença é um número exato de
 * dias e não depende do fuso do servidor. `diasAte()` de dominio.ts lê a
 * referência pelos getters locais: acerta na Vercel, que roda em UTC, e erra
 * por um dia numa máquina configurada em horário de Brasília.
 */
export function diasAteNoBrasil(data: Date, agora = new Date()): number {
  const umDia = 24 * 60 * 60 * 1000
  return Math.round((data.getTime() - hojeNoBrasil(agora).getTime()) / umDia)
}
