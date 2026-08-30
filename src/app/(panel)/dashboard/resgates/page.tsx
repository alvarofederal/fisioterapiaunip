import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { ShoppingBag, User, Calendar } from "lucide-react"
import { Validador } from "./_components/validador"

export default async function ResgatesPage() {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  const resgatesRecentes = await db.resgate.findMany({
    where: { lojaId: session.user.lojaId! },
    orderBy: { resgatadoEm: "desc" },
    take: 10,
    include: {
      chave: { select: { codigo: true } },
      campanha: { select: { nome: true } },
      cliente: { select: { nome: true, telefone: true } },
      operador: { select: { name: true } },
    },
  })

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-xl sm:text-2xl font-bold dash-title">Validar Resgate</h1>
          <p className="dash-subtitle text-sm mt-0.5">
            Digite ou escaneie o código da chave para confirmar o benefício
          </p>
        </div>

        {/* Validador */}
        <div className="dash-card p-4 sm:p-6 mb-8">
          <Validador />
        </div>

        {/* Histórico recente */}
        {resgatesRecentes.length > 0 && (
          <div className="dash-card overflow-hidden">
            <div className="px-5 py-4 border-b dash-border">
              <h2 className="font-semibold dash-title">Últimos resgates</h2>
            </div>
            <div className="divide-y dash-divider">
              {resgatesRecentes.map((r) => (
                <div key={r.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 dash-icon-emerald">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="font-mono text-xs bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-700 dark:text-white/80">
                        {r.chave.codigo}
                      </code>
                      <span className="text-xs dash-subtitle truncate">{r.campanha.nome}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs dash-muted">
                      {r.cliente?.nome && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />{r.cliente.nome}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(r.resgatadoEm).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full flex-shrink-0">
                    Confirmado
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
