import { redirect } from "next/navigation"
import { Clock } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { iniciaisDe } from "@/lib/dominio"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Usuários" }

export default async function PaginaUsuarios() {
  const sessao = await auth()

  // Segunda barreira: o menu esconde o item, mas a rota precisa se defender
  // sozinha — alguém pode digitar a URL.
  if (sessao?.user.role !== "ADMIN") redirect("/painel")

  const usuarios = await prisma.user.findMany({
    orderBy: [{ ativo: "asc" }, { criadoEm: "desc" }],
  })

  const pendentes = usuarios.filter((u) => !u.ativo)
  const liberados = usuarios.filter((u) => u.ativo)

  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="titulo-display text-[30px] md:text-[38px]">Usuários</h1>
        <p className="mt-2 text-[15px] text-fog">
          {usuarios.length} {usuarios.length === 1 ? "conta" : "contas"} no portal
        </p>
      </header>

      {pendentes.length > 0 && (
        <section className="rounded-2xl border border-ember-orange/30 bg-ember-orange/[0.07] p-5">
          <h2 className="titulo-display mb-1 flex items-center gap-2 text-[17px] text-ember-orange">
            <Clock size={17} aria-hidden />
            {pendentes.length} aguardando liberação
          </h2>
          <p className="m-0 text-[14px] text-fog">
            Confira o RA na lista da turma antes de liberar. É o RA que garante que
            a pessoa é mesmo da sala.
          </p>
        </section>
      )}

      <ListaUsuarios titulo="Aguardando" usuarios={pendentes} />
      <ListaUsuarios titulo="Com acesso" usuarios={liberados} />

      <p className="text-[13px] text-greyple">
        Os botões de liberar, desativar e trocar papel entram na próxima etapa.
      </p>
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

function ListaUsuarios({
  titulo,
  usuarios,
}: {
  titulo: string
  usuarios: UsuarioDaLista[]
}) {
  if (usuarios.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-greyple">
        {titulo} · {usuarios.length}
      </h2>

      <div className="flex flex-col gap-2">
        {usuarios.map((usuario) => (
          <article
            key={usuario.id}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-white/20"
          >
            <Avatar className="size-11 shrink-0">
              <AvatarFallback
                className={usuario.ativo ? "bg-blurple" : "bg-[#2c2f33] text-greyple"}
              >
                {iniciaisDe(usuario.nome)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-white">{usuario.nome}</p>
              <p className="truncate text-[13px] text-fog">{usuario.email}</p>
              <p className="mt-0.5 font-mono text-[12px] text-greyple">RA {usuario.ra}</p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {usuario.role === "ADMIN" && (
                <Badge className="bg-blurple text-[10px] uppercase tracking-wide">Admin</Badge>
              )}
              <Badge
                variant={usuario.ativo ? "outline" : "default"}
                className={
                  usuario.ativo
                    ? "border-spring-green/40 bg-spring-green/10 text-spring-green"
                    : "bg-ember-orange text-[#23272a]"
                }
              >
                {usuario.ativo ? "Ativo" : "Aguardando"}
              </Badge>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
