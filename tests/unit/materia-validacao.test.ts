import { describe, it, expect } from "vitest"
import { materiaSchema } from "@/lib/validators/materia"

describe("materiaSchema", () => {
  it("recusa nome vazio", () => {
    expect(materiaSchema.safeParse({ nome: "" }).success).toBe(false)
  })

  it("recusa nome com menos de 2 caracteres", () => {
    expect(materiaSchema.safeParse({ nome: "A" }).success).toBe(false)
  })

  it("recusa nome acima de 80 caracteres", () => {
    expect(materiaSchema.safeParse({ nome: "x".repeat(81) }).success).toBe(false)
  })

  it("aceita nome válido", () => {
    expect(materiaSchema.safeParse({ nome: "Anatomia Humana" }).success).toBe(true)
  })

  it("apara espaços do nome", () => {
    expect(materiaSchema.parse({ nome: "  Anatomia  " }).nome).toBe("Anatomia")
  })

  it("recusa dia da semana fora do vocabulário", () => {
    const r = materiaSchema.safeParse({ nome: "Anatomia", diaSemana: "SEGUNDAFEIRA" })
    expect(r.success).toBe(false)
  })

  it("recusa cor fora do vocabulário", () => {
    expect(materiaSchema.safeParse({ nome: "Anatomia", cor: "ROSA" }).success).toBe(false)
  })

  it("recusa anotações acima de 2000 caracteres", () => {
    const r = materiaSchema.safeParse({ nome: "Anatomia", anotacoes: "x".repeat(2001) })
    expect(r.success).toBe(false)
  })

  it("aceita professor vazio — é opcional", () => {
    expect(materiaSchema.safeParse({ nome: "Anatomia", professor: "" }).success).toBe(true)
  })

  it("usa A_DEFINIR e AZUL como padrão", () => {
    const dados = materiaSchema.parse({ nome: "Anatomia" })
    expect(dados.diaSemana).toBe("A_DEFINIR")
    expect(dados.cor).toBe("AZUL")
  })
})
