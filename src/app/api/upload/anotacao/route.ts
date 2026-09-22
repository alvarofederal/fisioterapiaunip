export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { TAMANHO_MAXIMO_ANEXO, TIPOS_ACEITOS, formatarTamanho } from "@/lib/dominio"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})

/**
 * Imagem colada dentro do resumo de uma teleaula.
 *
 * Endpoint separado do `/api/upload` de propósito. Aquele é do ADMIN e publica
 * material para a turma; este é de QUALQUER ALUNO ATIVO, porque o resumo é
 * dele e o diagrama que ele recorta do slide só serve a ele. Relaxar o
 * endpoint de ADMIN para atender os dois casos abriria a publicação de anexo
 * de turma para a turma inteira.
 *
 * Só imagem: o resumo é texto com figura. PDF e Word continuam sendo anexo de
 * atividade, que é onde a turma procura por eles.
 */
export async function POST(req: NextRequest) {
  const sessao = await auth()
  if (!sessao?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  // O papel e o estado vêm do banco, não do token: conta desativada depois do
  // login continuaria com JWT válido por até 30 dias.
  const eu = await prisma.user.findUnique({
    where: { id: sessao.user.id },
    select: { ativo: true },
  })
  if (!eu?.ativo) {
    return NextResponse.json({ error: "Sua conta não está ativa" }, { status: 403 })
  }

  const formulario = await req.formData()
  const arquivo = formulario.get("file") as File | null

  if (!arquivo) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
  }

  if (TIPOS_ACEITOS[arquivo.type] !== "IMAGEM") {
    return NextResponse.json(
      { error: "No resumo só entra imagem (JPG, PNG, WEBP ou HEIC)." },
      { status: 400 }
    )
  }

  if (arquivo.size > TAMANHO_MAXIMO_ANEXO) {
    return NextResponse.json(
      {
        error: `Imagem muito grande (${formatarTamanho(arquivo.size)}). Máximo ${formatarTamanho(
          TAMANHO_MAXIMO_ANEXO
        )}.`,
      },
      { status: 400 }
    )
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer())
  const base64 = `data:${arquivo.type};base64,${buffer.toString("base64")}`

  try {
    const resultado = await cloudinary.uploader.upload(base64, {
      // Pasta própria: o material da turma não se mistura com a anotação
      // pessoal de ninguém, e dá para limpar um sem tocar no outro.
      folder: `fisioterapiaunip/resumos/${sessao.user.id}`,
      resource_type: "image",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    })

    // O CKEditor espera { url } ou { urls }. A URL fica embutida no HTML do
    // resumo — é por isso que o texto gravado continua pequeno mesmo com
    // várias figuras, em vez de carregar base64 para dentro do banco.
    return NextResponse.json({ url: resultado.secure_url })
  } catch (erro) {
    console.error("Falha no upload de imagem do resumo:", erro)
    return NextResponse.json({ error: "Não foi possível enviar a imagem." }, { status: 500 })
  }
}
