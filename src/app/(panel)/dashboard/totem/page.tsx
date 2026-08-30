import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { TotemEditor } from "./_components/totem-editor"
import { salvarTotem } from "./_actions/salvar-totem"

export default async function TotemPage() {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  const loja = await db.loja.findUnique({
    where: { id: session.user.lojaId },
    select: {
      id: true,
      nome: true,
      nomeExibicao: true,
      logoUrl: true,
      corPrimaria: true,
      totemLayoutId: true,
      totemTitulo: true,
      totemSubtitulo: true,
      totemLayout: {
        select: {
          imagem1Url: true,
          corPrimaria: true,
        },
      },
    },
  })

  if (!loja) redirect("/login")

  const layouts = await db.layout.findMany({
    where: { lojaId: session.user.lojaId },
    orderBy: [{ padrao: "desc" }, { criadoEm: "desc" }],
    select: {
      id: true,
      nome: true,
      padrao: true,
      corPrimaria: true,
      corFundo: true,
      corTexto: true,
      corSecundaria: true,
      imagem1Url: true,
      imagem2Url: true,
      opacidadeFundo: true,
      brilho: true,
      saturacao: true,
      contraste: true,
      raioCantos: true,
      tamanhoCard: true,
      estiloCard: true,
    },
  })

  const baseUrl =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://courtesyfy.com.br"

  const totemUrl = `${baseUrl}/r/${loja.id}`

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold dash-title">Totem de Resgate</h1>
        <p className="dash-subtitle text-sm mt-0.5">
          Configure a página pública onde seus clientes resgatam os benefícios no balcão.
        </p>
      </div>

      <TotemEditor
        loja={loja}
        layouts={layouts}
        totemUrl={totemUrl}
        action={salvarTotem}
      />
    </div>
  )
}
