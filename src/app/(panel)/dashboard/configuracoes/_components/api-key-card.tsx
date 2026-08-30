"use client"

/**
 * ApiKeyCard — exibe a API key da loja com botão de copiar.
 *
 * A key é gerada no Server Component pai (page.tsx) via computeApiKey(lojaId)
 * e passada como prop para este componente cliente.
 */
import { useState } from "react"
import { Copy, Check, Code2 } from "lucide-react"

interface ApiKeyCardProps {
  apiKey: string
}

export function ApiKeyCard({ apiKey }: ApiKeyCardProps) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // fallback manual selection
    }
  }

  return (
    <div className="dash-card p-4 sm:p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
          <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold dash-title">API Key — Integração Externa</p>
          <p className="text-xs dash-muted mt-0.5">
            Use este token para integrar PDVs, apps ou sistemas externos com o Courtesyfy.
          </p>
        </div>
      </div>

      {/* Key display */}
      <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2.5 border border-black/8 dark:border-white/10">
        <code className="flex-1 text-[11px] sm:text-xs font-mono text-emerald-700 dark:text-emerald-300 truncate select-all">
          {apiKey}
        </code>
        <button
          onClick={copiar}
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/10 dark:hover:bg-white/10"
          title="Copiar API key"
        >
          {copiado
            ? <Check className="w-4 h-4 text-emerald-500" />
            : <Copy className="w-4 h-4 dash-muted" />
          }
        </button>
      </div>

      {/* Usage example */}
      <details className="mt-3">
        <summary className="text-xs dash-muted cursor-pointer select-none hover:opacity-80 transition-opacity">
          Como usar (exemplo cURL)
        </summary>
        <pre className="mt-2 text-[10px] sm:text-[11px] font-mono bg-black/5 dark:bg-white/5 rounded-lg p-3 overflow-x-auto text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
{`curl -X POST https://courtesyfy.com.br/api/chaves/validar \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"codigo": "XXXX-XXXX-XXXX-XXXX", "acao": "consultar"}'`}
        </pre>
        <p className="text-[10px] dash-muted mt-2">
          <strong>acao:</strong>{" "}
          <code className="text-emerald-600 dark:text-emerald-400">consultar</code> (leitura) ou{" "}
          <code className="text-emerald-600 dark:text-emerald-400">resgatar</code> (confirma o resgate)
        </p>
      </details>
    </div>
  )
}
