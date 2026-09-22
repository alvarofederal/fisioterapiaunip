"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Loader2, Paperclip, Upload, X, FileText } from "lucide-react"
import { toast } from "sonner"
import {
  ROTULO_TIPO_ANEXO,
  TAMANHO_MAXIMO_ANEXO,
  formatarTamanho,
} from "@/lib/dominio"
import type { TipoAnexo } from "@/generated/prisma"

export type AnexoEnviado = {
  nome: string
  url: string
  publicId: string
  tipo: TipoAnexo
  tamanho: number
}

const ACEITOS =
  "image/jpeg,image/png,image/webp,image/heic,application/pdf," +
  "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"

/**
 * Envia os arquivos para o Cloudinary via /api/upload e devolve os metadados.
 *
 * O upload acontece ANTES de salvar a atividade, então um arquivo enviado numa
 * edição cancelada fica órfão no Cloudinary. É o preço de mostrar a miniatura
 * na hora; a alternativa (segurar tudo em memória até salvar) estoura o limite
 * de corpo da função serverless com dois PDFs.
 */
export function CampoAnexos({
  anexos,
  aoMudar,
}: {
  anexos: AnexoEnviado[]
  aoMudar: (anexos: AnexoEnviado[]) => void
}) {
  const entrada = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviarArquivos(arquivos: FileList | null) {
    if (!arquivos || arquivos.length === 0) return

    setEnviando(true)
    const novos: AnexoEnviado[] = []

    for (const arquivo of Array.from(arquivos)) {
      if (arquivo.size > TAMANHO_MAXIMO_ANEXO) {
        toast.error(`${arquivo.name} tem ${formatarTamanho(arquivo.size)}`, {
          description: `O limite é ${formatarTamanho(TAMANHO_MAXIMO_ANEXO)} por arquivo.`,
        })
        continue
      }

      const corpo = new FormData()
      corpo.append("file", arquivo)

      try {
        const resposta = await fetch("/api/upload", { method: "POST", body: corpo })
        const dados = await resposta.json()

        if (!resposta.ok) {
          toast.error(dados.error ?? `Falha ao enviar ${arquivo.name}`)
          continue
        }
        novos.push(dados as AnexoEnviado)
      } catch {
        toast.error(`Erro de rede ao enviar ${arquivo.name}`)
      }
    }

    if (novos.length > 0) {
      aoMudar([...anexos, ...novos])
      toast.success(
        novos.length === 1 ? "Arquivo anexado." : `${novos.length} arquivos anexados.`
      )
    }

    setEnviando(false)
    if (entrada.current) entrada.current.value = ""
  }

  function remover(publicId: string) {
    aoMudar(anexos.filter((a) => a.publicId !== publicId))
  }

  return (
    <div>
      <span className="rotulo">
        Anexos <span className="font-normal text-greyple">(foto do quadro, PDF, Word, slides)</span>
      </span>

      <input
        ref={entrada}
        type="file"
        multiple
        accept={ACEITOS}
        onChange={(e) => enviarArquivos(e.target.files)}
        className="sr-only"
        id="campo-anexos"
      />

      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={enviando}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/20 px-4 py-4 text-[14px] font-medium text-fog transition-colors hover:border-white/35 hover:text-white disabled:opacity-60"
      >
        {enviando ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden />
            Enviando...
          </>
        ) : (
          <>
            <Upload size={16} aria-hidden />
            Escolher arquivos
          </>
        )}
      </button>

      <p className="mt-2 text-[12px] text-greyple">
        Até {formatarTamanho(TAMANHO_MAXIMO_ANEXO)} por arquivo — limite da Vercel para
        upload em função serverless.
      </p>

      {anexos.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {anexos.map((anexo) => (
            <li
              key={anexo.publicId}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2"
            >
              {anexo.tipo === "IMAGEM" ? (
                <Image
                  src={anexo.url}
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 shrink-0 rounded-lg object-cover"
                  unoptimized
                />
              ) : (
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-vivid-cerulean/15 text-vivid-cerulean">
                  <FileText size={18} aria-hidden />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-white">{anexo.nome}</p>
                <p className="text-[11px] text-greyple">
                  {ROTULO_TIPO_ANEXO[anexo.tipo]} · {formatarTamanho(anexo.tamanho)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => remover(anexo.publicId)}
                aria-label={`Remover ${anexo.nome}`}
                className="shrink-0 rounded-lg p-1.5 text-greyple transition-colors hover:bg-ekko-red/15 hover:text-ekko-red"
              >
                <X size={15} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {anexos.length > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-greyple">
          <Paperclip size={12} aria-hidden />
          {anexos.length} {anexos.length === 1 ? "arquivo" : "arquivos"} — a turma vai poder baixar
        </p>
      )}
    </div>
  )
}
