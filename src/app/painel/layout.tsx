import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { MenuLateral } from "./_components/menu-lateral"

/**
 * Layout do portal. O middleware só confere a presença do cookie; a checagem
 * de verdade — sessão válida e papel — acontece aqui, no servidor.
 */
export default async function LayoutPainel({
  children,
}: {
  children: React.ReactNode
}) {
  const sessao = await auth()
  if (!sessao?.user) redirect("/login")

  const ehAdmin = sessao.user.role === "ADMIN"

  // Contagem de contas esperando liberação — vira selo no menu para o ADMIN
  // não deixar ninguém parado na porta.
  const pendentes = ehAdmin
    ? await prisma.user.count({ where: { ativo: false } }).catch(() => 0)
    : 0

  return (
    <div className="min-h-screen bg-[#0e0f2d]">
      <MenuLateral
        nome={sessao.user.name ?? "Aluno"}
        email={sessao.user.email ?? ""}
        role={sessao.user.role}
        pendentes={pendentes}
      />

      <div className="lg:pl-[260px]">
        <main className="mx-auto max-w-[1100px] px-5 py-6 lg:py-10">{children}</main>
      </div>
    </div>
  )
}
