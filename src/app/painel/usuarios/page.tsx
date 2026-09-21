import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const metadata = { title: "Usuários" }

export default async function PaginaUsuarios() {
  const sessao = await auth()

  // Segunda barreira: o menu esconde o item, mas a rota precisa se defender
  // sozinha — alguém pode digitar a URL.
  if (sessao?.user.role !== "ADMIN") redirect("/painel")

  const usuarios = await prisma.user.findMany({
    orderBy: [{ ativo: "asc" }, { criadoEm: "desc" }],
  })

  const pendentes = usuarios.filter((u) => !u.ativo).length

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-[24px] font-medium tracking-[-0.01em] text-[#171717]">
          Usuários
        </h1>
        <p className="mt-1 text-[14px] text-[#737373]">
          {usuarios.length} {usuarios.length === 1 ? "conta" : "contas"}
          {pendentes > 0 && (
            <>
              {" · "}
              <strong className="font-medium text-[#ea580c]">
                {pendentes} aguardando liberação
              </strong>
            </>
          )}
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-[#e5e5e5] bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#e5e5e5] bg-[#f5f5f5]">
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#737373]">
                Nome
              </th>
              <th className="hidden px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#737373] sm:table-cell">
                E-mail
              </th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#737373]">
                Papel
              </th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#737373]">
                Situação
              </th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="border-b border-[#e5e5e5] last:border-0">
                <td className="px-4 py-3 text-[14px] font-medium text-[#171717]">
                  {usuario.nome}
                  <span className="block text-[12px] font-normal text-[#737373] sm:hidden">
                    {usuario.email}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-[14px] text-[#525252] sm:table-cell">
                  {usuario.email}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      usuario.role === "ADMIN"
                        ? "bg-[#f5f3ff] text-[#7c3aed]"
                        : "bg-[#f5f5f5] text-[#525252]"
                    }`}
                  >
                    {usuario.role === "ADMIN" ? "Administrador" : "Aluno"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      usuario.ativo
                        ? "bg-[#dcfce7] text-[#16a34a]"
                        : "bg-[#fff7ed] text-[#ea580c]"
                    }`}
                  >
                    {usuario.ativo ? "Ativo" : "Aguardando"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[13px] text-[#737373]">
        Os botões de liberar, desativar e trocar papel entram na próxima etapa.
      </p>
    </div>
  )
}
