"use client"

import { useMemo, useRef } from "react"
import { CKEditor } from "@ckeditor/ckeditor5-react"
import {
  ClassicEditor,
  Autoformat,
  AutoLink,
  BlockQuote,
  Bold,
  Code,
  CodeBlock,
  Essentials,
  Heading,
  Highlight,
  HorizontalLine,
  Image,
  ImageCaption,
  ImageInsert,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  Italic,
  Link,
  List,
  Paragraph,
  PasteFromOffice,
  RemoveFormat,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  TableCaption,
  TableColumnResize,
  TableToolbar,
  TextTransformation,
  Underline,
  WordCount,
  type EditorConfig,
  type FileLoader,
  type UploadAdapter,
  type UploadResponse,
} from "ckeditor5"
import "ckeditor5/ckeditor5.css"

/**
 * Sobe a imagem colada ou arrastada para o Cloudinary, pela rota do resumo.
 *
 * Sem um adaptador, o CKEditor embute a figura como base64 dentro do HTML —
 * uma foto de slide viraria centenas de KB de texto no banco, estourando a
 * coluna em poucas imagens. Com a URL, o HTML gravado continua pequeno.
 */
class AdaptadorCloudinary implements UploadAdapter {
  private controlador: AbortController | null = null

  constructor(private readonly carregador: FileLoader) {}

  async upload(): Promise<UploadResponse> {
    const arquivo = await this.carregador.file
    if (!arquivo) throw new Error("Nenhuma imagem para enviar.")

    this.controlador = new AbortController()

    const corpo = new FormData()
    corpo.append("file", arquivo)

    const resposta = await fetch("/api/upload/anotacao", {
      method: "POST",
      body: corpo,
      signal: this.controlador.signal,
    })

    const dados = await resposta.json().catch(() => ({}))

    if (!resposta.ok) {
      // A mensagem do servidor é a útil: diz o tamanho e o limite.
      throw new Error(dados?.error ?? "Não foi possível enviar a imagem.")
    }

    return { default: dados.url as string }
  }

  abort(): void {
    this.controlador?.abort()
  }
}

const LIMITE_CARACTERES = 200_000

export function EditorResumo({
  valor,
  aoMudar,
  aoContar,
}: {
  valor: string
  aoMudar: (html: string) => void
  /** Devolve o tamanho atual, para a tela avisar antes de o servidor recusar. */
  aoContar?: (caracteres: number) => void
}) {
  const aoMudarRef = useRef(aoMudar)
  aoMudarRef.current = aoMudar

  const configuracao = useMemo<EditorConfig>(
    () => ({
      // Versão livre do CKEditor 5. A partir da v44 a chave é obrigatória, e
      // "GPL" é a que libera o uso open source, sem custo e sem cadastro.
      licenseKey: "GPL",
      plugins: [
        Essentials, Paragraph, Heading, Bold, Italic, Underline, Strikethrough,
        Subscript, Superscript, Highlight, RemoveFormat, Code, CodeBlock,
        List, Indent, BlockQuote, HorizontalLine,
        Link, AutoLink, Autoformat, TextTransformation, PasteFromOffice,
        Image, ImageToolbar, ImageCaption, ImageStyle, ImageResize, ImageUpload, ImageInsert,
        Table, TableToolbar, TableColumnResize, TableCaption,
        WordCount,
      ],
      toolbar: {
        items: [
          "undo", "redo", "|",
          "heading", "|",
          "bold", "italic", "underline", "strikethrough", "highlight", "|",
          "bulletedList", "numberedList", "outdent", "indent", "|",
          "link", "insertImage", "insertTable", "blockQuote", "codeBlock", "|",
          "subscript", "superscript", "horizontalLine", "removeFormat",
        ],
        shouldNotGroupWhenFull: true,
      },
      heading: {
        options: [
          { model: "paragraph", title: "Parágrafo", class: "ck-heading_paragraph" },
          { model: "heading2", view: "h2", title: "Título", class: "ck-heading_heading2" },
          { model: "heading3", view: "h3", title: "Subtítulo", class: "ck-heading_heading3" },
          { model: "heading4", view: "h4", title: "Tópico", class: "ck-heading_heading4" },
        ],
      } as EditorConfig["heading"],
      image: {
        toolbar: [
          "imageTextAlternative", "toggleImageCaption", "|",
          "imageStyle:inline", "imageStyle:block", "imageStyle:side", "|",
          "resizeImage",
        ],
      },
      table: { contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "toggleTableCaption"] },
      link: {
        addTargetToExternalLinks: true,
        defaultProtocol: "https://",
      },
      wordCount: {
        onUpdate: (stats: { characters: number }) => aoContar?.(stats.characters),
      } as EditorConfig["wordCount"],
      placeholder:
        "O que você entendeu desta aula. Pode colar imagem do slide, montar tabela e formatar à vontade — isto vai para o PDF de revisão.",
    }),
    [aoContar]
  )

  return (
    <div className="editor-resumo">
      <CKEditor
        editor={ClassicEditor}
        config={configuracao}
        data={valor}
        onReady={(editor) => {
          editor.plugins.get("FileRepository").createUploadAdapter = (carregador: FileLoader) =>
            new AdaptadorCloudinary(carregador)
        }}
        onChange={(_evento, editor) => {
          aoMudarRef.current(editor.getData())
        }}
      />
      <p className="mt-2 text-[12px] text-greyple">
        Imagem até 4 MB, colada ou arrastada. O texto pode ter até{" "}
        {LIMITE_CARACTERES.toLocaleString("pt-BR")} caracteres.
      </p>
    </div>
  )
}
