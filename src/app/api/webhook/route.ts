import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/prisma"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const body        = await req.text()
  const headersList = await headers()
  const signature   = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Sem assinatura Stripe" }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_SECRET_WEBHOOK_KEY
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook não configurado" }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: { type: string; data: { object: any } }
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret) as typeof event
  } catch (err) {
    console.error("[webhook] Assinatura inválida:", err)
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 })
  }

  try {
    switch (event.type) {

      // ── Checkout concluído ─────────────────────────────────────
      case "checkout.session.completed": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session = event.data.object as any
        if (session.mode !== "subscription") break

        const customerId     = session.customer     as string
        const subscriptionId = session.subscription as string

        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subData = sub as any
        const item    = subData.items?.data?.[0]

        await db.loja.update({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId:   subscriptionId,
            stripePriceId:          item?.price?.id ?? null,
            stripeCurrentPeriodEnd: subData.current_period_end
              ? new Date(subData.current_period_end * 1000)
              : null,
            plano:  resolvePlano(item?.price?.id),
            status: "ATIVA",
          },
        })
        console.log(`[webhook] checkout.session.completed — customer ${customerId}`)
        break
      }

      // ── Pagamento recorrente bem-sucedido ─────────────────────
      case "invoice.payment_succeeded": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription ?? invoice.parent?.subscription_details?.subscription
        if (!subscriptionId) break

        const sub = await stripe.subscriptions.retrieve(subscriptionId as string)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subData = sub as any

        await db.loja.updateMany({
          where: { stripeSubscriptionId: subscriptionId as string },
          data: {
            stripeCurrentPeriodEnd: subData.current_period_end
              ? new Date(subData.current_period_end * 1000)
              : null,
            status: "ATIVA",
          },
        })
        console.log("[webhook] invoice.payment_succeeded — período renovado")
        break
      }

      // ── Pagamento falhou ───────────────────────────────────────
      case "invoice.payment_failed": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription ?? invoice.parent?.subscription_details?.subscription
        if (!subscriptionId) break

        await db.loja.updateMany({
          where: { stripeSubscriptionId: subscriptionId as string },
          data: { status: "SUSPENSA" },
        })
        console.warn("[webhook] invoice.payment_failed — loja suspensa")
        break
      }

      // ── Assinatura cancelada ───────────────────────────────────
      case "customer.subscription.deleted": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any
        await db.loja.updateMany({
          where: { stripeSubscriptionId: sub.id as string },
          data: {
            stripeSubscriptionId:   null,
            stripePriceId:          null,
            stripeCurrentPeriodEnd: null,
            plano:                  "ESSENCIAL",
            status:                 "SUSPENSA",
          },
        })
        console.log("[webhook] customer.subscription.deleted")
        break
      }

      case "customer.subscription.trial_will_end": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any
        console.log(`[webhook] trial_will_end — subscription ${sub.id}`)
        // TODO: enviar email de aviso ao lojista
        break
      }
    }
  } catch (err) {
    console.error("[webhook] Erro ao processar:", event.type, err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

function resolvePlano(priceId?: string): "ESSENCIAL" | "PROFISSIONAL" | "EMPRESARIAL" {
  if (!priceId) return "ESSENCIAL"
  if (priceId === process.env.STRIPE_PLAN_PROFESSIONAL) return "PROFISSIONAL"
  if (priceId === process.env.STRIPE_PLAN_EMPRESARIAL)  return "EMPRESARIAL"
  return "ESSENCIAL"
}
