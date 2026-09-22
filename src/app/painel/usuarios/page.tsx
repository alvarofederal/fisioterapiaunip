import { redirect } from "next/navigation"
import { Clock } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { iniciaisDe } from "@/lib/dominio"
import { AcoesUsuario } from "./_components/acoes-usuario"

export const metadata = { title: "Usuários" }

export default async function PaginaUsuarios() {
  const sessao = await auth()
  if (!sessao?.user) redirect("/login")

  // O papel é lido do BANCO, não do token: um admin rebaixado continuaria
  // passando por aqui até o token expirar. Esta é a tela mais sensível.
  const eu = await prisma.user.findUnique({
    where: { id: sessao.user.id },
    select: { id: true, role: true, ativo: true },
  })
  if (!eu?.ativo || eu.role !== "ADMIN") redirect("/painel")

  const usuarios = await prisma.user.findMany({
    orderBy: [{ ativo: "asc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      email: true,
      ra: true,
      role: true,
      ativo: true,
      ultimoAcesso: true,
    },
  })

  const pendentes = usuarios.filter((u) => !u.ativo)
  const liberados = usuarios.filter((u) => u.ativo)

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="titulo-display text-[28px] md:text-[34px]">Usuários</h1>
        <p className="text-[14px] text-fog">
          {usuarios.length} {usuarios.length === 1 ? "conta" : "contas"}
          {pendentes.length > 0 && (
            <>
              {" · "}
              <strong className="font-semibold text-ember-orange">
                {pendentes.length} aguardando
              </strong>
            </>
          )}
        </p>
      </header>

      {pendentes.length > 0 && (
        <p className="flex items-start gap-2 rounded-xl border border-ember-orange/30 bg-ember-orange/[0.07] px-3.5 py-2.5 text-[13px] leading-relaxed text-fog">
          <Clock size={15} className="mt-0.5 shrink-0 text-ember-orange" aria-hidden />
          Confira o RA na lista da turma antes de liberar — é o RA que garante que a pessoa
          é mesmo da sala.
        </p>
      )}

      <Secao titulo="Aguardando" usuarios={pendentes} meuId={eu.id} />
      <Secao titulo="Com acesso" usuarios={liberados} meuId={eu.id} />
    </div>
  )
}

type UsuarioDaLista = {
  id: string
  nome: string
  email: string
  ra: string
  role: "ADMIN" | "ALUNO"
  ativo: boolean
  ultimoAcesso: Date | null
}

function Secao({
  titulo,
  usuarios,
  meuId,
}: {
  titulo: string
  usuarios: UsuarioDaLista[]
  meuId: string
}) {
  if (usuarios.length === 0) return null

  return (
    <section>
      <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-greyple">
        {titulo} · {usuarios.length}
      </h2>

      {/* Linhas coladas dentro de um contêiner só — lista de gente é para
          bater o olho e achar, não para admirar card por card. */}
      <div className="divide-y divide-white/[0.07] overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
        {usuarios.map((usuario) => (
          <div
            key={usuario.id}
            className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-white/[0.03]"
          >
            <Avatar className="size-8 shrink-0">
              <AvatarFallback
                className={cn(
                  "text-[11px]",
                  usuario.ativo ? "bg-blurple" : "bg-[#2c2f33] text-greyple"
                )}
              >
                {iniciaisDe(usuario.nome)}
              </AvatarFallback>
            </Avatar>

            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2.5">
              <span className="truncate text-[14px] font-medium leading-snug text-white">
                {usuario.nome}
              </span>
              <span className="truncate text-[13px] leading-snug text-fog">{usuario.email}</span>
            </div>

            <span className="hidden shrink-0 font-mono text-[12px] text-greyple sm:inline">
              {usuario.ra}
            </span>

            {usuario.role === "ADMIN" && (
              <span className="shrink-0 rounded-full bg-blurple/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-hover-blurple">
                Admin
              </span>
            )}

            <AcoesUsuario
              usuarioId={usuario.id}
              nome={usuario.nome}
              ativo={usuario.ativo}
              role={usuario.role}
              souEu={usuario.id === meuId}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
