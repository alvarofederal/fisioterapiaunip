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

const FUSO_DA_TURMA = "America/Sao_Paulo"

function horaNoBrasil(instante: Date): string {
  return instante.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSO_DA_TURMA,
  })
}

/**
 * Último login, para a lista de usuários: "há 5 min", "hoje às 14:32",
 * "ontem às 21:40", "há 3 dias", "12 de out.", "12 de out. de 2025".
 *
 * Diferente da data de encontro: `ultimoAcesso` é um instante de verdade, com
 * hora. Formatar em UTC, como se faz com as aulas, mostraria o login das 22h
 * de Brasília como "amanhã às 01:00". Aqui tudo sai no fuso da turma — e
 * "hoje" e "ontem" são dias do calendário de Brasília, não de 24 horas.
 */
export function ultimoLoginTexto(instante: Date, agora = new Date()): string {
  const minutos = Math.floor((agora.getTime() - instante.getTime()) / 60_000)
  // Relógio do servidor um pouco adiantado não pode virar "há -2 min".
  if (minutos < 1) return "agora há pouco"
  if (minutos < 60) return `há ${minutos} min`

  const dias = -diasAteNoBrasil(hojeNoBrasil(instante), agora)
  if (dias === 0) return `hoje às ${horaNoBrasil(instante)}`
  if (dias === 1) return `ontem às ${horaNoBrasil(instante)}`
  if (dias < 7) return `há ${dias} dias`

  const ano = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: FUSO_DA_TURMA }).slice(0, 4)
  return instante.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    ...(ano(instante) === ano(agora) ? {} : { year: "numeric" }),
    timeZone: FUSO_DA_TURMA,
  })
}

/** "16/10/2026 às 14:32", no fuso da turma — o texto completo para o title. */
export function dataHoraNoBrasil(instante: Date): string {
  const dia = instante.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: FUSO_DA_TURMA,
  })
  return `${dia} às ${horaNoBrasil(instante)}`
}
