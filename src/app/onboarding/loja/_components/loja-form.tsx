"use client"

import { useActionState, useState, useRef } from "react"
import { Loader2, Upload, X, ImageIcon } from "lucide-react"
import { criarLoja } from "../_actions/criar-loja"

/* ─── preset colors ───────────────────────────────────────────── */
const PRESETS = [
  { hex: "#10b981" }, { hex: "#3b82f6" }, { hex: "#f59e0b" },
  { hex: "#ef4444" }, { hex: "#8b5cf6" }, { hex: "#ec4899" },
  { hex: "#f97316" }, { hex: "#06b6d4" },
]

const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"]

/* ─── mini preview da tela do cliente ────────────────────────── */
function ClientPreview({ nome, logoUrl, cor }: { nome: string; logoUrl: string; cor: string }) {
  const exibicao = nome.trim() || "Sua Loja"
  const inicial  = exibicao[0]?.toUpperCase() ?? "L"

  return (
    <div className="w-full rounded-2xl overflow-hidden"
      style={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${cor}, transparent)` }} />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.5)" }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
            style={{ border: `1px solid ${cor}40` }} />
        ) : (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
            style={{ background: `${cor}22`, border: `1px solid ${cor}40` }}>
            {inicial}
          </div>
        )}
        <div>
          <p className="text-white text-xs font-bold leading-tight">{exibicao}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>Cortesia exclusiva</p>
        </div>
      </div>

      {/* Benefit card */}
      <div className="px-3 pt-3 pb-3 space-y-2">
        <div className="rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="px-3 pt-3 pb-2 text-center"
            style={{ background: `linear-gradient(160deg, ${cor}15, ${cor}04)` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: cor }}>
              Desconto especial
            </p>
            <p className="text-2xl font-black text-white mb-0.5">20% OFF</p>
            <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.70)" }}>Campanha de Verão</p>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <code className="font-mono text-[11px] font-bold" style={{ color: cor }}>ABCD-EFGH-IJKL-MNOP</code>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.30)" }}>30 dias</span>
          </div>
        </div>
        <button type="button" className="w-full py-2.5 rounded-xl text-xs font-bold"
          style={{ background: `linear-gradient(135deg, ${cor}, ${cor}bb)`, color: "#000" }}>
          Ativar minha chave
        </button>
      </div>

      <p className="text-center text-[10px] pb-2.5" style={{ color: "rgba(255,255,255,0.18)" }}>
        Powered by <span style={{ color: "rgba(255,255,255,0.28)" }}>Courtesyfy</span>
      </p>
    </div>
  )
}

/* ─── Logo Uploader ───────────────────────────────────────────── */
function LogoUploader({
  value,
  cor,
  onChange,
}: {
  value: string
  cor: string
  onChange: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Selecione uma imagem (JPG, PNG ou WEBP).")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Imagem muito grande. Máximo 5 MB.")
      return
    }

    setUploading(true)
    setError("")

    const fd = new FormData()
    fd.append("file", file)

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro no upload")
      onChange(data.imageUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar imagem.")
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  if (value) {
    return (
      <div className="relative w-24 h-24 group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Logo da loja"
          className="w-24 h-24 rounded-2xl object-cover"
          style={{ border: `2px solid ${cor}60` }}
        />
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgba(239,68,68,0.9)" }}
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    )
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex flex-col items-center justify-center gap-2 w-24 h-24 rounded-2xl cursor-pointer transition-all"
        style={{
          background: uploading ? `${cor}10` : "rgba(255,255,255,0.04)",
          border: `1.5px dashed ${uploading ? cor : "rgba(255,255,255,0.18)"}`,
        }}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: cor }} />
        ) : (
          <>
            <div className="flex flex-col items-center gap-1">
              <ImageIcon className="w-5 h-5" style={{ color: "rgba(255,255,255,0.35)" }} />
              <Upload className="w-3 h-3" style={{ color: "rgba(255,255,255,0.25)" }} />
            </div>
            <span className="text-[10px] text-center leading-tight" style={{ color: "rgba(255,255,255,0.30)" }}>
              Logo
            </span>
          </>
        )}
      </div>
      {error && (
        <p className="text-[11px] mt-1.5 text-red-400">{error}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}

/* ─── helpers de estilo ───────────────────────────────────────── */
const inp = (focused: boolean): React.CSSProperties => ({
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: `1px solid ${focused ? "rgba(16,185,129,0.55)" : "rgba(255,255,255,0.10)"}`,
  borderRadius: "10px",
  padding: "10px 12px",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.2s",
})

const lbl: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  marginBottom: "5px",
  color: "rgba(255,255,255,0.40)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
}

/* ─── form ───────────────────────────────────────────────────── */
type State = { error?: string }

export function LojaForm() {
  const [state, action, pending] = useActionState(
    async (_prev: State, fd: FormData) => (await criarLoja(fd)) ?? {},
    {} as State,
  )

  const [nome,       setNome]       = useState("")
  const [logoUrl,    setLogoUrl]    = useState("")
  const [cor,        setCor]        = useState("#10b981")
  const [focused,    setFocused]    = useState<string | null>(null)
  const [customOpen, setCustomOpen] = useState(false)

  const f = (id: string) => ({
    onFocus: () => setFocused(id),
    onBlur:  () => setFocused(null),
    style:   inp(focused === id),
  })

  return (
    <div className="flex flex-col lg:flex-row gap-10">

      {/* ── Formulário ── */}
      <div className="flex-1 min-w-0">
        {state.error && (
          <div className="rounded-xl p-3 mb-4 text-sm text-center"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", color: "#fca5a5" }}>
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <input type="hidden" name="corPrimaria" value={cor} />
          <input type="hidden" name="logoUrl" value={logoUrl} />

          {/* Logo + Nome de exibição side by side */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <label style={lbl}>Logo</label>
              <LogoUploader value={logoUrl} cor={cor} onChange={setLogoUrl} />
            </div>
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <label style={lbl}>Nome interno *</label>
                <input name="nome" required placeholder="Ex: Cafeteria Central"
                  value={nome} onChange={e => setNome(e.target.value)} {...f("nome")} />
              </div>
              <div>
                <label style={lbl}>Nome de exibição</label>
                <input name="nomeExibicao" placeholder="Como aparece ao cliente" {...f("exib")} />
              </div>
            </div>
          </div>

          <div>
            <label style={lbl}>Email comercial *</label>
            <input name="email" type="email" required placeholder="contato@sualoja.com.br" {...f("email")} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label style={lbl}>Telefone</label>
              <input name="telefone" placeholder="(11) 99999-9999" {...f("tel")} />
            </div>
            <div>
              <label style={lbl}>CNPJ / CPF</label>
              <input name="cnpjCpf" placeholder="00.000.000/0001-00" {...f("cnpj")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label style={lbl}>Cidade</label>
              <input name="cidade" placeholder="São Paulo" {...f("cidade")} />
            </div>
            <div>
              <label style={lbl}>UF</label>
              <select name="estado" onFocus={() => setFocused("uf")} onBlur={() => setFocused(null)}
                style={{ ...inp(focused === "uf"), padding: "9px 10px" }}>
                <option value="">—</option>
                {UFS.map(uf => <option key={uf} value={uf} style={{ background: "#111", color: "#fff" }}>{uf}</option>)}
              </select>
            </div>
          </div>

          {/* Cor de marca */}
          <div>
            <label style={lbl}>Cor de marca</label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map(p => (
                <button key={p.hex} type="button" onClick={() => setCor(p.hex)}
                  className="w-7 h-7 rounded-full transition-all hover:scale-110 flex-shrink-0"
                  style={{ background: p.hex, outline: cor === p.hex ? "2px solid white" : "none", outlineOffset: "2px" }} />
              ))}
              <button type="button" onClick={() => setCustomOpen(v => !v)}
                className="w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ borderColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.05)" }}>
                +
              </button>
              {customOpen && (
                <div className="flex items-center gap-2">
                  <input type="color" value={cor} onChange={e => setCor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0" style={{ padding: 0, background: "transparent" }} />
                  <span className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>{cor}</span>
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={pending}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-black transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 mt-2"
            style={{ background: `linear-gradient(135deg, ${cor}, ${cor}cc)`, boxShadow: `0 0 28px ${cor}45` }}>
            {pending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando loja...</>
              : "Criar loja e entrar →"}
          </button>
        </form>
      </div>

      {/* ── Preview (desktop) ── */}
      <div className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: "rgba(255,255,255,0.28)" }}>
          Como o cliente vai ver
        </p>
        <ClientPreview nome={nome} logoUrl={logoUrl} cor={cor} />
      </div>

      {/* ── Preview (mobile) ── */}
      <div className="lg:hidden">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center"
          style={{ color: "rgba(255,255,255,0.28)" }}>
          Como o cliente vai ver
        </p>
        <ClientPreview nome={nome} logoUrl={logoUrl} cor={cor} />
      </div>

    </div>
  )
}
