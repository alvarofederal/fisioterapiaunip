import Link from "next/link"
import { Newspaper } from "lucide-react"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { MarcaFisio } from "@/components/marca-fisio"

/**
 * Barra de navegação das telas abertas (sem login).
 *
 * Mostra "Entrar" para visitante e "Ir para o painel" para quem já tem sessão —
 * quem está logado e cai na página pública não deveria ter que se lembrar do
 * caminho de volta.
 */
export async function BarraPublica({ atual }: { atual?: "noticias" }) {
  const sessao = await auth()
  const logado = Boolean(sessao?.user)

  return (
    <header className="relative z-20 border-b border-white/[0.06]">
      <div className="mx-auto flex h-20 max-w-[1200px] items-center gap-4 px-5">
        <MarcaFisio />

        <nav className="ml-auto flex items-center gap-1">
          <Link
            href="/noticias"
            aria-current={atual === "noticias" ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[15px] font-medium transition-colors",
              atual === "noticias"
                ? "bg-white/[0.08] text-white"
                : "text-fog hover:bg-white/[0.06] hover:text-white"
            )}
          >
            <Newspaper size={16} aria-hidden />
            Notícias
          </Link>

          {logado ? (
            <Link
              href="/painel"
              className="ml-1 rounded-2xl bg-white px-4 py-2.5 text-[15px] font-medium text-[#23272a] transition-transform hover:scale-[1.03]"
            >
              Ir para o painel
            </Link>
          ) : (
            <Link
              href="/login"
              className="ml-1 rounded-2xl bg-white px-4 py-2.5 text-[15px] font-medium text-[#23272a] transition-transform hover:scale-[1.03]"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
