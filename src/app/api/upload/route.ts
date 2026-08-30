import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key:    process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED  = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get("file") as File | null

  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Formato inválido. Use JPG, PNG ou WEBP." }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 5 MB." }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64  = `data:${file.type};base64,${buffer.toString("base64")}`

  const result = await cloudinary.uploader.upload(base64, {
    folder:         `courtesyfy/logos/${session.user.id}`,
    resource_type:  "image",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  })

  return NextResponse.json({ imageUrl: result.secure_url })
}
