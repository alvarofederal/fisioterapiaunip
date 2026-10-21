import { describe, it, expect } from "vitest"
import { aceitaParticipacao, textoDaListaDeParticipantes } from "@/lib/atividades"
import { dataDeEncontro } from "@/lib/datas"

// Quarta, 21/10, 14h em Brasília.
const AGORA = new Date("2026-10-21T17:00:00.000Z")

const evento = {
  tipo: "EVENTO" as const,
  pedeParticipacao: true,
  arquivada: false,
  dataInicio: dataDeEncontro("2026-11-04"),
}

describe("aceitaParticipacao", () => {
  it("evento que pede confirmação, antes do dia: aceita", () => {
    expect(aceitaParticipacao(evento, AGORA)).toBe(true)
  })

  it("no próprio dia ainda aceita — inclusive à noite, quando já é o dia seguinte em UTC", () => {
    // 04/11 às 22h em Brasília = 05/11 01:00Z.
    expect(aceitaParticipacao(evento, new Date("2026-11-05T01:00:00.000Z"))).toBe(true)
  })

  it("depois do dia: encerra", () => {
    expect(aceitaParticipacao(evento, new Date("2026-11-05T12:00:00.000Z"))).toBe(false)
  })

  it("evento que não pede confirmação não tem botão", () => {
    expect(aceitaParticipacao({ ...evento, pedeParticipacao: false }, AGORA)).toBe(false)
  })

  it("só evento: trabalho, seminário e congresso não, mesmo com a marca ligada", () => {
    expect(aceitaParticipacao({ ...evento, tipo: "SEMINARIO" }, AGORA)).toBe(false)
    expect(aceitaParticipacao({ ...evento, tipo: "CONGRESSO" }, AGORA)).toBe(false)
    expect(aceitaParticipacao({ ...evento, tipo: "TRABALHO_EXTRA_CLASSE" }, AGORA)).toBe(false)
  })

  it("arquivado não aceita", () => {
    expect(aceitaParticipacao({ ...evento, arquivada: true }, AGORA)).toBe(false)
  })
})

describe("textoDaListaDeParticipantes", () => {
  const titulo = { titulo: "Evento na UNIP: banner do projeto de pesquisa", dataInicio: evento.dataInicio }

  it("monta a lista numerada, na ordem de confirmação, com o RA", () => {
    const texto = textoDaListaDeParticipantes(titulo, [
      { nome: "Ana Catarina", ra: "2632967" },
      { nome: "Matheus", ra: "2610738" },
    ])
    expect(texto).toBe(
      [
        "Evento na UNIP: banner do projeto de pesquisa — 04/11/2026",
        "2 confirmados:",
        "1. Ana Catarina — RA 2632967",
        "2. Matheus — RA 2610738",
      ].join("\n")
    )
  })

  it("singular com uma pessoa", () => {
    expect(textoDaListaDeParticipantes(titulo, [{ nome: "Matheus", ra: "2610738" }])).toContain(
      "1 confirmado:"
    )
  })

  it("sem ninguém, diz isso em vez de mandar uma lista vazia", () => {
    expect(textoDaListaDeParticipantes(titulo, [])).toBe(
      "Evento na UNIP: banner do projeto de pesquisa — 04/11/2026\nNinguém confirmou ainda."
    )
  })

  it("a data não escorrega para o dia anterior", () => {
    // Data de encontro é meia-noite UTC; formatada em Brasília viraria 03/11.
    expect(textoDaListaDeParticipantes(titulo, [])).toContain("04/11/2026")
  })
})
