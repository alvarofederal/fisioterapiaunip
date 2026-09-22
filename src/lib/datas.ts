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
