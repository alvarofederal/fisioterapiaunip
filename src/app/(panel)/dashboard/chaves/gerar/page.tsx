import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { ChevronLeft } from "lucide-react"
import { GerarLoteForm } from "../_components/gerar-lote-form"

type SearchParams = { campanhaId?: string }

export default async function GerarLotePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  const params = await searchParams

  const agora = new Date()

  const campanhasRaw = await db.campanha.findMany({
    where: {
      lojaId: session.user.lojaId!,
      status: { in: ["ATIVA", "PAUSADA", "RASCUNHO"] },
      expiraEm: { gt: agora }, // apenas campanhas ainda vigentes
    },
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      nome: true,
      expiraEm: true,
      quantidadeChaves: true,
      _count: { select: { chaves: true } },
    },
  })

  const campanhas = campanhasRaw.map((c) => ({
    id: c.id,
    nome: c.nome,
    expiraEm: c.expiraEm,
    quantidadeChaves: c.quantidadeChaves,
    chavesGeradas: c._count.chaves,
  }))

  return (
    <div className="w-full">
      {/* Breadcrumb */}
      <Link
        href={
          params.campanhaId
            ? `/dashboard/campanhas/${params.campanhaId}`
            : "/dashboard/chaves"
        }
        className="inline-flex items-center gap-1.5 text-sm dash-muted hover:text-emerald-500 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        {params.campanhaId ? "Voltar para campanha" : "Chaves"}
      </Link>

      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Gerar lote de chaves</h1>
        <p className="dash-subtitle text-sm mt-0.5">
          Cada chave recebe um código único no formato{" "}
          <code className="bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/70 px-1.5 py-0.5 rounded text-xs font-mono">
            XXXX-XXXX-XXXX-XXXX
          </code>{" "}
          com QR Code apontando para a landing page da campanha.
        </p>
      </div>

      <div className="dash-card p-4 sm:p-6">
        <GerarLoteForm campanhas={campanhas} campanhaIdPadrão={params.campanhaId} />
      </div>

      {/* Info sobre os códigos */}
      <div className="mt-4 dash-card p-4 text-xs dash-muted space-y-1">
        <p>
          <strong className="dash-subtitle">Formato:</strong> 16 caracteres alfanuméricos sem
          ambiguidade (sem 0/O, 1/I/L), agrupados em 4 blocos de 4.
        </p>
        <p>
          <strong className="dash-subtitle">Unicidade:</strong> Gerado com{" "}
          <code className="bg-gray-100 dark:bg-white/10 px-1 rounded">crypto.randomBytes</code> — colisões verificadas
          automaticamente.
        </p>
        <p>
          <strong className="dash-subtitle">QR Code:</strong> Cada chave gera automaticamente um
          QR Code apontando para{" "}
          <code className="bg-gray-100 dark:bg-white/10 px-1 rounded">/c/[codigo]</code>.
        </p>
      </div>
    </div>
  )
}
