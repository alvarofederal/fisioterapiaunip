import Link from "next/link"
import { Activity } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Marca do portal. O símbolo é o único lugar onde o blurple aparece fora de
 * uma ação primária — é o âncora cromático da identidade.
 */
export function MarcaFisio({
  tamanho = "normal",
  href = "/",
  className,
}: {
  tamanho?: "normal" | "pequeno"
  href?: string | null
  className?: string
}) {
  const pequeno = tamanho === "pequeno"

  const conteudo = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "grid place-items-center rounded-xl bg-blurple text-white",
          pequeno ? "size-8" : "size-10"
        )}
      >
        <Activity size={pequeno ? 17 : 21} strokeWidth={2.6} aria-hidden />
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "titulo-display block",
            pequeno ? "text-[15px]" : "text-[18px]"
          )}
        >
          Fisio UNIP
        </span>
        {!pequeno && (
          <span className="mt-1 block text-[11px] font-medium tracking-wide text-fog">
            Portal da turma
          </span>
        )}
      </span>
    </span>
  )

  if (!href) return conteudo

  return (
    <Link href={href} className="transition-opacity hover:opacity-80">
      {conteudo}
    </Link>
  )
}
