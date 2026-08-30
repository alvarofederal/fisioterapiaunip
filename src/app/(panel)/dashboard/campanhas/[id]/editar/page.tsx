import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { ChevronLeft } from "lucide-react"
import { CampanhaForm } from "../../_components/campanha-form"
import { atualizarCampanha } from "../../_actions/atualizar-campanha"

export default async function EditarCampanhaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  const { id } = await params

  const [campanha, layouts] = await Promise.all([
    db.campanha.findUnique({
      where: { id },
      select: {
        id: true,
        lojaId: true,
        nome: true,
        descricao: true,
        tipoBeneficio: true,
        valorBeneficio: true,
        descricaoPremio: true,
        regrasUso: true,
        inicioEm: true,
        expiraEm: true,
        quantidadeChaves: true,
        layoutId: true,
        status: true,
      },
    }),
    db.layout.findMany({
      where: { lojaId: session.user.lojaId! },
      select: { id: true, nome: true, corPrimaria: true, padrao: true },
      orderBy: [{ padrao: "desc" }, { nome: "asc" }],
    }),
  ])

  if (!campanha || campanha.lojaId !== session.user.lojaId) notFound()

  if (campanha.status === "ENCERRADA" || campanha.status === "CANCELADA") {
    redirect(`/dashboard/campanhas/${id}`)
  }

  const action = atualizarCampanha.bind(null, id)

  return (
    <div className="w-full">
      {/* Breadcrumb */}
      <Link
        href={`/dashboard/campanhas/${id}`}
        className="inline-flex items-center gap-1.5 text-sm dash-muted hover:text-emerald-500 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        {campanha.nome}
      </Link>

      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Editar campanha</h1>
        <p className="dash-subtitle text-sm mt-0.5">Altere os detalhes desta campanha</p>
      </div>

      <div className="dash-card p-4 sm:p-6">
        <CampanhaForm
          action={action}
          isEditing
          layouts={layouts}
          defaultValues={{
            nome: campanha.nome,
            descricao: campanha.descricao ?? undefined,
            tipoBeneficio: campanha.tipoBeneficio as never,
            valorBeneficio: campanha.valorBeneficio
              ? String(campanha.valorBeneficio)
              : undefined,
            descricaoPremio: campanha.descricaoPremio ?? undefined,
            regrasUso: campanha.regrasUso ?? undefined,
            inicioEm: campanha.inicioEm,
            expiraEm: campanha.expiraEm,
            quantidadeChaves: campanha.quantidadeChaves,
            layoutId: campanha.layoutId ?? undefined,
          }}
        />
      </div>
    </div>
  )
}
