"use client"

import { useCallback, useRef, useState } from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Highlight from "@tiptap/extension-highlight"
import TextAlign from "@tiptap/extension-text-align"
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table"
import {
  Bold as IconeNegrito,
  Italic as IconeItalico,
  Underline as IconeSublinhado,
  Strikethrough as IconeTachado,
  Highlighter,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  LinkIcon,
  ImagePlus,
  Table as IconeTabela,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Undo2,
  Redo2,
  RemoveFormatting,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/**
 * Editor do resumo da teleaula.
 *
 * Tiptap, licença MIT: sem selo de marca na tela e sem licença a renovar. O
 * CKEditor que estava aqui antes obriga a exibir "Powered by CKEditor" em
 * quem usa a versão livre.
 *
 * Sendo headless, o HTML de saída é escolha nossa — e é por isso que a área
 * de edição pode receber a MESMA classe `conteudo-rico` que a tela de leitura
 * e a folha de impressão usam. O que se vê escrevendo é literalmente o que
 * vai aparecer depois, porque é a mesma folha de estilo desenhando os dois.
 */

const LIMITE_CARACTERES = 200_000

/** Envia a imagem e devolve a URL do Cloudinary, ou lança com a razão. */
async function enviarImagem(arquivo: File): Promise<string> {
  const corpo = new FormData()
  corpo.append("file", arquivo)

  const resposta = await fetch("/api/upload/anotacao", { method: "POST", body: corpo })
  const dados = await resposta.json().catch(() => ({}))

  if (!resposta.ok) throw new Error(dados?.error ?? "Não foi possível enviar a imagem.")
  return dados.url as string
}

function BotaoBarra({
  ativo,
  titulo,
  aoClicar,
  desabilitado,
  children,
}: {
  ativo?: boolean
  titulo: string
  aoClicar: () => void
  desabilitado?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      aria-pressed={ativo}
      disabled={desabilitado}
      onMouseDown={(e) => e.preventDefault()} // não rouba o foco do texto
      onClick={aoClicar}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40",
        ativo
          ? "bg-blurple/25 text-hover-blurple"
          : "text-fog hover:bg-white/[0.08] hover:text-white"
      )}
    >
      {children}
    </button>
  )
}

function Separador() {
  return <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-white/10" />
}

function BarraFerramentas({
  editor,
  aoPedirImagem,
  enviando,
}: {
  editor: Editor
  aoPedirImagem: () => void
  enviando: boolean
}) {
  const definirLink = () => {
    const atual = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Endereço do link:", atual ?? "https://")

    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-xl border border-white/10 bg-[#23272a] p-1.5">
      <BotaoBarra
        titulo="Desfazer"
        aoClicar={() => editor.chain().focus().undo().run()}
        desabilitado={!editor.can().undo()}
      >
        <Undo2 size={15} aria-hidden />
      </BotaoBarra>
      <BotaoBarra
        titulo="Refazer"
        aoClicar={() => editor.chain().focus().redo().run()}
        desabilitado={!editor.can().redo()}
      >
        <Redo2 size={15} aria-hidden />
      </BotaoBarra>

      <Separador />

      <BotaoBarra
        titulo="Título"
        ativo={editor.isActive("heading", { level: 2 })}
        aoClicar={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={15} aria-hidden />
      </BotaoBarra>
      <BotaoBarra
        titulo="Subtítulo"
        ativo={editor.isActive("heading", { level: 3 })}
        aoClicar={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 size={15} aria-hidden />
      </BotaoBarra>

      <Separador />

      <BotaoBarra
        titulo="Negrito"
        ativo={editor.isActive("bold")}
        aoClicar={() => editor.chain().focus().toggleBold().run()}
      >
        <IconeNegrito size={15} aria-hidden />
      </BotaoBarra>
      <BotaoBarra
        titulo="Itálico"
        ativo={editor.isActive("italic")}
        aoClicar={() => editor.chain().focus().toggleItalic().run()}
      >
        <IconeItalico size={15} aria-hidden />
      </BotaoBarra>
      <BotaoBarra
        titulo="Sublinhado"
        ativo={editor.isActive("underline")}
        aoClicar={() => editor.chain().focus().toggleUnderline().run()}
      >
        <IconeSublinhado size={15} aria-hidden />
      </BotaoBarra>
      <BotaoBarra
        titulo="Tachado"
        ativo={editor.isActive("strike")}
        aoClicar={() => editor.chain().focus().toggleStrike().run()}
      >
        <IconeTachado size={15} aria-hidden />
      </BotaoBarra>
      <BotaoBarra
        titulo="Marca-texto"
        ativo={editor.isActive("highlight")}
        aoClicar={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter size={15} aria-hidden />
      </BotaoBarra>

      <Separador />

      <BotaoBarra
        titulo="Lista"
        ativo={editor.isActive("bulletList")}
        aoClicar={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={15} aria-hidden />
      </BotaoBarra>
      <BotaoBarra
        titulo="Lista numerada"
        ativo={editor.isActive("orderedList")}
        aoClicar={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={15} aria-hidden />
      </BotaoBarra>
      <BotaoBarra
        titulo="Citação"
        ativo={editor.isActive("blockquote")}
        aoClicar={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={15} aria-hidden />
      </BotaoBarra>
      <BotaoBarra
        titulo="Bloco de código"
        ativo={editor.isActive("codeBlock")}
        aoClicar={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code2 size={15} aria-hidden />
      </BotaoBarra>

      <Separador />

      <BotaoBarra
        titulo="Alinhar à esquerda"
        ativo={editor.isActive({ textAlign: "left" })}
        aoClicar={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft size={15} aria-hidden />
      </BotaoBarra>
      <BotaoBarra
        titulo="Centralizar"
        ativo={editor.isActive({ textAlign: "center" })}
        aoClicar={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter size={15} aria-hidden />
      </BotaoBarra>
      <BotaoBarra
        titulo="Alinhar à direita"
        ativo={editor.isActive({ textAlign: "right" })}
        aoClicar={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight size={15} aria-hidden />
      </BotaoBarra>

      <Separador />

      <BotaoBarra titulo="Link" ativo={editor.isActive("link")} aoClicar={definirLink}>
        <LinkIcon size={15} aria-hidden />
      </BotaoBarra>
      <BotaoBarra titulo="Imagem" aoClicar={aoPedirImagem} desabilitado={enviando}>
        {enviando ? (
          <Loader2 size={15} className="animate-spin" aria-hidden />
        ) : (
          <ImagePlus size={15} aria-hidden />
        )}
      </BotaoBarra>
      <BotaoBarra
        titulo="Tabela"
        aoClicar={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        <IconeTabela size={15} aria-hidden />
      </BotaoBarra>
      <BotaoBarra
        titulo="Linha divisória"
        aoClicar={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus size={15} aria-hidden />
      </BotaoBarra>

      <Separador />

      <BotaoBarra
        titulo="Limpar formatação"
        aoClicar={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
      >
        <RemoveFormatting size={15} aria-hidden />
      </BotaoBarra>
    </div>
  )
}

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
  const [enviando, setEnviando] = useState(false)
  const entradaArquivo = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    // Sem isto o Next renderiza o editor no servidor e o HTML inicial não
    // bate com o do cliente, o que o React acusa como erro de hidratação.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } },
      }),
      Highlight,
      Image.configure({ HTMLAttributes: { class: "imagem-resumo" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: valor,
    editorProps: {
      attributes: {
        // A MESMA classe da tela de leitura: o que se vê aqui é o que sai lá.
        class: "conteudo-rico area-edicao",
        "aria-label": "Resumo da teleaula",
      },
      handlePaste(visao, evento) {
        const imagem = Array.from(evento.clipboardData?.files ?? []).find((a) =>
          a.type.startsWith("image/")
        )
        if (!imagem) return false
        evento.preventDefault()
        void subirEInserir(imagem)
        return true
      },
      handleDrop(visao, evento) {
        const arrastado = evento as DragEvent
        const imagem = Array.from(arrastado.dataTransfer?.files ?? []).find((a) =>
          a.type.startsWith("image/")
        )
        if (!imagem) return false
        evento.preventDefault()
        void subirEInserir(imagem)
        return true
      },
    },
    onUpdate({ editor }) {
      aoMudar(editor.getHTML())
      aoContar?.(editor.getText().length)
    },
  })

  const subirEInserir = useCallback(
    async (arquivo: File) => {
      if (!editor) return
      setEnviando(true)
      try {
        const url = await enviarImagem(arquivo)
        editor.chain().focus().setImage({ src: url, alt: arquivo.name }).run()
      } catch (erro) {
        // A mensagem do servidor é a útil: diz o tamanho e o limite.
        toast.error(erro instanceof Error ? erro.message : "Falha ao enviar a imagem.")
      } finally {
        setEnviando(false)
      }
    },
    [editor]
  )

  if (!editor) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-[13px] text-greyple">
        Carregando o editor…
      </div>
    )
  }

  return (
    <div className="editor-resumo">
      <BarraFerramentas
        editor={editor}
        enviando={enviando}
        aoPedirImagem={() => entradaArquivo.current?.click()}
      />

      <EditorContent editor={editor} />

      <input
        ref={entradaArquivo}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={(e) => {
          const arquivo = e.target.files?.[0]
          if (arquivo) void subirEInserir(arquivo)
          e.target.value = "" // permite reenviar o mesmo arquivo
        }}
      />

      <p className="mt-2 text-[12px] text-greyple">
        Imagem até 4 MB — clique no ícone, cole ou arraste para dentro do texto. Até{" "}
        {LIMITE_CARACTERES.toLocaleString("pt-BR")} caracteres.
      </p>
    </div>
  )
}
