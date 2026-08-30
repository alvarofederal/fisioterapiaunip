"use client"

import { useState, useTransition } from "react"
import {
  Check, X, Pencil, Trash2, ChevronDown, ChevronUp,
  Copy, CheckCheck, Plus, Loader2, Tag,
} from "lucide-react"
import {
  atualizarProduto, arquivarProduto,
  atualizarNicknamePreco, arquivarPreco, criarPreco,
} from "../_actions"

// ─── Types ────────────────────────────────────────────────────────
interface Preco {
  id: string
  nickname: string | null
  amount: number
  currency: string
  type: "one_time" | "recurring"
  interval?: string | null
  active: boolean
}

interface Produto {
  id: string
  name: string
  description: string | null
  active: boolean
  precos: Preco[]
}

// ─── Helpers ──────────────────────────────────────────────────────
function fmtCents(amount: number, currency: string) {
  return (amount / 100).toLocaleString("pt-BR", { style: "currency", currency: currency.toUpperCase() })
}

function CopyId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="inline-flex items-center gap-1 text-xs font-mono text-gray-400 hover:text-emerald-500 transition-colors">
      <code className="truncate max-w-[160px]">{value}</code>
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
    </button>
  )
}

// ─── Editable field ───────────────────────────────────────────────
function EditableField({
  value, placeholder, onSave, className = "",
}: {
  value: string; placeholder?: string; onSave: (v: string) => Promise<void>; className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [pending, startTransition] = useTransition()

  function cancel() { setDraft(value); setEditing(false) }
  function save() {
    if (draft === value) { setEditing(false); return }
    startTransition(async () => {
      await onSave(draft)
      setEditing(false)
    })
  }

  if (!editing) {
    return (
      <span
        className={`group/ef inline-flex items-center gap-1.5 cursor-pointer hover:opacity-80 ${className}`}
        onClick={() => setEditing(true)}
      >
        <span>{value || <em className="text-gray-400 not-italic">{placeholder}</em>}</span>
        <Pencil className="w-3 h-3 opacity-0 group-hover/ef:opacity-40 transition-opacity flex-shrink-0" />
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel() }}
        className="border border-emerald-400 rounded px-1.5 py-0.5 text-sm bg-white dark:bg-zinc-900 outline-none"
      />
      <button onClick={save} disabled={pending} className="text-emerald-500 hover:text-emerald-600 disabled:opacity-40">
        {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      </button>
      <button onClick={cancel} className="text-gray-400 hover:text-red-400">
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  )
}

// ─── Preço row ────────────────────────────────────────────────────
function PrecoRow({ preco, produtoId }: { preco: Preco; produtoId: string }) {
  const [archiving, startArchive] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  async function salvarNickname(nick: string) {
    const res = await atualizarNicknamePreco(preco.id, nick)
    if (res.error) setMsg(res.error)
  }

  function archive() {
    if (!confirm(`Arquivar preço ${preco.id}? Ele não poderá mais ser usado.`)) return
    startArchive(async () => {
      const res = await arquivarPreco(preco.id)
      if (res.error) setMsg(res.error)
    })
  }

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.03] group/row text-sm">
      {/* Nickname */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <Tag className="w-3.5 h-3.5 text-gray-300 dark:text-white/20 flex-shrink-0" />
        <EditableField
          value={preco.nickname ?? ""}
          placeholder="Sem nickname"
          onSave={salvarNickname}
          className="dash-subtitle"
        />
      </div>

      {/* Valor */}
      <span className="font-semibold dash-title text-right whitespace-nowrap">
        {fmtCents(preco.amount, preco.currency)}
        {preco.type === "recurring" && preco.interval && (
          <span className="text-xs font-normal dash-muted ml-1">/{preco.interval === "month" ? "mês" : "ano"}</span>
        )}
      </span>

      {/* ID */}
      <div className="hidden sm:block">
        <CopyId value={preco.id} />
      </div>

      {/* Badge tipo */}
      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
        preco.type === "recurring"
          ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"
          : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
      }`}>
        {preco.type === "recurring" ? "Recorrente" : "Único"}
      </span>

      {/* Arquivar */}
      <button
        onClick={archive}
        disabled={archiving}
        className="opacity-0 group-hover/row:opacity-100 text-gray-300 hover:text-red-400 transition-all disabled:opacity-40"
        title="Arquivar preço"
      >
        {archiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>

      {msg && <p className="text-xs text-red-500">{msg}</p>}
    </div>
  )
}

// ─── Novo preço form ─────────────────────────────────────────────
function NovoPrecoForm({ produtoId, onClose }: { produtoId: string; onClose: () => void }) {
  const [amount, setAmount]     = useState("")
  const [nick, setNick]         = useState("")
  const [type, setType]         = useState<"one_time" | "recurring">("one_time")
  const [interval, setInterval] = useState<"month" | "year">("month")
  const [newId, setNewId]       = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit() {
    const cents = Math.round(parseFloat(amount.replace(",", ".")) * 100)
    if (!cents || cents <= 0) { setError("Valor inválido"); return }
    setError(null)
    startTransition(async () => {
      const res = await criarPreco(produtoId, {
        amount: cents,
        currency: "brl",
        recurring: type === "recurring",
        interval: type === "recurring" ? interval : undefined,
        nickname: nick || undefined,
      })
      if (res.error) setError(res.error)
      else if ("priceId" in res) setNewId(res.priceId!)
    })
  }

  if (newId) {
    return (
      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-sm">
        <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Preço criado!</p>
        <p className="text-xs dash-muted mb-2">Copie o ID abaixo e adicione ao <code className="bg-white/50 dark:bg-black/20 px-1 rounded">.env</code></p>
        <CopyId value={newId} />
        <button onClick={onClose} className="mt-3 text-xs text-emerald-600 hover:underline block">Fechar</button>
      </div>
    )
  }

  return (
    <div className="p-3 rounded-lg border border-dashed border-gray-200 dark:border-white/[0.08] space-y-2 text-sm">
      <div className="flex gap-2">
        <input
          placeholder="Valor (ex: 99.90)"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="flex-1 border border-gray-200 dark:border-white/[0.08] rounded px-2 py-1.5 bg-transparent outline-none focus:border-emerald-400 text-sm"
        />
        <input
          placeholder="Nickname (opcional)"
          value={nick}
          onChange={e => setNick(e.target.value)}
          className="flex-1 border border-gray-200 dark:border-white/[0.08] rounded px-2 py-1.5 bg-transparent outline-none focus:border-emerald-400 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <select
          value={type}
          onChange={e => setType(e.target.value as any)}
          className="border border-gray-200 dark:border-white/[0.08] rounded px-2 py-1.5 bg-transparent text-sm outline-none focus:border-emerald-400 dash-subtitle"
        >
          <option value="one_time">Pagamento único</option>
          <option value="recurring">Recorrente</option>
        </select>
        {type === "recurring" && (
          <select
            value={interval}
            onChange={e => setInterval(e.target.value as any)}
            className="border border-gray-200 dark:border-white/[0.08] rounded px-2 py-1.5 bg-transparent text-sm outline-none focus:border-emerald-400 dash-subtitle"
          >
            <option value="month">Mensal</option>
            <option value="year">Anual</option>
          </select>
        )}
        <button
          onClick={submit}
          disabled={pending}
          className="ml-auto flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Criar
        </button>
        <button onClick={onClose} className="text-gray-400 hover:text-red-400">
          <X className="w-4 h-4" />
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Produto Card ─────────────────────────────────────────────────
export function ProdutoCard({ produto }: { produto: Produto }) {
  const [expanded, setExpanded]       = useState(false)
  const [showNovoPreco, setNovoPreco] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [archiving, startArchive]     = useTransition()

  async function salvarNome(nome: string) {
    const res = await atualizarProduto(produto.id, { nome })
    if (res.error) setError(res.error)
  }

  async function salvarDescricao(descricao: string) {
    const res = await atualizarProduto(produto.id, { descricao })
    if (res.error) setError(res.error)
  }

  function archive() {
    if (!confirm(`Arquivar produto "${produto.name}"? Todos os preços serão desativados.`)) return
    startArchive(async () => {
      const res = await arquivarProduto(produto.id)
      if (res.error) setError(res.error)
    })
  }

  const precosAtivos = produto.precos.filter(p => p.active)

  return (
    <div className="dash-card overflow-hidden">
      {/* Header do produto */}
      <div className="p-5 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Nome */}
          <div className="flex items-center gap-2 mb-1">
            <EditableField
              value={produto.name}
              placeholder="Nome do produto"
              onSave={salvarNome}
              className="text-base font-bold dash-title"
            />
          </div>

          {/* Descrição */}
          <EditableField
            value={produto.description ?? ""}
            placeholder="Adicionar descrição..."
            onSave={salvarDescricao}
            className="text-sm dash-muted"
          />

          {/* ID + badges */}
          <div className="flex items-center gap-3 mt-2">
            <CopyId value={produto.id} />
            <span className="text-xs dash-muted">
              {precosAtivos.length} preço{precosAtivos.length !== 1 ? "s" : ""} ativo{precosAtivos.length !== 1 ? "s" : ""}
            </span>
          </div>

          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={archive}
            disabled={archiving}
            title="Arquivar produto"
            className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            {archiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs dash-muted hover:text-emerald-500 transition-colors border border-gray-200 dark:border-white/[0.08] rounded-lg px-2 py-1"
          >
            Preços
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Preços */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-white/[0.06] px-4 py-3 space-y-1 bg-gray-50/50 dark:bg-white/[0.01]">
          {precosAtivos.length === 0 && (
            <p className="text-xs dash-muted px-1 py-2">Nenhum preço ativo.</p>
          )}
          {precosAtivos.map(p => (
            <PrecoRow key={p.id} preco={p} produtoId={produto.id} />
          ))}

          {/* Novo preço */}
          {showNovoPreco ? (
            <NovoPrecoForm produtoId={produto.id} onClose={() => setNovoPreco(false)} />
          ) : (
            <button
              onClick={() => setNovoPreco(true)}
              className="flex items-center gap-1.5 text-xs dash-muted hover:text-emerald-500 transition-colors mt-1 px-2 py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar preço
            </button>
          )}
        </div>
      )}
    </div>
  )
}
