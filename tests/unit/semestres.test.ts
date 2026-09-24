import { describe, it, expect } from "vitest"
import {
  ordenarSemestres,
  semestreVigente,
  podeCadastrarNoSemestre,
  motivoSemCadastro,
} from "@/lib/semestres"

const s = (id: string, ano: number, periodo: number) => ({ id, ano, periodo })

const EM_2026 = new Date("2026-09-24T12:00:00")

describe("ordenarSemestres", () => {
  it("do mais recente para o mais antigo", () => {
    const lista = [s("a", 2026, 1), s("b", 2027, 1), s("c", 2026, 2)]
    expect(ordenarSemestres(lista).map((x) => x.id)).toEqual(["b", "c", "a"])
  })

  it("não altera a lista original", () => {
    const lista = [s("a", 2026, 1), s("b", 2027, 1)]
    ordenarSemestres(lista)
    expect(lista.map((x) => x.id)).toEqual(["a", "b"])
  })
})

describe("semestreVigente", () => {
  it("escolhe o mais recente já chegado", () => {
    const lista = [s("a", 2026, 1), s("b", 2026, 2)]
    expect(semestreVigente(lista, EM_2026)?.id).toBe("b")
  })

  it("ignora semestre de ano futuro", () => {
    // O caso que isto protege: em 2026, cadastrar 2027/1 com antecedência não
    // pode tirar 2026/2 de vigente e travar o cadastro no meio do semestre.
    const lista = [s("atual", 2026, 2), s("futuro", 2027, 1)]
    expect(semestreVigente(lista, EM_2026)?.id).toBe("atual")
  })

  it("com tudo no futuro, devolve o mais próximo de chegar", () => {
    // Tela sem semestre nenhum seria pior do que apontar o que vem.
    const lista = [s("longe", 2028, 2), s("perto", 2027, 1)]
    expect(semestreVigente(lista, EM_2026)?.id).toBe("perto")
  })

  it("lista vazia devolve nulo", () => {
    expect(semestreVigente([], EM_2026)).toBeNull()
  })

  it("vira o ano e o vigente muda sozinho", () => {
    const lista = [s("a", 2026, 2), s("b", 2027, 1)]
    expect(semestreVigente(lista, EM_2026)?.id).toBe("a")
    expect(semestreVigente(lista, new Date("2027-02-01T12:00:00"))?.id).toBe("b")
  })
})

describe("podeCadastrarNoSemestre", () => {
  const vigente = s("atual", 2026, 2)

  it("libera no vigente", () => {
    expect(podeCadastrarNoSemestre("atual", vigente)).toBe(true)
  })

  it("trava no passado e no futuro", () => {
    expect(podeCadastrarNoSemestre("velho", vigente)).toBe(false)
    expect(podeCadastrarNoSemestre("futuro", vigente)).toBe(false)
  })

  it("trava quando não há semestre escolhido ou vigente", () => {
    expect(podeCadastrarNoSemestre(null, vigente)).toBe(false)
    expect(podeCadastrarNoSemestre("atual", null)).toBe(false)
  })
})

describe("motivoSemCadastro", () => {
  const vigente = s("atual", 2026, 2)

  it("não explica nada quando está liberado", () => {
    expect(motivoSemCadastro(vigente, vigente)).toBeNull()
  })

  it("diz que o semestre já passou", () => {
    const motivo = motivoSemCadastro(s("velho", 2026, 1), vigente)
    expect(motivo).toContain("2026/1")
    expect(motivo).toContain("já passou")
  })

  it("diz que o semestre ainda não começou", () => {
    const motivo = motivoSemCadastro(s("futuro", 2027, 1), vigente)
    expect(motivo).toContain("2027/1")
    expect(motivo).toContain("ainda não começou")
  })

  it("pede para cadastrar um semestre quando não há nenhum", () => {
    expect(motivoSemCadastro(null, null)).toContain("Cadastre um semestre")
  })
})
