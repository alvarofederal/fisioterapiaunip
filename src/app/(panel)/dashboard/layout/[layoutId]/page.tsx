import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { ChevronLeft } from "lucide-react"
import { LayoutForm } from "../_components/layout-form"
import { atualizarLayout } from "../_actions/layout-actions"
import type { TamanhoCard, EstiloCard } from "../_components/card-renderer"

export default async function EditarLayoutPage({
  params,
}: {
  params: Promise<{ layoutId: string }>
}) {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  const { layoutId } = await params

  const [layout, loja] = await Promise.all([
    db.layout.findUnique({ where: { id: layoutId } }),
    db.loja.findUnique({
      where: { id: session.user.lojaId },
      select: { nomeExibicao: true, nome: true },
    }),
  ])

  if (!layout || layout.lojaId !== session.user.lojaId) notFound()

  return (
    <div>
      <Link
        href="/dashboard/layout"
        className="inline-flex items-center gap-1.5 text-sm dash-muted hover:dash-subtitle mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Layouts
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold dash-title">{layout.nome}</h1>
        <p className="dash-subtitle text-sm mt-0.5">Edite tamanho, estilo, cores e imagens do layout.</p>
      </div>

      <LayoutForm
        action={atualizarLayout}
        initial={{
          id:            layout.id,
          nome:          layout.nome,
          corPrimaria:   layout.corPrimaria,
          corFundo:      layout.corFundo      ?? "#fffdf7",
          corTexto:      layout.corTexto      ?? "#3a2510",
          corSecundaria: layout.corSecundaria ?? "#5a3e28",
          imagem1Url:    layout.imagem1Url,
          imagem2Url:    layout.imagem2Url,
          imagem3Url:    layout.imagem3Url,
          opacidadeFundo: layout.opacidadeFundo,
          brilho:        layout.brilho        ?? 100,
          saturacao:     layout.saturacao     ?? 100,
          contraste:     layout.contraste     ?? 100,
          tamanhoCard:   (layout.tamanhoCard  as TamanhoCard)  ?? "PADRAO",
          estiloCard:    (layout.estiloCard   as EstiloCard)   ?? "CLASSICO",
          raioCantos:    layout.raioCantos    ?? 8,
          padrao:        layout.padrao,
          posicaoChaveX: layout.posicaoChaveX ?? null,
          posicaoChaveY: layout.posicaoChaveY ?? null,
          escalaChave:   layout.escalaChave   ?? 1,
        }}
        nomeLoja={loja?.nomeExibicao ?? loja?.nome ?? "Sua Loja"}
      />
    </div>
  )
}
