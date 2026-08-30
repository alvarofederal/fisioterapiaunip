import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { Plus, Star, Pencil, Layers } from "lucide-react"
import { ExcluirLayoutBtn } from "./_components/excluir-layout-btn"
import { LayoutMiniPreview } from "./_components/layout-mini-preview"

const TAMANHO_LABEL: Record<string, string> = {
  MINI:    "Mini 63×38 mm",
  PADRAO:  "Padrão 85×55 mm",
  COUPON:  "Cupom 95×68 mm",
  VOUCHER: "Voucher 190×68 mm",
  MEIO_A4: "Meio A4 190×138 mm",
}

const ESTILO_LABEL: Record<string, string> = {
  CLASSICO:    "Clássico",
  MODERNO:     "Moderno",
  MINIMALISTA: "Minimalista",
  GRADIENTE:   "Gradiente",
  NEON:        "Neon",
}

export default async function LayoutListPage() {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  const loja = await db.loja.findUnique({
    where: { id: session.user.lojaId },
    select: { nomeExibicao: true, nome: true },
  })

  const layouts = await db.layout.findMany({
    where: { lojaId: session.user.lojaId },
    orderBy: [{ padrao: "desc" }, { criadoEm: "desc" }],
    include: { _count: { select: { campanhas: true } } },
  })

  const nomeLoja = loja?.nomeExibicao ?? loja?.nome ?? "Sua Loja"

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold dash-title">Layouts</h1>
          <p className="dash-subtitle text-sm mt-0.5">
            Crie temas visuais e aplique nas campanhas para personalizar os cards impressos.
          </p>
        </div>
        <Link
          href="/dashboard/layout/novo"
          className="inline-flex items-center gap-2 dash-btn-primary text-sm px-4 py-2.5 rounded-xl flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo layout
        </Link>
      </div>

      {layouts.length === 0 ? (
        <div className="dash-card p-12 text-center">
          <Layers className="w-10 h-10 mx-auto mb-3 dash-muted" />
          <p className="dash-subtitle text-sm">Nenhum layout criado ainda.</p>
          <Link
            href="/dashboard/layout/novo"
            className="mt-4 inline-flex items-center gap-2 text-emerald-500 hover:text-emerald-400 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar o primeiro layout
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {layouts.map((layout) => (
            <div key={layout.id} className="dash-card p-5 flex flex-col gap-4">

              {/* Mini card preview */}
              <div className="w-full overflow-hidden rounded-xl">
                <LayoutMiniPreview
                  corPrimaria={layout.corPrimaria}
                  corFundo={layout.corFundo}
                  corTexto={layout.corTexto}
                  corSecundaria={layout.corSecundaria}
                  imagem1Url={layout.imagem1Url}
                  imagem2Url={layout.imagem2Url}
                  opacidadeFundo={layout.opacidadeFundo}
                  brilho={layout.brilho}
                  saturacao={layout.saturacao}
                  contraste={layout.contraste}
                  raioCantos={layout.raioCantos}
                  tamanhoCard={layout.tamanhoCard}
                  estiloCard={layout.estiloCard}
                  nomeLoja={nomeLoja}
                  displayWidth={320}
                />
              </div>

              {/* Name + tags */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-sm font-semibold dash-title truncate">{layout.nome}</p>
                  {layout.padrao && (
                    <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 fill-amber-400" />
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs dash-muted bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                    {TAMANHO_LABEL[layout.tamanhoCard as string] ?? layout.tamanhoCard}
                  </span>
                  <span className="text-xs dash-muted bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                    {ESTILO_LABEL[layout.estiloCard as string] ?? layout.estiloCard}
                  </span>
                </div>
              </div>

              {/* Meta */}
              <p className="text-xs dash-muted">
                {layout._count.campanhas} campanha{layout._count.campanhas !== 1 ? "s" : ""}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-white/5">
                <Link
                  href={`/dashboard/layout/${layout.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition-colors dash-subtitle hover:dash-title border border-gray-200 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-500/40"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </Link>
                <ExcluirLayoutBtn
                  layoutId={layout.id}
                  disabled={layout._count.campanhas > 0}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
