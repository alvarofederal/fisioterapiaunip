"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  Home,
  BookOpen,
  ClipboardList,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Papel = "ADMIN" | "ALUNO"

const ITENS = [
  { href: "/painel", rotulo: "Início", icone: Home, exato: true },
  { href: "/painel/materias", rotulo: "Matérias", icone: BookOpen },
  { href: "/painel/trabalhos", rotulo: "Trabalhos", icone: ClipboardList },
  { href: "/painel/usuarios", rotulo: "Usuários", icone: Users, somenteAdmin: true },
] as const

export function MenuLateral({
  nome,
  email,
  role,
}: {
  nome: string
  email: string
  role: Papel
}) {
  const caminho = usePathname()
  const [aberto, setAberto] = useState(false)

  const itensVisiveis = ITENS.filter(
    (item) => !("somenteAdmin" in item && item.somenteAdmin) || role === "ADMIN"
  )

  function estaAtivo(href: string, exato?: boolean) {
    return exato ? caminho === href : caminho.startsWith(href)
  }

  const conteudo = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-[#e5e5e5] px-4">
        <span className="marca-simbolo grid h-8 w-8 place-items-center rounded-lg">
          <span className="grid h-[22px] w-[22px] place-items-center rounded-[5px] bg-[#0a0a0a] text-[12px] font-semibold text-white">
            F
          </span>
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[14px] font-semibold text-[#171717]">
            Fisioterapia UNIP
          </p>
          <p className="text-[11px] text-[#737373]">Portal da turma</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {itensVisiveis.map(({ href, rotulo, icone: Icone, ...resto }) => {
          const ativo = estaAtivo(href, "exato" in resto ? resto.exato : false)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setAberto(false)}
              aria-current={ativo ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors",
                ativo
                  ? "bg-[#dbeafe] text-[#171717]"
                  : "text-[#525252] hover:bg-[#f5f5f5] hover:text-[#171717]"
              )}
            >
              <Icone size={17} aria-hidden />
              {rotulo}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[#e5e5e5] p-3">
        <div className="mb-2 px-3 py-1">
          <p className="truncate text-[13px] font-medium text-[#171717]">{nome}</p>
          <p className="truncate text-[11px] text-[#737373]">{email}</p>
          {role === "ADMIN" && (
            <span className="mt-1.5 inline-flex rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#16a34a]">
              Administrador
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-[#525252] transition-colors hover:bg-[#f5f5f5] hover:text-[#171717]"
        >
          <LogOut size={17} aria-hidden />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Barra superior — só no mobile */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#e5e5e5] bg-white/85 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          className="grid h-9 w-9 place-items-center rounded-lg text-[#525252] transition-colors hover:bg-[#f5f5f5]"
        >
          <Menu size={20} aria-hidden />
        </button>
        <span className="text-[15px] font-semibold text-[#171717]">
          Fisioterapia UNIP
        </span>
      </header>

      {/* Sanfona no mobile */}
      {aberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[#0a0a0a]/40"
            onClick={() => setAberto(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-[260px] border-r border-[#e5e5e5] bg-white">
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar menu"
              className="absolute right-3 top-4 z-10 grid h-8 w-8 place-items-center rounded-lg text-[#525252] hover:bg-[#f5f5f5]"
            >
              <X size={18} aria-hidden />
            </button>
            {conteudo}
          </aside>
        </div>
      )}

      {/* Fixo no desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] border-r border-[#e5e5e5] bg-white lg:block">
        {conteudo}
      </aside>
    </>
  )
}
