export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { v2 as cloudinary } from "cloudinary"
import { TAMANHO_MAXIMO_ANEXO, TIPOS_ACEITOS, formatarTamanho } from "@/lib/dominio"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})

/**
 * Upload de anexo (foto do quadro, PDF de slides, documento).
 *
 * Só ADMIN envia arquivo — o aluno consome. A validação de tipo e tamanho é
 * feita aqui, no servidor: checagem no navegador é conveniência, não barreira.
 */
export async function POST(req: NextRequest) {
  const sessao = await auth()
  if (!sessao?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  if (sessao.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Apenas o administrador publica arquivos" }, { status: 403 })
  }

  const formulario = await req.formData()
  const arquivo = formulario.get("file") as File | null

  if (!arquivo) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
  }

  const tipoAnexo = TIPOS_ACEITOS[arquivo.type]
  if (!tipoAnexo) {
    return NextResponse.json(
      { error: "Formato não aceito. Envie imagem, PDF, Word ou PowerPoint." },
      { status: 400 }
    )
  }

  if (arquivo.size > TAMANHO_MAXIMO_ANEXO) {
    return NextResponse.json(
      { error: `Arquivo muito grande (${formatarTamanho(arquivo.size)}). Máximo ${formatarTamanho(TAMANHO_MAXIMO_ANEXO)}.` },
      { status: 400 }
    )
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer())
  const base64 = `data:${arquivo.type};base64,${buffer.toString("base64")}`

  // Imagens vão como "image" (ganham otimização); os demais como "raw".
  const ehImagem = tipoAnexo === "IMAGEM"

  try {
    const resultado = await cloudinary.uploader.upload(base64, {
      folder: "fisioterapiaunip/anexos",
      resource_type: ehImagem ? "image" : "raw",
      ...(ehImagem
        ? { transformation: [{ quality: "auto", fetch_format: "auto" }] }
        : {}),
    })

    return NextResponse.json({
      url: resultado.secure_url,
      publicId: resultado.public_id,
      tipo: tipoAnexo,
      nome: arquivo.name,
      tamanho: arquivo.size,
    })
  } catch (erro) {
    console.error("Falha no upload:", erro)
    return NextResponse.json({ error: "Não foi possível enviar o arquivo." }, { status: 500 })
  }
}
