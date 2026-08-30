import { notFound } from "next/navigation"
import { db } from "@/lib/prisma"
import { AtivacaoForm } from "./_components/ativacao-form"
import Link from "next/link"

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysDiff(to: Date) {
  return Math.ceil((to.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function buildBenefitLabel(
  tipo: string,
  valor: unknown,
  premio: string | null,
): { label: string; destaque: string } {
  if (tipo === "DESCONTO_PERCENTUAL" && valor)
    return { label: "Desconto especial", destaque: `${valor}% OFF` }
  if (tipo === "DESCONTO_FIXO" && valor)
    return { label: "Desconto especial", destaque: `R$ ${Number(valor).toFixed(2)} OFF` }
  if (tipo === "CASHBACK" && valor)
    return { label: "Cashback", destaque: `${valor}% de volta` }
  if (tipo === "FRETE_GRATIS")
    return { label: "Frete Grátis", destaque: "🚚 Frete grátis" }
  if (premio)
    return { label: tipo === "SORTEIO" ? "Sorteio" : "Brinde", destaque: premio }
  return { label: tipo.replace(/_/g, " ").toLowerCase(), destaque: "" }
}

/** Returns a hex luminance [0–1] for simple light/dark detection */
function luminance(hex: string): number {
  const c = hex.replace("#", "")
  const r = parseInt(c.slice(0, 2), 16) / 255
  const g = parseInt(c.slice(2, 4), 16) / 255
  const b = parseInt(c.slice(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function imgFilter(b: number, s: number, c: number) {
  return `brightness(${b}%) saturate(${s}%) contrast(${c}%)`
}

// ─── theme builder ────────────────────────────────────────────────────────────

type Layout = {
  corPrimaria:    string
  corFundo:       string
  corTexto:       string
  corSecundaria:  string
  imagem1Url:     string | null
  opacidadeFundo: number
  brilho:         number
  saturacao:      number
  contraste:      number
  estiloCard:     string
  raioCantos:     number
}

function buildTheme(layout: Layout | null, lojaCorPrimaria: string) {
  const isNeon = layout?.estiloCard === "NEON"

  if (!layout) {
    return {
      bgColor:      "#050505",
      accentColor:  lojaCorPrimaria,
      textColor:    "#ffffff",
      mutedColor:   "rgba(255,255,255,0.40)",
      subtleColor:  "rgba(255,255,255,0.15)",
      bgImage:      null,
      bgOpacity:    20,
      imgFilter:    "brightness(100%) saturate(100%) contrast(100%)",
      raioCantos:   24,
      dark:         true,
      glassBg:      "rgba(255,255,255,0.03)",
      glassBorder:  "rgba(255,255,255,0.07)",
      headerBg:     "rgba(5,5,5,0.80)",
      headerBorder: "rgba(255,255,255,0.06)",
    }
  }

  const dark = isNeon || luminance(layout.corFundo) < 0.22
  const mutedColor   = dark ? "rgba(255,255,255,0.40)" : layout.corTexto + "99"
  const subtleColor  = dark ? "rgba(255,255,255,0.15)" : layout.corTexto + "44"
  const glassBg      = dark ? "rgba(255,255,255,0.03)" : layout.corTexto + "08"
  const glassBorder  = dark ? "rgba(255,255,255,0.07)" : layout.corTexto + "18"
  const headerBg     = dark ? "rgba(5,5,5,0.80)" : layout.corFundo + "ee"
  const headerBorder = dark ? "rgba(255,255,255,0.06)" : layout.corTexto + "14"
  const bgColor      = isNeon ? "#0a0a0a" : layout.corFundo

  return {
    bgColor,
    accentColor:  layout.corPrimaria,
    textColor:    dark ? "#ffffff" : layout.corTexto,
    mutedColor,
    subtleColor,
    bgImage:      layout.imagem1Url,
    bgOpacity:    layout.opacidadeFundo,
    imgFilter:    imgFilter(layout.brilho, layout.saturacao, layout.contraste),
    raioCantos:   layout.raioCantos,
    dark,
    glassBg,
    glassBorder,
    headerBg,
    headerBorder,
  }
}

// ─── Status screen ────────────────────────────────────────────────────────────

function StatusScreen({
  icon,
  title,
  message,
  theme,
}: {
  icon: React.ReactNode
  title: string
  message: string
  theme: ReturnType<typeof buildTheme>
}) {
  const { bgColor, accentColor, textColor, mutedColor, subtleColor, glassBg, glassBorder, bgImage, bgOpacity, imgFilter: flt } = theme
  return (
    <div className="min-h-screen flex flex-col" style={{ background: bgColor, color: textColor }}>
      {/* Background image */}
      {bgImage && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none"
          style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center", opacity: bgOpacity / 100, filter: flt }}
        />
      )}
      {/* Accent bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div
          className="w-full max-w-sm rounded-3xl p-8 text-center"
          style={{ background: glassBg, border: `1px solid ${glassBorder}`, boxShadow: "0 24px 48px rgba(0,0,0,0.3)" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: `${accentColor}14`, border: `1px solid ${accentColor}30` }}
          >
            {icon}
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: textColor }}>{title}</h2>
          <p className="text-sm leading-relaxed" style={{ color: mutedColor }}>{message}</p>
        </div>
      </div>

      <p className="text-center text-xs py-4 relative z-10" style={{ color: subtleColor }}>
        Powered by{" "}
        <Link href="/" className="font-semibold" style={{ color: mutedColor }}>
          Courtesyfy
        </Link>
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ChaveLandingPage({
  params,
}: {
  params: Promise<{ codigo: string }>
}) {
  const { codigo } = await params

  const chave = await db.chave.findUnique({
    where: { codigo },
    include: {
      campanha: {
        select: {
          nome: true,
          descricao: true,
          tipoBeneficio: true,
          valorBeneficio: true,
          descricaoPremio: true,
          regrasUso: true,
          expiraEm: true,
          status: true,
          layout: {
            select: {
              corPrimaria:    true,
              corFundo:       true,
              corTexto:       true,
              corSecundaria:  true,
              imagem1Url:     true,
              opacidadeFundo: true,
              brilho:         true,
              saturacao:      true,
              contraste:      true,
              estiloCard:     true,
              raioCantos:     true,
            },
          },
        },
      },
      loja: {
        select: {
          nome:          true,
          nomeExibicao:  true,
          logoUrl:       true,
          corPrimaria:   true,
          siteUrl:       true,
          totemLayoutId: true,
          // Fallback: default layout of the loja
          layouts: {
            where:   { padrao: true },
            take:    1,
            select: {
              corPrimaria:    true,
              corFundo:       true,
              corTexto:       true,
              corSecundaria:  true,
              imagem1Url:     true,
              opacidadeFundo: true,
              brilho:         true,
              saturacao:      true,
              contraste:      true,
              estiloCard:     true,
              raioCantos:     true,
            },
          },
        },
      },
    },
  })

  if (!chave) notFound()

  const nomeExibicao = chave.loja.nomeExibicao ?? chave.loja.nome
  const campanha     = chave.campanha

  // Layout priority: campaign layout → loja default layout → null (fallback)
  const activeLayout: Layout | null =
    campanha.layout ?? chave.loja.layouts[0] ?? null

  const theme  = buildTheme(activeLayout, chave.loja.corPrimaria ?? "#10b981")
  const { bgColor, accentColor, textColor, mutedColor, subtleColor, glassBg, glassBorder, headerBg, headerBorder, raioCantos, dark, bgImage, bgOpacity, imgFilter: flt } = theme

  /* ── Status screens ── */
  if (campanha.status === "ENCERRADA" || campanha.status === "CANCELADA") {
    return (
      <StatusScreen theme={theme}
        icon={
          <svg className="w-8 h-8" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        title="Campanha encerrada"
        message="Esta campanha não está mais disponível."
      />
    )
  }

  if (new Date() > campanha.expiraEm) {
    return (
      <StatusScreen theme={theme}
        icon={
          <svg className="w-8 h-8" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        title="Chave expirada"
        message={`Esta chave era válida até ${new Date(campanha.expiraEm).toLocaleDateString("pt-BR")}.`}
      />
    )
  }

  if (chave.status === "RESGATADA") {
    return (
      <StatusScreen theme={theme}
        icon={
          <svg className="w-8 h-8" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        }
        title="Benefício já utilizado"
        message="Este benefício já foi resgatado. Obrigado por participar!"
      />
    )
  }

  if (chave.status === "EXPIRADA" || chave.status === "CANCELADA") {
    return (
      <StatusScreen theme={theme}
        icon={
          <svg className="w-8 h-8" style={{ color: "#ef4444" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        }
        title="Chave inválida"
        message="Esta chave não é mais válida."
      />
    )
  }

  /* ── Marcar como CONSULTADA ── */
  if (chave.status === "GERADA") {
    await db.chave.update({ where: { id: chave.id }, data: { status: "CONSULTADA" } })
    await db.logEvento.create({
      data: { tipoEvento: "CHAVE_CONSULTADA", chaveId: chave.id, campanhaId: chave.campanhaId, lojaId: chave.lojaId, canal: "WEB" },
    })
  }

  const jaAtivada = chave.status === "ATIVADA"
  const diasRestantes = daysDiff(campanha.expiraEm)
  const { label: beneficioLabel, destaque } = buildBenefitLabel(
    campanha.tipoBeneficio,
    campanha.valorBeneficio,
    campanha.descricaoPremio,
  )

  const cardRadius = Math.max(raioCantos, 12)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bgColor, color: textColor }}>

      {/* Background image layer */}
      {bgImage && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: bgOpacity / 100,
            filter: flt,
          }}
        />
      )}

      {/* Ambient glow from accent color */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${accentColor}18, transparent 60%)` }}
      />

      {/* Header */}
      <header
        className="relative z-10 px-5 py-4 flex items-center gap-3"
        style={{
          borderBottom: `1px solid ${headerBorder}`,
          backdropFilter: "blur(12px)",
          background: headerBg,
        }}
      >
        {chave.loja.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={chave.loja.logoUrl}
            alt={nomeExibicao}
            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
            style={{ border: `1px solid ${accentColor}30` }}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg"
            style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}35`, color: accentColor }}
          >
            {nomeExibicao[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm leading-tight truncate" style={{ color: textColor }}>{nomeExibicao}</p>
          <p className="text-xs" style={{ color: mutedColor }}>Cortesia exclusiva</p>
        </div>
        {/* Courtesyfy branding */}
        <span className="text-xs font-semibold hidden sm:block" style={{ color: subtleColor }}>
          <span>Courtesy</span>
          <span style={{ color: "#10b981" }}>fy</span>
        </span>
      </header>

      <main className="flex-1 max-w-sm mx-auto w-full px-4 py-6 space-y-4 relative z-10">

        {/* Benefit card */}
        <div
          className="overflow-hidden"
          style={{
            borderRadius: cardRadius,
            background: glassBg,
            border: `1px solid ${glassBorder}`,
            boxShadow: `0 0 40px ${accentColor}12`,
          }}
        >
          {/* Benefit highlight */}
          <div
            className="px-6 pt-7 pb-6 text-center"
            style={{ background: `linear-gradient(160deg, ${accentColor}15 0%, ${accentColor}05 100%)` }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: accentColor }}
            >
              {beneficioLabel}
            </p>
            {destaque && (
              <p className="text-5xl font-black mb-2 leading-tight" style={{ color: textColor }}>
                {destaque}
              </p>
            )}
            <p className="text-base font-semibold" style={{ color: dark ? "rgba(255,255,255,0.80)" : textColor }}>
              {campanha.nome}
            </p>
            {campanha.descricao && (
              <p className="text-sm mt-1.5" style={{ color: mutedColor }}>
                {campanha.descricao}
              </p>
            )}
          </div>

          {/* Code + validity */}
          <div
            className="px-6 py-4 flex items-center justify-between gap-3"
            style={{ borderTop: `1px solid ${glassBorder}` }}
          >
            <div>
              <p className="text-xs mb-0.5" style={{ color: mutedColor }}>Código</p>
              <code className="font-mono text-base font-bold tracking-widest" style={{ color: accentColor }}>
                {codigo}
              </code>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs mb-0.5" style={{ color: mutedColor }}>Válido por</p>
              <p className="text-sm font-semibold" style={{ color: textColor }}>
                {diasRestantes === 1 ? "1 dia" : `${diasRestantes} dias`}
              </p>
            </div>
          </div>

          {jaAtivada && (
            <div className="px-6 pb-5 text-center">
              <span
                className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full"
                style={{ background: `${accentColor}14`, color: accentColor, border: `1px solid ${accentColor}28` }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
                Ativada — pronta para resgatar
              </span>
            </div>
          )}
        </div>

        {/* Action panel */}
        <div
          style={{
            borderRadius: cardRadius,
            padding: "1.5rem",
            background: glassBg,
            border: `1px solid ${glassBorder}`,
          }}
        >
          {jaAtivada ? (
            <div className="text-center space-y-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ background: `${accentColor}14`, border: `1px solid ${accentColor}28` }}
              >
                <svg className="w-7 h-7" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-lg" style={{ color: textColor }}>Pronto para resgatar!</p>
                <p className="text-sm mt-1" style={{ color: mutedColor }}>
                  Mostre este código ao lojista para resgatar.
                </p>
              </div>
              <div
                className="rounded-2xl py-5 px-4"
                style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}20` }}
              >
                <code className="font-mono text-2xl font-black tracking-widest block" style={{ color: accentColor }}>
                  {codigo}
                </code>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-base font-bold mb-1" style={{ color: textColor }}>Ativar minha chave</h2>
              <p className="text-xs mb-5" style={{ color: mutedColor }}>
                Informe seu contato para ativar. Depois é só apresentar o código ao lojista.
              </p>
              <AtivacaoForm codigo={codigo} corPrimaria={accentColor} />
            </>
          )}
        </div>

        {/* Regras */}
        {campanha.regrasUso && (
          <div
            style={{
              borderRadius: Math.max(cardRadius - 4, 8),
              padding: "1rem",
              background: dark ? "rgba(255,255,255,0.02)" : `${accentColor}06`,
              border: `1px solid ${glassBorder}`,
            }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: mutedColor }}>
              Regras de uso
            </p>
            <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: mutedColor }}>
              {campanha.regrasUso}
            </p>
          </div>
        )}

        {/* Store link */}
        {chave.loja.siteUrl && (
          <div className="text-center">
            <a
              href={chave.loja.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-opacity hover:opacity-80"
              style={{ color: accentColor, background: `${accentColor}10`, border: `1px solid ${accentColor}25` }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Visitar {nomeExibicao}
            </a>
          </div>
        )}

      </main>

      <footer className="text-center py-5 relative z-10">
        <p className="text-xs" style={{ color: subtleColor }}>
          Powered by{" "}
          <Link href="/" className="font-semibold" style={{ color: mutedColor }}>
            <span>Courtesy</span><span style={{ color: "#10b981" }}>fy</span>
          </Link>
        </p>
      </footer>
    </div>
  )
}
