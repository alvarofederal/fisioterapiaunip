import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { ChevronLeft } from "lucide-react"
import { NovaSolicitacaoForm } from "./_components/nova-solicitacao-form"
import { criarSolicitacao } from "../_actions/impressao-actions"

export default async function NovaSolicitacaoPage() {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  // Verificar modo de impressão
  const loja = await db.loja.findUnique({
    where: { id: session.user.lojaId },
    select: { tipoImpressao: true, nome: true, nomeExibicao: true },
  })

  // Se for modo próprio, redirecionar
  if (loja?.tipoImpressao === "PROPRIO") redirect("/dashboard/impressao")

  // Campanhas ativas com lotes
  const campanhas = await db.campanha.findMany({
    where: {
      lojaId: session.user.lojaId,
      status: { in: ["ATIVA", "PAUSADA", "ENCERRADA"] },
      lotes: { some: {} },
    },
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      nome: true,
      status: true,
      lotes: {
        select: {
          id: true,
          descricao: true,
          quantidade: true,
          criadoEm: true,
          formatoSaida: true,
        },
        orderBy: { criadoEm: "desc" },
      },
    },
  })

  // Layouts disponíveis
  const layouts = await db.layout.findMany({
    where: { lojaId: session.user.lojaId },
    orderBy: [{ padrao: "desc" }, { criadoEm: "desc" }],
    select: {
      id: true,
      nome: true,
      corPrimaria: true,
      tamanhoCard: true,
      estiloCard: true,
      padrao: true,
    },
  })

  return (
    <div>
      <Link
        href="/dashboard/impressao"
        className="inline-flex items-center gap-1.5 text-sm dash-muted hover:dash-subtitle mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Impressão
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold dash-title">Nova solicitação de impressão</h1>
        <p className="dash-subtitle text-sm mt-0.5">
          Selecione a campanha, lote e layout. O Courtesyfy irá revisar e entrar em contato.
        </p>
      </div>

      <NovaSolicitacaoForm
        action={criarSolicitacao}
        campanhas={campanhas}
        layouts={layouts}
      />
    </div>
  )
}
