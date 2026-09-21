import { ClipboardList } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { CardTrabalho } from "../_components/card-trabalho"

export const metadata = { title: "Trabalhos" }

export default async function PaginaTrabalhos() {
  const sessao = await auth()
  const ehAdmin = sessao?.user.role === "ADMIN"

  const trabalhos = await prisma.trabalho.findMany({
    include: { materia: true, _count: { select: { anexos: true } } },
    orderBy: [{ entregaEm: "asc" }, { criadoEm: "desc" }],
  })

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-[24px] font-medium tracking-[-0.01em] text-[#171717]">
          Trabalhos e eventos
        </h1>
        <p className="mt-1 text-[14px] text-[#737373]">
          {trabalhos.length === 0
            ? "Nada cadastrado ainda"
            : `${trabalhos.length} ${trabalhos.length === 1 ? "publicação" : "publicações"}`}
        </p>
      </header>

      {trabalhos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#d4d4d4] bg-[#f5f5f5] px-6 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-[#e5e5e5] bg-white text-[#737373]">
            <ClipboardList size={22} aria-hidden />
          </span>
          <h2 className="text-[16px] font-semibold text-[#171717]">
            Nenhum trabalho cadastrado
          </h2>
          <p className="max-w-[420px] text-[14px] text-[#525252]">
            {ehAdmin
              ? "O cadastro com anexos entra na próxima etapa do desenvolvimento."
              : "Assim que o administrador publicar, aparece aqui e no mural."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {trabalhos.map((trabalho) => (
            <CardTrabalho key={trabalho.id} trabalho={trabalho} />
          ))}
        </div>
      )}
    </div>
  )
}
