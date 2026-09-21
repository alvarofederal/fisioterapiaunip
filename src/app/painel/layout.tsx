import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
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

  return (
    <div className="min-h-screen bg-white">
      <MenuLateral
        nome={sessao.user.name ?? "Aluno"}
        email={sessao.user.email ?? ""}
        role={sessao.user.role}
      />

      <div className="lg:pl-[240px]">
        <main className="mx-auto max-w-[1200px] px-5 py-6 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
