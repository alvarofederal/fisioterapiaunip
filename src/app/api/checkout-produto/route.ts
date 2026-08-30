import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

// price IDs autorizados para compra pública (produtos físicos)
const ALLOWED = new Set(
  [
    process.env.STRIPE_PRICE_IMPRESSAO_KIT50,
    process.env.STRIPE_PRICE_IMPRESSAO_KIT100,
    process.env.STRIPE_PRICE_CHAVEIRO_KIT10,
    process.env.STRIPE_PRICE_CHAVEIRO_KIT100,
    process.env.STRIPE_PRICE_MDF_QUADRADO_KIT10,
    process.env.STRIPE_PRICE_MDF_QUADRADO_KIT50,
  ].filter(Boolean) as string[]
)

export async function POST(req: Request) {
  const { priceId } = await req.json() as { priceId?: string }

  if (!priceId || !ALLOWED.has(priceId)) {
    return NextResponse.json({ error: "Produto inválido" }, { status: 400 })
  }

  const appUrl = process.env.NEXTAUTH_URL ?? "https://courtesyfy.com.br"

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/?pedido=sucesso`,
      cancel_url:  `${appUrl}/#planos`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[checkout-produto]", err)
    return NextResponse.json({ error: "Erro ao criar sessão de pagamento" }, { status: 500 })
  }
}
