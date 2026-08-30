import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { computeApiKey } from "@/lib/api-key"
import { ConfiguracoesForm } from "./_components/configuracoes-form"
import { TotemLinkCard } from "./_components/totem-link-card"
import { ApiKeyCard } from "./_components/api-key-card"
import { Sparkles, Settings } from "lucide-react"

const PLANO_LABELS = {
  ESSENCIAL:    { label: "Essencial",    className: "bg-white/15 text-white" },
  PROFISSIONAL: { label: "Profissional", className: "bg-blue-500/20 text-blue-300" },
  EMPRESARIAL:  { label: "Empresarial",  className: "bg-emerald-500/20 text-emerald-300" },
} as const

const PLANO_LABELS_LIGHT = {
  ESSENCIAL:    { label: "Essencial",    className: "bg-gray-100 text-gray-600" },
  PROFISSIONAL: { label: "Profissional", className: "bg-blue-50 text-blue-600" },
  EMPRESARIAL:  { label: "Empresarial",  className: "bg-emerald-50 text-emerald-700" },
} as const

export default async function ConfiguracoesPage() {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  const lojaId = session.user.lojaId!
  const apiKey = computeApiKey(lojaId)

  const loja = await db.loja.findUnique({
    where: { id: session.user.lojaId! },
    select: {
      nome: true, nomeExibicao: true, email: true, telefone: true,
      cnpjCpf: true, logradouro: true, numero: true, complemento: true,
      bairro: true, cidade: true, estado: true, cep: true,
      siteUrl: true, logoUrl: true, plano: true, status: true, criadoEm: true,
      tipoImpressao: true,
    },
  })

  if (!loja) redirect("/onboarding/loja")

  const planoDark  = PLANO_LABELS[loja.plano]
  const planoLight = PLANO_LABELS_LIGHT[loja.plano]

  return (
    <div className="w-full">

      {/* ── Hero header ── */}
      <div className="relative mb-6 rounded-3xl overflow-hidden hero-card">
        {/* Grid overlay */}
        <div aria-hidden className="absolute inset-0 pointer-events-none hero-card-grid" />
        {/* Orb */}
        <div aria-hidden className="absolute pointer-events-none hero-card-orb"
          style={{ top: "-40px", right: "8%", width: "240px", height: "240px", borderRadius: "50%" }} />

        <div className="relative z-10 px-6 py-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(16,185,129,0.18)", border: "1px solid rgba(16,185,129,0.30)" }}>
            <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                Passo 2
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full dark:hidden ${planoLight.className}`}>
                {planoLight.label}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full hidden dark:inline-flex ${planoDark.className}`}>
                {planoDark.label}
              </span>
            </div>
            <h1 className="text-xl font-extrabold hero-card-title leading-tight">Identidade Visual</h1>
            <p className="text-sm mt-0.5 hero-card-sub">
              {loja.nome} · desde {new Date(loja.criadoEm).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <Sparkles className="w-8 h-8 flex-shrink-0 text-emerald-500/60 dark:text-emerald-500/45" />
        </div>
      </div>

      {/* ── Totem Link ── */}
      <div className="mb-4">
        <TotemLinkCard lojaId={session.user.lojaId!} />
      </div>

      {/* ── Plano + Data — light-mode card ── */}
      <div className="dash-card p-4 sm:p-5 mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium dash-title">Plano atual</p>
          <p className="text-xs dash-muted mt-0.5">
            Loja criada em {new Date(loja.criadoEm).toLocaleDateString("pt-BR")}
          </p>
        </div>
        {/* Light badge */}
        <span className={`text-sm font-semibold px-3 py-1.5 rounded-full flex-shrink-0 dark:hidden ${planoLight.className}`}>
          {planoLight.label}
        </span>
        {/* Dark badge */}
        <span className={`text-sm font-semibold px-3 py-1.5 rounded-full flex-shrink-0 hidden dark:inline-flex ${planoDark.className}`}>
          {planoDark.label}
        </span>
      </div>

      {/* ── Form ── */}
      <div className="dash-card p-4 sm:p-6 mb-4">
        <ConfiguracoesForm loja={loja} tipoImpressao={loja.tipoImpressao} />
      </div>

      {/* ── API Key ── */}
      <ApiKeyCard apiKey={apiKey} />
    </div>
  )
}
