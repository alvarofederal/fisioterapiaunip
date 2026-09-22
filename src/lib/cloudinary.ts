// src/lib/cloudinary.ts
import "server-only"

import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})

export { cloudinary }

/**
 * Apaga arquivos no Cloudinary.
 *
 * Nunca lança: se o arquivo remoto já sumiu, ou a API está fora do ar, a
 * exclusão da atividade no banco deve seguir mesmo assim. O pior caso é um
 * arquivo órfão no Cloudinary — bem melhor do que travar o usuário por causa
 * de um serviço externo.
 */
export async function apagarArquivos(
  itens: { publicId: string; tipo: string }[]
): Promise<void> {
  await Promise.all(
    itens.map(async ({ publicId, tipo }) => {
      try {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: tipo === "IMAGEM" ? "image" : "raw",
        })
      } catch (erro) {
        console.warn("[cloudinary] não consegui apagar", publicId, erro)
      }
    })
  )
}
