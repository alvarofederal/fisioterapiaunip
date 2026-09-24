import { describe, it, expect } from "vitest"
import { avisoSchema } from "@/lib/validators/aviso"

const MINIMO = {
  titulo: "Entrega dos relatórios",
  conteudo: "<p>Levar tudo no fim do semestre.</p>",
  ordem: 0,
  ativo: true,
  publico: true,
}

describe("avisoSchema", () => {
  it("aceita um aviso completo", () => {
    expect(avisoSchema.safeParse(MINIMO).success).toBe(true)
  })

  it("recusa título curto demais", () => {
    expect(avisoSchema.safeParse({ ...MINIMO, titulo: "ok" }).success).toBe(false)
  })

  it("recusa título acima de 160 caracteres", () => {
    const r = avisoSchema.safeParse({ ...MINIMO, titulo: "x".repeat(161) })
    expect(r.success).toBe(false)
  })

  it("apara espaços do título", () => {
    expect(avisoSchema.parse({ ...MINIMO, titulo: "  Recado  " }).titulo).toBe("Recado")
  })

  it("aceita ordem negativa, que é como se fixa no topo", () => {
    expect(avisoSchema.safeParse({ ...MINIMO, ordem: -10 }).success).toBe(true)
  })

  it("recusa ordem fracionada", () => {
    expect(avisoSchema.safeParse({ ...MINIMO, ordem: 1.5 }).success).toBe(false)
  })

  it("recusa ordem fora da faixa", () => {
    expect(avisoSchema.safeParse({ ...MINIMO, ordem: 1000 }).success).toBe(false)
    expect(avisoSchema.safeParse({ ...MINIMO, ordem: -1000 }).success).toBe(false)
  })

  it("exige o estado explicitamente", () => {
    // Sem isso, um formulário incompleto publicaria sem querer.
    const { ativo, ...semEstado } = MINIMO
    expect(avisoSchema.safeParse(semEstado).success).toBe(false)
  })

  it("exige a escolha de sair ou nao do portal", () => {
    // Sem campo explicito, um recado interno iria para a pagina aberta por
    // omissao — e nao ha como despublicar da cabeca de quem ja leu.
    const { publico, ...semEscolha } = MINIMO
    expect(avisoSchema.safeParse(semEscolha).success).toBe(false)
  })

  it("aceita aviso fechado, so para quem entra", () => {
    expect(avisoSchema.safeParse({ ...MINIMO, publico: false }).success).toBe(true)
  })
})
