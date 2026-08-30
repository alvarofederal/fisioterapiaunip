"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useTransition } from "react"
import { Search, Loader2 } from "lucide-react"

export function BuscaInput() {
  const router     = useRouter()
  const pathname   = usePathname()
  const params     = useSearchParams()
  const [value, setValue] = useState(params.get("busca") ?? "")
  const [pending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setValue(v)
    startTransition(() => {
      const url = new URL(pathname, "http://x")
      if (v) url.searchParams.set("busca", v)
      else    url.searchParams.delete("busca")
      router.push(url.pathname + url.search)
    })
  }

  return (
    <div className="relative">
      {pending
        ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dash-muted animate-spin pointer-events-none" />
        : <Search  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dash-muted pointer-events-none" />
      }
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Buscar por nome, e-mail ou telefone…"
        className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] dash-subtitle placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 dark:focus:border-emerald-500/50 w-full sm:w-72 transition-all"
      />
    </div>
  )
}
