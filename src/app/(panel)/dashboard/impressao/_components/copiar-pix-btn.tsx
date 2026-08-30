"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

export function CopiarPixBtn({ chave }: { chave: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(chave).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 border border-orange-200 dark:border-orange-500/30 px-2.5 py-1.5 rounded-lg transition-colors"
    >
      {copied
        ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copiado!</>
        : <><Copy className="w-3.5 h-3.5" /> Copiar</>
      }
    </button>
  )
}
