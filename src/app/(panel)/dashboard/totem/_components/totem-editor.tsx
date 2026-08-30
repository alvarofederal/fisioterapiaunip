"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { ExternalLink, Copy, Check, Star, Monitor } from "lucide-react"
import type { SalvarTotemState } from "../_actions/salvar-totem"

type Layout = {
  id: string
  nome: string
  padrao: boolean
  corPrimaria: string
  corFundo: string
  corTexto: string
  corSecundaria: string
  imagem1Url: string | null
  imagem2Url: string | null
  opacidadeFundo: number
  brilho: number
  saturacao: number
  contraste: number
  raioCantos: number
  tamanhoCard: string
  estiloCard: string
}

type Loja = {
  id: string
  nome: string
  nomeExibicao: string | null
  logoUrl: string | null
  corPrimaria: string
  totemLayoutId: string | null
  totemTitulo: string | null
  totemSubtitulo: string | null
  totemLayout: { imagem1Url: string | null; corPrimaria: string } | null
}

function SaveBtn() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto dash-btn-primary text-sm px-6 py-2.5 rounded-xl disabled:opacity-50 transition-all"
    >
      {pending ? "Salvando..." : "Salvar configurações"}
    </button>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 dash-subtitle hover:text-emerald-500 transition-colors"
    >
      {copied
        ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copiado!</>
        : <><Copy className="w-3.5 h-3.5" /> Copiar link</>
      }
    </button>
  )
}

/* ── Preview do totem em miniatura ──────────────────────────────── */
function TotemPreview({
  loja,
  layout,
  titulo,
  subtitulo,
}: {
  loja: Loja
  layout: Layout | null
  titulo: string
  subtitulo: string
}) {
  const cor       = layout?.corPrimaria ?? loja.corPrimaria ?? "#10b981"
  const bgImage   = layout?.imagem1Url ?? layout?.imagem2Url ?? null
  const brilho    = layout?.brilho    ?? 100
  const saturacao = layout?.saturacao ?? 100
  const contraste = layout?.contraste ?? 100
  const nomeExibicao = loja.nomeExibicao ?? loja.nome

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ background: "#050505", aspectRatio: "9/16", width: "100%" }}
    >
      {/* BG image */}
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${bgImage})`,
            filter: `brightness(${brilho * 0.25 / 100}) saturate(${saturacao}%) contrast(${contraste}%)`,
            transform: "scale(1.05)",
          }}
        />
      )}

      {/* Ambient glow */}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse 70% 50% at 50% -10%, ${cor}22, transparent 60%)` }}
      />

      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${cor}, transparent)` }} />

      {/* Header */}
      <div
        className="absolute top-0 left-0 right-0 px-3 py-2.5 flex items-center gap-2"
        style={{ background: "rgba(5,5,5,0.75)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {loja.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={loja.logoUrl} alt="" className="w-6 h-6 rounded-lg object-cover flex-shrink-0" style={{ border: `1px solid ${cor}35` }} />
        ) : (
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black" style={{ background: `${cor}18`, color: cor }}>
            {nomeExibicao[0]}
          </div>
        )}
        <p className="text-white font-bold text-xs truncate leading-tight">{nomeExibicao}</p>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-3">
        <p className="text-white font-black text-center leading-tight text-sm mb-1" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
          {titulo || "Resgate seu benefício"}
        </p>
        <p className="text-center text-xs mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
          {subtitulo || "Digite ou escaneie o código"}
        </p>

        {/* Mock input */}
        <div
          className="w-full rounded-xl p-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          <div
            className="w-full rounded-lg px-2 py-2 font-mono text-xs text-center tracking-widest mb-2"
            style={{ background: "rgba(255,255,255,0.05)", border: `2px solid rgba(255,255,255,0.10)`, color: "rgba(255,255,255,0.35)" }}
          >
            XXXX-XXXX-XXXX-XXXX
          </div>
          <div
            className="w-full rounded-lg py-2 text-xs font-bold text-center"
            style={{ background: `linear-gradient(135deg, ${cor}, ${cor}cc)`, color: "#000" }}
          >
            Verificar código
          </div>
        </div>
      </div>

      {/* Powered by */}
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
          Powered by <span style={{ color: "#10b981" }}>fy</span>
        </p>
      </div>
    </div>
  )
}

/* ── Editor principal ────────────────────────────────────────────── */
export function TotemEditor({
  loja,
  layouts,
  totemUrl,
  action,
}: {
  loja: Loja
  layouts: Layout[]
  totemUrl: string
  action: (prev: SalvarTotemState, data: FormData) => Promise<SalvarTotemState>
}) {
  const [state, formAction] = useActionState<SalvarTotemState, FormData>(action, {})

  const [selectedLayoutId, setSelectedLayoutId] = useState(loja.totemLayoutId ?? "")
  const [titulo, setTitulo]       = useState(loja.totemTitulo    ?? "")
  const [subtitulo, setSubtitulo] = useState(loja.totemSubtitulo ?? "")

  const selectedLayout = layouts.find(l => l.id === selectedLayoutId) ?? null

  return (
    <div className="grid lg:grid-cols-5 gap-6">

      {/* ── Preview (sticky) ─────────────────────────── */}
      <div className="lg:col-span-2">
        <div className="sticky top-6 space-y-4">
          {/* Header da preview */}
          <div className="flex items-center gap-2 dash-muted">
            <Monitor className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-widest">Preview</span>
          </div>

          {/* Preview do totem */}
          <div className="max-w-[200px] mx-auto lg:mx-0">
            <TotemPreview
              loja={loja}
              layout={selectedLayout}
              titulo={titulo}
              subtitulo={subtitulo}
            />
          </div>

          {/* URL do totem */}
          <div className="dash-card p-4 space-y-2">
            <p className="text-xs font-semibold dash-title">Link do totem</p>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2 border border-gray-200 dark:border-white/10">
              <p className="text-xs dash-muted truncate flex-1 font-mono">{totemUrl}</p>
            </div>
            <div className="flex gap-2">
              <CopyBtn text={totemUrl} />
              <a
                href={totemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 dash-subtitle hover:text-emerald-500 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir
              </a>
            </div>
            <p className="text-xs dash-muted leading-relaxed">
              Exiba este link num tablet no balcão ou imprima um QR Code apontando para ele.
            </p>
          </div>
        </div>
      </div>

      {/* ── Editor ───────────────────────────────────── */}
      <div className="lg:col-span-3">
        <form action={formAction} className="space-y-6">

          {state.success && (
            <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 rounded-xl p-3 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              Configurações salvas com sucesso!
            </div>
          )}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              {state.error}
            </div>
          )}

          {/* ── Textos ── */}
          <div className="dash-card p-5 space-y-4">
            <h2 className="text-sm font-semibold dash-title">1. Textos da página</h2>

            <div>
              <label className="block text-sm font-medium dash-subtitle mb-1.5">
                Título principal
              </label>
              <input
                type="text"
                name="totemTitulo"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                maxLength={100}
                placeholder="Resgate seu benefício"
                className="w-full dash-input text-sm px-4 py-2.5 rounded-xl border"
              />
              <p className="text-xs dash-muted mt-1">Deixe em branco para usar o padrão.</p>
            </div>

            <div>
              <label className="block text-sm font-medium dash-subtitle mb-1.5">
                Subtítulo
              </label>
              <input
                type="text"
                name="totemSubtitulo"
                value={subtitulo}
                onChange={e => setSubtitulo(e.target.value)}
                maxLength={200}
                placeholder="Digite ou escaneie o código recebido"
                className="w-full dash-input text-sm px-4 py-2.5 rounded-xl border"
              />
            </div>
          </div>

          {/* ── Layout de fundo ── */}
          <div className="dash-card p-5 space-y-4">
            <h2 className="text-sm font-semibold dash-title">2. Visual de fundo</h2>
            <p className="text-xs dash-muted -mt-2">
              Escolha um dos seus layouts para definir as cores e a imagem de fundo do totem.
            </p>

            {layouts.length === 0 ? (
              <div className="text-sm dash-muted text-center py-4">
                Nenhum layout criado ainda.{" "}
                <a href="/dashboard/layout/novo" className="text-emerald-500 hover:text-emerald-400">Criar layout →</a>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Opção: sem layout (padrão) */}
                <button
                  type="button"
                  onClick={() => setSelectedLayoutId("")}
                  className={`w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                    selectedLayoutId === ""
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                      : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-900 flex-shrink-0 border border-black/5 dark:border-white/10 flex items-center justify-center">
                    <span className="text-xs text-gray-400">—</span>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${selectedLayoutId === "" ? "text-emerald-700 dark:text-emerald-400" : "dash-title"}`}>
                      Padrão do sistema
                    </p>
                    <p className="text-xs dash-muted">Fundo escuro com cor da loja</p>
                  </div>
                </button>

                {/* Layouts da loja */}
                {layouts.map(l => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setSelectedLayoutId(l.id)}
                    className={`w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                      selectedLayoutId === l.id
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                        : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                    }`}
                  >
                    {/* Swatch — imagem ou cor */}
                    <div
                      className="w-8 h-8 rounded-lg flex-shrink-0 border border-black/5 dark:border-white/10 bg-cover bg-center"
                      style={l.imagem1Url
                        ? { backgroundImage: `url(${l.imagem1Url})` }
                        : { backgroundColor: l.corPrimaria }
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${selectedLayoutId === l.id ? "text-emerald-700 dark:text-emerald-400" : "dash-title"}`}>
                        {l.nome} {l.padrao && <Star className="w-3 h-3 inline text-amber-400 fill-amber-400" />}
                      </p>
                      <p className="text-xs dash-muted">{l.imagem1Url ? "Com imagem de fundo" : "Fundo colorido"}</p>
                    </div>

                    {/* Cores */}
                    <div className="flex gap-1 flex-shrink-0">
                      {[l.corPrimaria, l.corFundo].map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <input type="hidden" name="totemLayoutId" value={selectedLayoutId} />
          </div>

          <div className="flex justify-end">
            <SaveBtn />
          </div>
        </form>
      </div>
    </div>
  )
}
