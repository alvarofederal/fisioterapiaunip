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
    "table", "thead", "tbody", "tr", "th", "td",
    "hr", "sub", "sup", "span", "div",
  ],

  allowedAttributes: {
    // `class` é o que o CKEditor usa para alinhar imagem e marcar tabela.
    // `style` fica de fora: abre espaço para CSS arbitrário por cima da tela.
    "*": ["class"],
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
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
