import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { TRIAL_DAYS } from "@/lib/stripe"
import { CheckCircle2, Zap, AlertTriangle } from "lucide-react"
import { AssinarButton } from "./_components/assinar-button"

const FEATURES: Record<string, string[]> = {
  ESSENCIAL: [
    "1 campanha ativa",
    "Até 500 chaves/mês",
    "QR Codes básicos",
    "Dashboard de resgates",
  ],
  PROFISSIONAL: [
    "Campanhas ilimitadas",
    "Chaves ilimitadas",
    "Layout personalizado",
    "Relatórios avançados",
    "Migração de chaves",
    "Totem de resgate",
    "Suporte prioritário",
  ],
}

export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ sucesso?: string; cancelado?: string }>
}) {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  const sp = await searchParams

  const loja = await db.loja.findUnique({
    where: { id: session.user.lojaId },
    select: {
      plano: true,
      status: true,
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
    },
  })

  if (!loja) redirect("/login")

  const agora       = new Date()
  const assinaAtiva = !!loja.stripeSubscriptionId && !!loja.stripeCurrentPeriodEnd && loja.stripeCurrentPeriodEnd > agora
  const emTrial     = assinaAtiva && loja.plano === "PROFISSIONAL" && !loja.stripeSubscriptionId
  const diasRestantes = loja.stripeCurrentPeriodEnd
    ? Math.max(0, Math.ceil((loja.stripeCurrentPeriodEnd.getTime() - agora.getTime()) / 86400000))
    : null

  const precoProf = process.env.STRIPE_PLAN_PROFESSIONAL_PRICE ?? "R$ 99"

  return (
    <div className="w-full max-w-3xl mx-auto">

      <div className="mb-8">
        <h1 className="text-2xl font-bold dash-title">Plano & Assinatura</h1>
        <p className="dash-muted text-sm mt-0.5">Gerencie seu plano e cobrança.</p>
      </div>

      {/* Banners de retorno do Stripe */}
      {sp.sucesso && (
        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            Assinatura ativada com sucesso! Bem-vindo ao Profissional 🎉
          </p>
        </div>
      )}
      {sp.cancelado && (
        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            Pagamento cancelado. Você continua no plano atual.
          </p>
        </div>
      )}

      {/* Status atual */}
      {assinaAtiva && (
        <div className="dash-card p-5 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold dash-muted uppercase tracking-wide mb-1">Plano atual</p>
              <p className="text-xl font-bold dash-title">{loja.plano}</p>
              {loja.stripeCurrentPeriodEnd && (
                <p className="text-sm dash-muted mt-0.5">
                  {diasRestantes === 0
                    ? "Vence hoje"
                    : `Renova em ${diasRestantes} dia${diasRestantes !== 1 ? "s" : ""} · ${loja.stripeCurrentPeriodEnd.toLocaleDateString("pt-BR")}`}
                </p>
              )}
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              Ativo
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
            <AssinarButton plano="PROFISSIONAL" label="Gerenciar assinatura" variant="outline" />
          </div>
        </div>
      )}

      {/* Cards de planos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* ESSENCIAL */}
        <div className={`dash-card p-5 ${loja.plano === "ESSENCIAL" ? "ring-2 ring-gray-300 dark:ring-white/20" : ""}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold dash-title">Essencial</h2>
            {loja.plano === "ESSENCIAL" && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 dash-muted">Atual</span>
            )}
          </div>
          <p className="text-3xl font-black dash-title mb-1">Grátis</p>
          <p className="text-xs dash-muted mb-5">Para começar a explorar</p>
          <ul className="space-y-2.5 mb-6">
            {FEATURES.ESSENCIAL.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm dash-subtitle">
                <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <div className="h-10" /> {/* spacer para alinhar botões */}
        </div>

        {/* PROFISSIONAL */}
        <div className={`relative dash-card p-5 border-emerald-300 dark:border-emerald-500/40 ${
          loja.plano === "PROFISSIONAL" ? "ring-2 ring-emerald-400 dark:ring-emerald-500/60" : ""
        }`}>
          {/* Badge popular */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500 text-white shadow-sm">
              MAIS POPULAR
            </span>
          </div>

          <div className="flex items-center justify-between mb-3 mt-1">
            <h2 className="font-bold dash-title flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-500" />
              Profissional
            </h2>
            {loja.plano === "PROFISSIONAL" && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Atual</span>
            )}
          </div>
          <div className="flex items-end gap-1 mb-1">
            <p className="text-3xl font-black dash-title">{precoProf}</p>
            <p className="text-sm dash-muted mb-0.5">/mês</p>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-5">
            {TRIAL_DAYS} dias grátis para testar
          </p>
          <ul className="space-y-2.5 mb-6">
            {FEATURES.PROFISSIONAL.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm dash-subtitle">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {loja.plano !== "PROFISSIONAL" || !assinaAtiva ? (
            <AssinarButton
              plano="PROFISSIONAL"
              label={`Começar ${TRIAL_DAYS} dias grátis`}
              variant="primary"
            />
          ) : (
            <AssinarButton plano="PROFISSIONAL" label="Gerenciar assinatura" variant="outline" />
          )}
        </div>

      </div>

      <p className="text-center text-xs dash-muted mt-6">
        Pagamento processado com segurança pelo Stripe. Cancele quando quiser.
      </p>
    </div>
  )
}
