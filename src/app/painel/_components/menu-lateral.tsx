"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Home, BookOpen, CalendarDays, ListChecks, Users, LogOut, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { MarcaFisio } from "@/components/marca-fisio"
import { Avatar, AvatarFallback, AvatarBadge } from "@/components/ui/avatar"
import { iniciaisDe } from "@/lib/dominio"
import { Badge } from "@/components/ui/badge"

type Papel = "ADMIN" | "ALUNO"

const ITENS = [
  { href: "/painel", rotulo: "Início", icone: Home, exato: true },
  // Matérias é cadastro puro: para o aluno não há o que fazer ali, e um item
  // de menu sem função confunde mais do que ajuda.
  { href: "/painel/materias", rotulo: "Matérias", icone: BookOpen, somenteAdmin: true },
  { href: "/painel/cronograma", rotulo: "Cronograma", icone: CalendarDays },
  { href: "/painel/atividades", rotulo: "Atividades", icone: ListChecks },
  { href: "/painel/usuarios", rotulo: "Usuários", icone: Users, somenteAdmin: true },
] as const

export function MenuLateral({
  nome,
  email,
  role,
  pendentes,
}: {
  nome: string
  email: string
  role: Papel
  pendentes: number
}) {
  const caminho = usePathname()
  const [aberto, setAberto] = useState(false)

  const itens = ITENS.filter(
    (item) => !("somenteAdmin" in item && item.somenteAdmin) || role === "ADMIN"
  )

  const conteudo = (
    <div className="flex h-full flex-col bg-[#23272a]">
      <div className="flex h-20 items-center border-b border-white/[0.06] px-5">
        <MarcaFisio href="/painel" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {itens.map(({ href, rotulo, icone: Icone, ...resto }) => {
          const exato = "exato" in resto ? resto.exato : false
          const ativo = exato ? caminho === href : caminho.startsWith(href)
          const mostrarSelo = href === "/painel/usuarios" && pendentes > 0

          return (
            <Link
              key={href}
              href={href}
              onClick={() => setAberto(false)}
              aria-current={ativo ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                ativo
                  ? "bg-blurple text-white"
                  : "text-fog hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <Icone size={18} aria-hidden />
              <span className="flex-1">{rotulo}</span>
              {mostrarSelo && (
                <Badge
                  variant={ativo ? "secondary" : "default"}
                  className={cn(
                    "h-5 min-w-5 px-1.5 text-[11px] tabular-nums",
                    !ativo && "bg-ember-orange text-[#23272a]"
                  )}
                >
                  {pendentes}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar className="size-9">
            <AvatarFallback>{iniciaisDe(nome)}</AvatarFallback>
            <AvatarBadge className="ring-[#23272a]" />
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-white">{nome}</p>
            <p className="truncate text-[11px] text-greyple">{email}</p>
          </div>
        </div>

        {role === "ADMIN" && (
          <Badge className="mb-2 ml-2 bg-blurple text-[10px] uppercase tracking-wide">
            Administrador
          </Badge>
        )}

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-fog transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <LogOut size={18} aria-hidden />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Barra superior — só no mobile */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-[#23272a] px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          className="grid size-10 place-items-center rounded-xl text-fog transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <Menu size={20} aria-hidden />
        </button>
        <MarcaFisio tamanho="pequeno" href="/painel" />
        {role === "ADMIN" && pendentes > 0 && (
          <Badge className="ml-auto bg-ember-orange text-[11px] text-[#23272a]">
            {pendentes} pendente{pendentes > 1 ? "s" : ""}
          </Badge>
        )}
      </header>

      {/* Sanfona no mobile */}
      {aberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setAberto(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-[270px]">
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar menu"
              className="absolute right-3 top-6 z-10 grid size-9 place-items-center rounded-xl text-fog hover:bg-white/[0.06] hover:text-white"
            >
              <X size={18} aria-hidden />
            </button>
            {conteudo}
          </aside>
        </div>
      )}

      {/* Fixo no desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] lg:block">
        {conteudo}
      </aside>
    </>
  )
}
