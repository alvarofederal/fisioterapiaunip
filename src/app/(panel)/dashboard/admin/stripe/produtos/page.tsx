import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { ArrowLeft, Plus, Package } from "lucide-react"
import { ProdutoCard } from "./_components/produto-card"
import NovoProdutoForm from "./_components/novo-produto-form"

export const dynamic = "force-dynamic"

export default async function ProdutosStripePage() {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard")

  // Busca produtos + preços
  const produtosStripe = await stripe.products.list({ active: true, limit: 50 })

  const produtos = await Promise.all(
    produtosStripe.data.map(async (prod) => {
      const precosResp = await stripe.prices.list({ product: prod.id, active: true, limit: 20 })
      return {
        id:          prod.id,
        name:        prod.name,
        description: prod.description ?? null,
        active:      prod.active,
        precos:      precosResp.data.map((p) => ({
          id:       p.id,
          nickname: p.nickname ?? null,
          amount:   p.unit_amount ?? 0,
          currency: p.currency,
          type:     p.type as "one_time" | "recurring",
          interval: p.recurring?.interval ?? null,
          active:   p.active,
        })),
      }
    })
  )

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm dash-muted">
        <Link href="/dashboard/admin/stripe" className="hover:text-emerald-500 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Stripe
        </Link>
        <span>/</span>
        <span className="dash-title font-medium">Produtos</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black dash-title">Produtos & Preços</h1>
          <p className="text-sm dash-muted mt-1">
            {produtos.length} produto{produtos.length !== 1 ? "s" : ""} ativo{produtos.length !== 1 ? "s" : ""} no Stripe
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs dash-muted bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-500/20">
          <Package className="w-3.5 h-3.5" />
          Preços não podem ter o valor editado — apenas o nickname
        </div>
      </div>

      {/* Lista de produtos */}
      <div className="space-y-3">
        {produtos.map(produto => (
          <ProdutoCard key={produto.id} produto={produto} />
        ))}
      </div>

      {/* Novo produto */}
      <div className="dash-card p-5">
        <h2 className="font-semibold dash-title flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-emerald-500" />
          Criar novo produto
        </h2>
        <NovoProdutoForm />
      </div>

    </div>
  )
}
