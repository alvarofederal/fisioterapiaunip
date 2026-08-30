import { notFound } from "next/navigation"
import { db } from "@/lib/prisma"
import { TotemForm } from "./_components/totem-form"
import Link from "next/link"

type SearchParams = { codigo?: string }

export default async function TotemPage({
  params,
  searchParams,
}: {
  params: Promise<{ lojaId: string }>
  searchParams: Promise<SearchParams>
}) {
  const { lojaId } = await params
  const { codigo } = await searchParams

  const loja = await db.loja.findUnique({
    where: { id: lojaId },
    select: {
      nome: true,
      nomeExibicao: true,
      logoUrl: true,
      corPrimaria: true,
      status: true,
      totemTitulo: true,
      totemSubtitulo: true,
      totemLayout: {
        select: {
          imagem1Url: true,
          imagem2Url: true,
          corPrimaria: true,
          corFundo: true,
          opacidadeFundo: true,
          brilho: true,
          saturacao: true,
          contraste: true,
        },
      },
    },
  })

  if (!loja || loja.status !== "ATIVA") notFound()

  const cor          = loja.totemLayout?.corPrimaria ?? loja.corPrimaria ?? "#10b981"
  const nomeExibicao = loja.nomeExibicao ?? loja.nome
  const bgImage      = loja.totemLayout?.imagem1Url ?? loja.totemLayout?.imagem2Url ?? null
  const brilho       = loja.totemLayout?.brilho     ?? 100
  const saturacao    = loja.totemLayout?.saturacao   ?? 100
  const contraste    = loja.totemLayout?.contraste   ?? 100
  const titulo       = loja.totemTitulo    ?? "Resgate seu benefício"
  const subtitulo    = loja.totemSubtitulo ?? "Digite ou escaneie o código recebido"

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#050505" }}>

      {/* ── Background image ─────────────────────────────────────── */}
      {bgImage && (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${bgImage})`,
            filter: `brightness(${brilho * 0.25 / 100}) saturate(${saturacao}%) contrast(${contraste}%)`,
            transform: "scale(1.05)",
          }}
        />
      )}

      {/* ── Ambient glow ─────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% -10%, ${cor}22, transparent 60%)`,
        }}
      />

      {/* ── Thin accent bar at top ──────────────────────────────── */}
      <div
        className="relative z-10 h-0.5 w-full flex-shrink-0"
        style={{ background: `linear-gradient(90deg, transparent, ${cor}, transparent)` }}
      />

      {/* ── Header ───────────────────────────────────────────────── */}
      <header
        className="relative z-10 flex-shrink-0 px-5 py-4 flex items-center gap-3"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(5,5,5,0.75)",
          backdropFilter: "blur(16px)",
        }}
      >
        {loja.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={loja.logoUrl}
            alt={nomeExibicao}
            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
            style={{ border: `1px solid ${cor}35` }}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-lg"
            style={{ background: `${cor}18`, border: `1px solid ${cor}30`, color: cor }}
          >
            {nomeExibicao[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-white leading-tight truncate">{nomeExibicao}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Ponto de resgate</p>
        </div>
        <span className="text-xs font-semibold hidden sm:block" style={{ color: "rgba(255,255,255,0.18)" }}>
          <span style={{ color: "rgba(255,255,255,0.28)" }}>Courtesy</span>
          <span style={{ color: "#10b981" }}>fy</span>
        </span>
      </header>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">

        {/* Hero text */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
            {titulo}
          </h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "rgba(255,255,255,0.45)" }}>
            {subtitulo}
          </p>
        </div>

        {/* Form card */}
        <div
          className="w-full max-w-md rounded-3xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: `0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}
        >
          <TotemForm
            lojaId={lojaId}
            corPrimaria={cor}
            codigoInicial={codigo}
          />
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="relative z-10 text-center py-5 flex-shrink-0">
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
          Powered by{" "}
          <Link href="/" className="font-semibold" style={{ color: "rgba(255,255,255,0.28)" }}>
            <span>Courtesy</span><span style={{ color: "#10b981" }}>fy</span>
          </Link>
        </p>
      </footer>
    </div>
  )
}
