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

  // O JWT é stateless: ele continua válido mesmo depois que o ADMIN desativa ou
  // exclui a conta. Sem esta conferência, quem perdesse o acesso seguiria
  // navegando até o token expirar — 30 dias. Uma busca por chave primária é
  // barata e é o que faz "desativar usuário" valer de imediato.
  const usuarioAtual = await prisma.user.findUnique({
    where: { id: sessao.user.id },
    select: { ativo: true, role: true },
  })

  if (!usuarioAtual?.ativo) redirect("/login?sessao=encerrada")

  const ehAdmin = usuarioAtual.role === "ADMIN"

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
        role={usuarioAtual.role}
        pendentes={pendentes}
      />

      <div className="lg:pl-[260px]">
        {/* Sem largura máxima: o painel usa a tela inteira. Tabelas e listas
            longas rendem mais em monitor largo do que uma coluna centrada. */}
        <main className="px-5 py-6 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  )
}
