import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { MigrarForm } from "./migrar-form"

export default async function MigrarChavesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  const { id } = await params
  const agora   = new Date()

  // ── Campanha de origem ───────────────────────────────────────────
  const origem = await db.campanha.findUnique({
    where: { id, lojaId: session.user.lojaId },
    select: {
      id: true,
      nome: true,
      expiraEm: true,
      status: true,
    },
  })

  if (!origem) notFound()

  const origemExpirada  = agora > origem.expiraEm
  const origemEncerrada = origem.status === "ENCERRADA" || origem.status === "CANCELADA"

  if (!origemExpirada && !origemEncerrada) redirect(`/dashboard/campanhas/${id}`)

  // ── Conta chaves migráveis ────────────────────────────────────────
  const qtdMigraveis = await db.chave.count({
    where: {
      campanhaId: id,
      lojaId: session.user.lojaId,
      status: { in: ["GERADA", "CONSULTADA", "ATIVADA"] },
    },
  })

  if (qtdMigraveis === 0) redirect(`/dashboard/campanhas/${id}`)

  // ── Campanhas destino disponíveis ────────────────────────────────
  const destinosRaw = await db.campanha.findMany({
    where: {
      lojaId: session.user.lojaId,
      id:     { not: id },
      status: { in: ["ATIVA", "PAUSADA", "RASCUNHO"] },
      expiraEm: { gt: agora },
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

  const destinos = destinosRaw.map((d) => ({
    id:               d.id,
    nome:             d.nome,
    expiraEm:         d.expiraEm.toISOString(),
    vagasDisponiveis: d.quantidadeChaves - d._count.chaves,
  }))

  return (
    <MigrarForm
      campanhaOrigemId={origem.id}
      campanhaOrigemNome={origem.nome}
      campanhaExpiraEm={origem.expiraEm.toISOString()}
      qtdMigraveis={qtdMigraveis}
      destinos={destinos}
    />
  )
}
