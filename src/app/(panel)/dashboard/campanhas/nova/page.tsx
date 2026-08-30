import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { ChevronLeft } from "lucide-react"
import { CampanhaForm } from "../_components/campanha-form"
import { criarCampanha } from "../_actions/criar-campanha"

export default async function NovaCampanhaPage() {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  const [loja, totalCampanhas, layouts] = await Promise.all([
    db.loja.findUnique({
      where: { id: session.user.lojaId! },
      select: { plano: true },
    }),
    db.campanha.count({
      where: { lojaId: session.user.lojaId!, status: { not: "CANCELADA" } },
    }),
    db.layout.findMany({
      where: { lojaId: session.user.lojaId! },
      select: { id: true, nome: true, corPrimaria: true, padrao: true },
      orderBy: [{ padrao: "desc" }, { nome: "asc" }],
    }),
  ])

  const limiteBloqueado = loja?.plano === "ESSENCIAL" && totalCampanhas >= 3

  return (
    <div className="w-full">
      {/* Breadcrumb */}
      <Link
        href="/dashboard/campanhas"
        className="inline-flex items-center gap-1.5 text-sm dash-muted hover:text-emerald-500 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Campanhas
      </Link>

      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Nova campanha</h1>
        <p className="dash-subtitle text-sm mt-0.5">
          Configure os detalhes da sua campanha promocional
        </p>
      </div>

      {/* Aviso de limite de plano */}
      {limiteBloqueado && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <p className="text-amber-800 font-semibold text-sm mb-1">Limite do plano atingido</p>
          <p className="text-amber-700 text-sm">
            O plano Essencial permite no máximo 3 campanhas. Você já possui {totalCampanhas}.{" "}
            <Link
              href="/dashboard/configuracoes/plano"
              className="underline font-medium hover:text-amber-900"
            >
              Fazer upgrade
            </Link>
          </p>
        </div>
      )}

      <div className="dash-card p-4 sm:p-6">
        {limiteBloqueado ? (
          <p className="dash-muted text-sm text-center py-8">
            Faça upgrade do seu plano para criar mais campanhas.
          </p>
        ) : (
          <CampanhaForm action={criarCampanha} layouts={layouts} />
        )}
      </div>
    </div>
  )
}
