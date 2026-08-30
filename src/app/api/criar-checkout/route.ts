import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { stripe, STRIPE_PRICES, STRIPE_URLS, TRIAL_DAYS } from "@/lib/stripe"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.lojaId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { plano } = await req.json() as { plano: keyof typeof STRIPE_PRICES }
  const priceId = STRIPE_PRICES[plano]

  if (!priceId) {
    return NextResponse.json({ error: "Plano inválido ou não configurado" }, { status: 400 })
  }

  const loja = await db.loja.findUnique({
    where: { id: session.user.lojaId },
    select: { id: true, email: true, nome: true, stripeCustomerId: true, stripeSubscriptionId: true },
  })

  if (!loja) {
    return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 })
  }

  // Se já tem assinatura ativa, redireciona para o portal
  if (loja.stripeSubscriptionId) {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   loja.stripeCustomerId!,
      return_url: STRIPE_URLS.success,
    })
    return NextResponse.json({ url: portalSession.url })
  }

  // Garante que o customer existe no Stripe
  let customerId = loja.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email:    loja.email,
      name:     loja.nome,
      metadata: { lojaId: loja.id },
    })
    customerId = customer.id
    await db.loja.update({
      where: { id: loja.id },
      data:  { stripeCustomerId: customerId },
    })
  }

  // Cria sessão de checkout com trial
  const checkoutSession = await stripe.checkout.sessions.create({
    customer:             customerId,
    mode:                 "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: { lojaId: loja.id },
    },
    success_url: STRIPE_URLS.success,
    cancel_url:  STRIPE_URLS.cancel,
    metadata:    { lojaId: loja.id },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
