import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { PrintGrid } from "@/app/(panel)/dashboard/chaves/lote/[loteId]/imprimir/_components/print-grid"

export default async function AdminImpressaoPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ formato?: string }>
}) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard")

  const { id } = await params
  const { formato } = await searchParams
  const printFormat = formato === "mdf" ? "mdf" : "cartao"

  // Busca a solicitação para obter o loteId e lojaId
  const sol = await db.solicitacaoImpressao.findUnique({
    where: { id },
    select: { loteId: true, lojaId: true },
  })
  if (!sol) notFound()

  const lote = await db.loteChave.findUnique({
    where: { id: sol.loteId },
    include: {
      campanha: {
        select: {
          nome: true,
          tipoBeneficio: true,
          valorBeneficio: true,
          descricaoPremio: true,
          descricao: true,
          expiraEm: true,
          layout: {
            select: {
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
              posicaoChaveX: true,
              posicaoChaveY: true,
              escalaChave: true,
            },
          },
        },
      },
    },
  })

  if (!lote) notFound()

  const loja = await db.loja.findUnique({
    where: { id: sol.lojaId },
    select: { nome: true, nomeExibicao: true, logoUrl: true, corPrimaria: true },
  })
  if (!loja) notFound()

  const layoutAtivo = lote.campanha.layout

  const layoutConfig = layoutAtivo
    ? {
        corPrimaria:   layoutAtivo.corPrimaria,
        corFundo:      layoutAtivo.corFundo,
        corTexto:      layoutAtivo.corTexto,
        corSecundaria: layoutAtivo.corSecundaria,
        imagem1Url:    layoutAtivo.imagem1Url ?? null,
        imagem2Url:    layoutAtivo.imagem2Url ?? null,
        opacidadeFundo: layoutAtivo.opacidadeFundo,
        brilho:        layoutAtivo.brilho,
        saturacao:     layoutAtivo.saturacao,
        contraste:     layoutAtivo.contraste,
        raioCantos:    layoutAtivo.raioCantos,
        tamanhoCard:   layoutAtivo.tamanhoCard as string,
        estiloCard:    layoutAtivo.estiloCard  as string,
        posicaoChaveX: layoutAtivo.posicaoChaveX ?? null,
        posicaoChaveY: layoutAtivo.posicaoChaveY ?? null,
        escalaChave:   layoutAtivo.escalaChave  ?? 1,
      }
    : undefined

  const chaves = await db.chave.findMany({
    where: { loteId: sol.loteId },
    orderBy: { criadoEm: "asc" },
    select: { codigo: true, landingUrl: true },
  })

  const nomeLote = lote.descricao ?? `Lote de ${chaves.length} chaves`
  const geradoEm = new Date(lote.criadoEm).toLocaleDateString("pt-BR")

  return (
    <PrintGrid
      loteId={sol.loteId}
      chaves={chaves}
      layout={layoutConfig}
      campanha={{
        nome:           lote.campanha.nome,
        tipoBeneficio:  lote.campanha.tipoBeneficio,
        valorBeneficio: lote.campanha.valorBeneficio?.toString() ?? null,
        descricaoPremio: lote.campanha.descricaoPremio ?? null,
        descricao:      lote.campanha.descricao ?? null,
        expiraEm:       lote.campanha.expiraEm.toLocaleDateString("pt-BR"),
      }}
      loja={{
        nome:           loja.nomeExibicao ?? loja.nome,
        logoUrl:        layoutAtivo?.imagem2Url ?? loja.logoUrl ?? null,
        corPrimaria:    layoutAtivo?.corPrimaria ?? loja.corPrimaria,
        imagemFundoUrl: layoutAtivo?.imagem1Url ?? null,
        opacidadeFundo: layoutAtivo?.opacidadeFundo ?? 20,
      }}
      nomeLote={nomeLote}
      totalChaves={chaves.length}
      geradoEm={geradoEm}
      formato={printFormat}
      autoPrint={false}
    />
  )
}
