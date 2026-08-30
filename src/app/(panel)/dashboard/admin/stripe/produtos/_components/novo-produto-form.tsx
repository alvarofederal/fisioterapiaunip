"use client"

import { useState, useTransition } from "react"
import { Loader2, Check, Copy, CheckCheck } from "lucide-react"
import { criarProduto } from "../_actions"

function CopyId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="inline-flex items-center gap-2 text-sm font-mono text-gray-400 hover:text-emerald-500 transition-colors">
      <code className="break-all">{value}</code>
      {copied ? <CheckCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <Copy className="w-4 h-4 flex-shrink-0" />}
    </button>
  )
}

export default function NovoProdutoForm() {
  const [nome, setNome]           = useState("")
  const [desc, setDesc]           = useState("")
  const [produtoId, setProdutoId] = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit() {
    if (!nome.trim()) { setError("Nome obrigatório"); return }
    setError(null)
    startTransition(async () => {
      const res = await criarProduto({ nome: nome.trim(), descricao: desc.trim() || undefined })
      if (res.error) {
        setError(res.error)
      } else if ("produtoId" in res) {
        setProdutoId(res.produtoId!)
      }
    })
  }

  if (produtoId) {
    return (
      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 space-y-2">
        <p className="font-semibold text-emerald-700 dark:text-emerald-400">Produto criado com sucesso!</p>
        <p className="text-xs dash-muted">ID do produto (use para criar preços):</p>
        <CopyId value={produtoId} />
        <button
          onClick={() => { setProdutoId(null); setNome(""); setDesc("") }}
          className="text-xs text-emerald-600 hover:underline mt-2 block"
        >
          Criar outro produto
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold dash-muted mb-1.5">Nome *</label>
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: Cartão Offset 240g"
            className="w-full border border-gray-200 dark:border-white/[0.08] rounded-lg px-3 py-2 bg-transparent outline-none focus:border-emerald-400 text-sm dash-subtitle"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold dash-muted mb-1.5">Descrição</label>
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Descrição curta (opcional)"
            className="w-full border border-gray-200 dark:border-white/[0.08] rounded-lg px-3 py-2 bg-transparent outline-none focus:border-emerald-400 text-sm dash-subtitle"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={submit}
        disabled={pending}
        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Criar produto no Stripe
      </button>
    </div>
  )
}
