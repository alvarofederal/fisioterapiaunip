import { describe, it, expect } from "vitest"
import { materiaSchema, semestreSchema } from "@/lib/validators/materia"

/**
 * Toda matéria precisa de semestre — é ele que agrupa a listagem, e matéria
 * sem semestre não apareceria em lugar nenhum. Por isso o mínimo válido
 * carrega os dois campos, e há um caso só para a ausência dele.
 */
const MINIMO = { nome: "Anatomia Humana", semestreId: "sem_1" }

describe("materiaSchema", () => {
  it("recusa nome vazio", () => {
    expect(materiaSchema.safeParse({ ...MINIMO, nome: "" }).success).toBe(false)
  })

  it("recusa nome com menos de 2 caracteres", () => {
    expect(materiaSchema.safeParse({ ...MINIMO, nome: "A" }).success).toBe(false)
  })

  it("recusa nome acima de 80 caracteres", () => {
    expect(materiaSchema.safeParse({ ...MINIMO, nome: "x".repeat(81) }).success).toBe(false)
  })

  it("aceita nome válido", () => {
    expect(materiaSchema.safeParse(MINIMO).success).toBe(true)
  })

  it("apara espaços do nome", () => {
    expect(materiaSchema.parse({ ...MINIMO, nome: "  Anatomia  " }).nome).toBe("Anatomia")
  })

  it("recusa matéria sem semestre", () => {
    expect(materiaSchema.safeParse({ nome: "Anatomia" }).success).toBe(false)
    expect(materiaSchema.safeParse({ nome: "Anatomia", semestreId: "" }).success).toBe(false)
  })

  it("recusa dia da semana fora do vocabulário", () => {
    const r = materiaSchema.safeParse({ ...MINIMO, diaSemana: "SEGUNDAFEIRA" })
    expect(r.success).toBe(false)
  })

  it("recusa cor fora do vocabulário", () => {
    expect(materiaSchema.safeParse({ ...MINIMO, cor: "ROSA" }).success).toBe(false)
  })

  it("recusa modalidade fora do vocabulário", () => {
    expect(materiaSchema.safeParse({ ...MINIMO, modalidade: "HIBRIDO" }).success).toBe(false)
  })

  it("recusa anotações acima de 2000 caracteres", () => {
    const r = materiaSchema.safeParse({ ...MINIMO, anotacoes: "x".repeat(2001) })
    expect(r.success).toBe(false)
  })

  it("aceita professor vazio — é opcional", () => {
    expect(materiaSchema.safeParse({ ...MINIMO, professor: "" }).success).toBe(true)
  })

  it("usa A_DEFINIR, AZUL e EAD como padrão", () => {
    const dados = materiaSchema.parse(MINIMO)
    expect(dados.diaSemana).toBe("A_DEFINIR")
    expect(dados.cor).toBe("AZUL")
    expect(dados.modalidade).toBe("EAD")
  })
})

describe("semestreSchema", () => {
  it("aceita ano e período válidos", () => {
    expect(semestreSchema.safeParse({ ano: 2026, periodo: 2 }).success).toBe(true)
  })

  it("recusa período fora de 1 e 2", () => {
    expect(semestreSchema.safeParse({ ano: 2026, periodo: 3 }).success).toBe(false)
    expect(semestreSchema.safeParse({ ano: 2026, periodo: 0 }).success).toBe(false)
  })

  it("recusa ano absurdo", () => {
    expect(semestreSchema.safeParse({ ano: 1999, periodo: 1 }).success).toBe(false)
    expect(semestreSchema.safeParse({ ano: 2200, periodo: 1 }).success).toBe(false)
  })

  it("aceita semestre sem datas — elas são informativas", () => {
    const r = semestreSchema.safeParse({ ano: 2026, periodo: 2, inicioEm: "", fimEm: "" })
    expect(r.success).toBe(true)
  })

  it("recusa fim antes do início", () => {
    // Intervalo invertido passaria batido e só apareceria como data sem
    // sentido na tela.
    const r = semestreSchema.safeParse({
      ano: 2026,
      periodo: 2,
      inicioEm: "2026-12-01",
      fimEm: "2026-08-01",
    })
    expect(r.success).toBe(false)
  })

  it("aceita início e fim na ordem certa", () => {
    const r = semestreSchema.safeParse({
      ano: 2026,
      periodo: 2,
      inicioEm: "2026-08-01",
      fimEm: "2026-12-19",
    })
    expect(r.success).toBe(true)
  })
})
