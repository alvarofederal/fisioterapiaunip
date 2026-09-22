// src/lib/sanitizar.ts
import "server-only"

import sanitizeHtml from "sanitize-html"

/**
 * Limpa o HTML do resumo antes de ele entrar no banco.
 *
 * O resumo é escrito num editor rico e depois renderizado com
 * `dangerouslySetInnerHTML` — não há como escapar o texto, senão o negrito e a
 * imagem virariam `&lt;strong&gt;`. A saída é então filtrada por allowlist:
 * só as tags e os atributos desta lista sobrevivem.
 *
 * Hoje o resumo é privado, e toda consulta o busca com `where: { usuarioId }`.
 * Isso limita o estrago a quem escreveu, mas não o elimina: basta colar de um
 * site um `<img onerror>` para executar script na própria sessão. E no dia em
 * que a turma puder compartilhar resumo, o buraco deixaria de ser privado.
 * Limpar na ENTRADA — e não só na exibição — garante que o que está gravado já
 * é seguro, inclusive para qualquer tela futura que leia esse campo.
 *
 * É `sanitize-html`, e não uma DOMPurify com jsdom: a limpeza roda no
 * servidor, e arrastar um DOM inteiro para dentro de uma função serverless
 * custa cold start a cada resumo salvo.
 */

const OPCOES: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "s", "mark",
    "h2", "h3", "h4",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "a",
    "figure", "figcaption", "img",
    "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col",
    "hr", "sub", "sup", "span", "div",
  ],

  allowedAttributes: {
    // `class` carrega o alinhamento de imagem e a marcação de tabela do editor.
    //
    // `style` entra aqui porque, sem ele na lista, o atributo é descartado
    // antes de `allowedStyles` ser consultado — e o alinhamento nunca chegaria
    // à tela. É `allowedStyles` que torna isso seguro: o atributo sobrevive,
    // mas só com as propriedades e os formatos declarados logo abaixo.
    "*": ["class", "style"],
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    td: ["colspan", "rowspan", "colwidth"],
    th: ["colspan", "rowspan", "colwidth"],
  },

  /**
   * O único `style` que sobrevive, e só nestes formatos.
   *
   * Sem isto, alinhar um parágrafo ou ajustar a largura de uma coluna não
   * aparecia na leitura: o aluno formatava e o resultado saía diferente do
   * que ele viu escrevendo. Liberar `style` inteiro também resolveria, e
   * abriria CSS arbitrário por cima da tela — um `position: fixed` cobrindo o
   * portal com o que o atacante quisesse.
   */
  allowedStyles: {
    "*": {
      "text-align": [/^(left|right|center|justify)$/],
    },
    img: {
      width: [/^\d{1,3}(\.\d+)?%$/, /^\d{1,4}px$/],
      height: [/^auto$/, /^\d{1,4}px$/],
    },
    col: {
      width: [/^\d{1,4}px$/],
      "min-width": [/^\d{1,4}px$/],
    },
  },

  // Sem isto, `javascript:` e `data:` viram vetor de execução pelo href.
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href", "src"],

  // O conteúdo destas tags é descartado junto com elas — senão o texto de um
  // <script> reapareceria como texto solto no resumo.
  nonTextTags: ["script", "style", "textarea", "option", "noscript"],

  // Link que abre em nova aba sem isto dá à outra página acesso a window.opener.
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },

  allowedSchemesByTag: {},
  disallowedTagsMode: "discard",
}

export function sanitizarHtml(html: string): string {
  return sanitizeHtml(html, OPCOES)
}
