"use client"

import Link from "next/link"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import {
  QrCode, Key, BarChart3, CheckCircle2, ArrowRight,
  Zap, Shield, Users, Gift, Sparkles, ChevronRight, Package,
} from "lucide-react"
import { SplashScreen } from "./_components/splash-screen"
import { LightningCanvas } from "./_components/lightning-canvas"

/* ─── helpers ─────────────────────────────────────────────────── */
function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ")
}

/* ─── Animated background grid ───────────────────────────────── */
function GridBg({ opacity = 0.04 }: { opacity?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(rgba(16,185,129,${opacity}) 1px, transparent 1px),
          linear-gradient(90deg, rgba(16,185,129,${opacity}) 1px, transparent 1px)`,
        backgroundSize: "64px 64px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
      }}
    />
  )
}

/* ─── Glowing orb ─────────────────────────────────────────────── */
function Orb({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn("absolute rounded-full blur-[120px] pointer-events-none", className)}
      style={style}
    />
  )
}


/* ─── Hero card mockup ────────────────────────────────────────── */
function HeroCard() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2400)
    return () => clearInterval(id)
  }, [])

  const codes = ["1A2B-3C4D-5EFF-7GH", "9XKP-2MQR-8VNZ-4JT", "3FYB-7LWD-1CPX-6HA"]
  const code = codes[tick % codes.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.6, duration: 1, ease: [0.23, 1, 0.32, 1] }}
      className="relative w-full max-w-[440px] mx-auto"
      style={{ perspective: 1000 }}
    >
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-3xl blur-2xl"
        style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(16,185,129,0.25) 0%, transparent 70%)" }} />

      {/* Card body */}
      <div className="glow-card glass-card-dark relative rounded-3xl overflow-hidden">
        {/* Top accent line */}
        <div className="h-px w-full"
          style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.6), rgba(110,231,183,0.8), rgba(16,185,129,0.6), transparent)" }} />

        <div className="p-8">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-widest text-cyan-400/80 uppercase">
              Cortesia Ativa
            </span>
          </div>

          {/* Code + QR row */}
          <div className="flex items-center gap-6">
            {/* Code */}
            <div className="flex-1">
              <p className="text-xs text-white/30 mb-2 uppercase tracking-widest">Código</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={code}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="font-mono text-lg font-bold tracking-wider"
                  style={{
                    color: "#e0f7ff",
                    textShadow: "0 0 20px rgba(16,185,129,0.7), 0 0 40px rgba(16,185,129,0.3)",
                  }}
                >
                  {code}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

            {/* QR placeholder */}
            <div
              className="relative w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(16,185,129,0.06)",
                border: "1px solid rgba(16,185,129,0.25)",
                boxShadow: "0 0 20px rgba(16,185,129,0.15), inset 0 0 20px rgba(16,185,129,0.05)",
              }}
            >
              <QrCode className="w-8 h-8" style={{ color: "rgba(16,185,129,0.9)" }} />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs text-white/25 font-mono">courtesyfy.com</span>
            <span className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: "rgba(16,185,129,0.08)", color: "rgba(16,185,129,0.7)", border: "1px solid rgba(16,185,129,0.15)" }}>
              Válido • 30 dias
            </span>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-px w-full opacity-30"
          style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)" }} />
      </div>

      {/* Floating stats */}
      {/* Stats abaixo do card — nunca se sobrepõem */}
      <div className="flex gap-3 mt-4 px-1">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7 }}
          className="glass-card flex-1 rounded-2xl px-4 py-3 text-xs"
        >
          <p className="text-white/40 mb-0.5">Resgatadas hoje</p>
          <p className="text-white font-bold text-base">
            <span className="text-emerald-400">↑</span> 1.247
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.7 }}
          className="glass-card flex-1 rounded-2xl px-4 py-3 text-xs"
        >
          <p className="text-white/40 mb-0.5">Taxa de conversão</p>
          <p className="text-white font-bold text-base">
            <span className="text-emerald-400">94.2%</span>
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ─── Navbar ──────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(5,5,5,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo — pass 1: luz desliza pelo nome todo; pass 2: glow verde só no "fy" */}
        <span
          className="logo-shine font-bold tracking-tight select-none"
          style={{
            fontFamily: "var(--font-open-sans), 'Open Sans', sans-serif",
            fontSize: "clamp(20px, 2.5vw, 26px)",
          }}
        >
          <span style={{ color: "#ffffff" }}>Courtesy</span>
          <span className="logo-fy-pulse" style={{ color: "#10b981" }}>fy</span>
        </span>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {[["#como-funciona", "Como funciona"], ["#recursos", "Recursos"], ["#planos", "Planos"]].map(([href, label]) => (
            <a key={href} href={href} className="text-white/50 hover:text-white transition-colors duration-200">
              {label}
            </a>
          ))}
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          {/* Resgatar — link destacado para clientes */}
          <Link
            href="/resgatar"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-all hover:scale-[1.03] active:scale-95"
            style={{
              background: "rgba(16,185,129,0.10)",
              border: "1px solid rgba(16,185,129,0.28)",
              color: "#10b981",
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3v.01M5 8H4a1 1 0 00-1 1v10a1 1 0 001 1h3m10-3v3m0 0H9m10 0h.01" />
            </svg>
            Resgatar
          </Link>
          <Link href="/login" className="text-sm font-medium text-white/50 hover:text-white transition-colors px-3 py-1.5">
            Entrar
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold px-5 py-2.5 rounded-full text-black transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 0 24px rgba(16,185,129,0.3)" }}
          >
            Começar grátis
          </Link>
        </div>
      </div>
    </motion.header>
  )
}

/* ─── Section header ──────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[3px]"
      style={{ color: "#10b981" }}>
      <span className="w-6 h-px" style={{ background: "#10b981" }} />
      {children}
      <span className="w-6 h-px" style={{ background: "#10b981" }} />
    </span>
  )
}

/* ─── Glass card ──────────────────────────────────────────────── */
function GlassCard({
  children, className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("glow-card glass-card rounded-2xl transition-all duration-500 hover:-translate-y-1", className)}>
      {children}
    </div>
  )
}

/* ─── Main ────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.4], ["0%", "20%"])

  /* ── Headlines rotativas ── */
  const heroHeadlines = [
    { top: "Campanhas que",       mid: "geram resultado",    bot: "de verdade." },
    { top: "Seu cliente carrega", mid: "sua marca",          bot: "no bolso." },
    { top: "O card que sai",      mid: "da sua loja",        bot: "nunca para." },
    { top: "Cortesia certa,",     mid: "cliente certo,",     bot: "na hora certa." },
    { top: "Cada QR Code",        mid: "é um vendedor",      bot: "24h por dia." },
    { top: "A promoção que",      mid: "vai ao bolso",       bot: "e volta ao balcão." },
  ]
  const [hlIdx, setHlIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setHlIdx(i => (i + 1) % heroHeadlines.length), 4500)
    return () => clearInterval(id)
  }, [])

  const [loadingKit, setLoadingKit]   = useState<string | null>(null)
  const [pedidoOk,   setPedidoOk]     = useState(false)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("pedido=sucesso")) {
      setPedidoOk(true)
    }
  }, [])

  async function handlePedido(priceId: string) {
    setLoadingKit(priceId)
    try {
      const res  = await fetch("/api/checkout-produto", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ priceId }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
      else          alert(data.error ?? "Erro ao iniciar pagamento")
    } catch {
      alert("Erro de conexão. Tente novamente.")
    } finally {
      setLoadingKit(null)
    }
  }

  const features = [
    { icon: Key,       title: "Chaves que não se repetem",      desc: "Cada código gerado é único no planeta. Sem duplicata, sem reuso. Seu cliente sabe que a cortesia é exclusiva — e isso vale mais do que qualquer desconto genérico." },
    { icon: QrCode,    title: "Página de resgate com sua marca", desc: "Não é uma tela fria. É uma experiência bonita, com seu logo e identidade, no celular do cliente. O momento do resgate vira memória da sua loja." },
    { icon: Shield,    title: "Anti-fraude no balcão",           desc: "Validação em menos de 1 segundo via scan ou código digitado. Chave já usada? Bloqueada na hora. Sua promoção não vira bagunça." },
    { icon: BarChart3, title: "Você vê tudo, em tempo real",    desc: "Quantas cortesias saíram, quantas foram resgatadas, por quem e quando. ROI de cada campanha direto no painel — sem planilha, sem achismo." },
    { icon: Users,     title: "Sua equipe no lugar certo",      desc: "Operador só valida. Gerente acompanha relatórios. Dono controla tudo. Permissões por função — cada um acessa só o que precisa." },
    { icon: Gift,      title: "Benefício do jeito que você faz", desc: "Desconto em %, valor fixo, brinde, frete grátis, cashback ou sorteio. A mecânica da campanha é sua — a tecnologia é nossa." },
  ]

  const plans = [
    {
      name: "Essencial",
      price: "Grátis",
      period: "",
      desc: "Para começar",
      highlight: false,
      cta: "Criar conta grátis",
      href: "/register",
      features: [
        "1 campanha ativa",
        "Até 500 chaves/mês",
        "QR Codes básicos",
        "Dashboard de resgates",
      ],
    },
    {
      name: "Profissional",
      price: "R$ 99",
      period: "/mês",
      desc: "Mais popular",
      highlight: true,
      cta: "Começar 14 dias grátis",
      href: "/register?plano=PROFISSIONAL",
      features: [
        "Campanhas ilimitadas",
        "Chaves ilimitadas",
        "Layout personalizado",
        "Relatórios avançados",
        "Migração de chaves",
        "Totem de resgate",
        "Suporte prioritário",
      ],
    },
    {
      name: "Empresarial",
      price: "R$ 199",
      period: "/mês",
      desc: "Para redes e franquias",
      highlight: false,
      cta: "Falar com a equipe",
      href: "/register?plano=EMPRESARIAL",
      features: [
        "Tudo do Profissional",
        "Multi-unidades",
        "API de integração",
        "White label completo",
        "SLA dedicado",
        "Onboarding presencial",
      ],
    },
  ]

  const materials = [
    {
      tier: "Econômica",
      icon: Zap,
      name: "Papel Offset 240g",
      desc: "Alto volume, baixo custo. Ideal para entrada no sistema e campanhas de grande alcance.",
      unitPrice: "R$ 0,50",
      accentColor: "#10b981",
      kits: [
        { label: "Kit 50 peças",  price: "R$ 29,90",  priceId: "price_1TWRj8ADOPgqdFscOo8TXt9E" },
        { label: "Kit 100 peças", price: "R$ 49,90",  priceId: "price_1TWPygADOPgqdFscrSl0Zv33" },
      ],
    },
    {
      tier: "Intermediária — Plataforma inclusa",
      icon: Key,
      name: "MDF Chaveiro 7×3,5cm",
      desc: "Brinde funcional que o cliente guarda no chaveiro. Alta recorrência em campanhas sazonais.",
      unitPrice: "R$ 2,50",
      accentColor: "#f59e0b",
      kits: [
        { label: "Kit 10 peças",  price: "R$ 25,00",  priceId: "price_1TWSdeADOPgqdFscWnQROXy0" },
        { label: "Kit 100 peças", price: "R$ 250,00", priceId: "price_1TWSePADOPgqdFscUBGuY1fW" },
      ],
    },
    {
      tier: "Premium — Plataforma inclusa",
      icon: Sparkles,
      name: "MDF Quadrado 9×9cm",
      desc: "Peça sublimada decorativa. Campanhas especiais, lançamentos, presentes — sua marca em destaque.",
      unitPrice: "R$ 4,40",
      accentColor: "#a78bfa",
      kits: [
        { label: "Kit 10 peças",  price: "R$ 44,00",  priceId: "price_1TWSflADOPgqdFscqsvC4ixr" },
        { label: "Kit 50 peças",  price: "R$ 220,00", priceId: "price_1TWShDADOPgqdFscroWKHG7t" },
      ],
    },
  ]

  return (
    <div className="min-h-screen font-sans overflow-x-hidden" style={{ background: "#050505", color: "#fff" }}>

      <SplashScreen />

      {/* ── Fundo luminoso global ── */}
      <div className="luminous-bg" aria-hidden="true">
        <div className="luminous-rays" />
        <div className="luminous-star" />
        <div className="luminous-orb3" />
        <div className="luminous-scanline" />
      </div>

      <Navbar />

      {/* Banner de pedido confirmado */}
      {pedidoOk && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-semibold shadow-xl"
          style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10b981", backdropFilter: "blur(12px)" }}>
          <CheckCircle2 className="w-4 h-4" />
          Pedido realizado! Entraremos em contato em breve.
          <button onClick={() => setPedidoOk(false)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ═══ HERO ═══════════════════════════════════════════════ */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
        {/* Background layers */}
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          <GridBg opacity={0.035} />
        </motion.div>

        {/* Glowing orbs */}
        <Orb className="w-[700px] h-[700px] -top-40 -left-40 opacity-20"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.35), transparent 70%)" }} />
        <Orb className="w-[500px] h-[500px] top-1/3 right-0 opacity-15"
          style={{ background: "radial-gradient(circle, rgba(110,231,183,0.25), transparent 70%)" }} />
        <Orb className="w-[400px] h-[400px] bottom-0 left-1/3 opacity-10"
          style={{ background: "radial-gradient(circle, rgba(5,150,105,0.3), transparent 70%)" }} />

        {/* Raio de tempestade — canvas fractal */}
        <LightningCanvas />

        <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 w-full relative" style={{ zIndex: 2 }}>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — copy */}
            <div>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2.5 rounded-full px-5 py-2 mb-8 text-sm font-medium"
                style={{
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  color: "#10b981",
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                O card que sai da sua loja nunca para de trabalhar
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </motion.div>

              {/* Headline rotativa */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="text-5xl md:text-6xl lg:text-[4.2rem] font-semibold leading-[1.12] tracking-tight mb-6"
                style={{ minHeight: "4.6em" }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={hlIdx}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.42, ease: [0.23, 1, 0.32, 1] }}
                    className="block"
                  >
                    {heroHeadlines[hlIdx].top}<br />
                    <span
                      className="bg-clip-text text-transparent"
                      style={{ backgroundImage: "linear-gradient(135deg, #10b981 0%, #6ee7b7 45%, #34d399 100%)" }}
                    >
                      {heroHeadlines[hlIdx].mid}
                    </span>
                    <br />
                    {heroHeadlines[hlIdx].bot}
                  </motion.span>
                </AnimatePresence>
              </motion.h1>

              {/* Sub */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="text-lg md:text-xl leading-relaxed mb-10 max-w-xl"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Crie campanhas de cortesia com chaves únicas e QR Codes exclusivos.
                Cada card impresso vira propaganda ambulante — quando o cliente escaneia,
                vive uma experiência premium com a sua marca e você vê cada resgate em tempo real.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.7 }}
                className="flex flex-col sm:flex-row gap-4 mb-14"
              >
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2.5 text-base font-semibold px-8 py-4 rounded-2xl text-black transition-all hover:scale-[1.03] active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    boxShadow: "0 0 32px rgba(16,185,129,0.35), 0 8px 24px rgba(0,0,0,0.3)",
                  }}
                >
                  Criar conta gratuita
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center justify-center gap-2 text-base font-medium px-8 py-4 rounded-2xl transition-all hover:border-white/30"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}
                >
                  Ver como funciona
                </a>
              </motion.div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-8 pt-8"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                {[
                  { value: "50K+", label: "Cortesias distribuídas" },
                  { value: "94%",  label: "Taxa de resgate" },
                  { value: "< 1s", label: "Validação no balcão" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-bold" style={{ color: "#10b981" }}>{s.value}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — card mockup */}
            <div className="flex justify-center lg:justify-end">
              <HeroCard />
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #050505)" }} />
      </section>

      {/* ═══ COMO FUNCIONA ══════════════════════════════════════ */}
      <section id="como-funciona" className="py-32 px-6 relative">
        <GridBg opacity={0.025} />
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <SectionLabel>Como funciona</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mt-5 mb-4">
              Da campanha ao resgate em{" "}
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg, #10b981, #6ee7b7)" }}>
                3 passos
              </span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
              Simples pra você configurar. Premium pra seu cliente viver.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "01", icon: Key,          title: "Crie sua campanha",         desc: "Defina o benefício — desconto, brinde, cashback ou sorteio. Escolha quantas chaves quer gerar e por quanto tempo a campanha fica ativa." },
              { step: "02", icon: QrCode,       title: "O card vai para o mundo",   desc: "Imprima os cards com seu layout e QR Code exclusivo. Distribua no balcão, via WhatsApp ou em panfletos. Cada card é uma propaganda ambulante com rastreamento próprio." },
              { step: "03", icon: CheckCircle2, title: "Cliente escaneia. Você converte.", desc: "O cliente cai numa página de resgate bonita, com a sua marca. Valide no balcão em menos de 1 segundo. Código já usado? Bloqueado na hora. Tudo registrado no seu painel." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <GlassCard className="p-8 h-full">
                  <div className="flex items-start justify-between mb-6">
                    <span
                      className="text-[5rem] font-black leading-none select-none"
                      style={{ color: "rgba(16,185,129,0.08)", fontVariantNumeric: "tabular-nums" }}
                    >
                      {item.step}
                    </span>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-2"
                      style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <item.icon className="w-5 h-5" style={{ color: "#10b981" }} />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {item.desc}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CARD SHOWCASE ══════════════════════════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <Orb className="w-[800px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.07]"
          style={{ background: "radial-gradient(ellipse, rgba(16,185,129,1), transparent 70%)" }} />

        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <SectionLabel>Propaganda Ambulante</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mt-5 mb-4">
              Um card que trabalha<br />mesmo quando você não está.
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
              Seu cliente recebe o card, leva pra casa, mostra pra amigos, escaneia na hora que quiser.
              Cada QR Code carrega sua marca, sua campanha e — quando resgatado — traz o cliente de volta ao seu negócio.
            </p>
          </motion.div>

          {/* Cards grid demo */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { bg: "#1a1a2e", accent: "#10b981",  label: "30% off na próxima compra" },
              { bg: "#1a0a0a", accent: "#f87171",  label: "Sobremesa grátis" },
              { bg: "#0a1a0a", accent: "#4ade80",  label: "Frete grátis no pedido" },
              { bg: "#1a1508", accent: "#fbbf24",  label: "Brinde exclusivo" },
              { bg: "#0f0f1a", accent: "#a78bfa",  label: "1 serviço grátis" },
              { bg: "#0a1520", accent: "#34d399",  label: "Cashback R$ 20" },
            ].map((theme, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="rounded-2xl p-4 relative overflow-hidden transition-transform duration-300 hover:-translate-y-1"
                style={{
                  background: theme.bg,
                  border: `1px solid ${theme.accent}30`,
                  boxShadow: `0 0 24px ${theme.accent}10`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: `${theme.accent}80` }}>
                    {theme.label}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: theme.accent }} />
                </div>
                <p className="font-mono text-sm font-bold mb-2"
                  style={{ color: theme.accent, textShadow: `0 0 12px ${theme.accent}60` }}>
                  XXXX-XXXX-XXXX
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>QR • Personalizado</span>
                  <div className="w-6 h-6 rounded" style={{ background: `${theme.accent}15`, border: `1px solid ${theme.accent}30` }}>
                    <QrCode className="w-full h-full p-0.5" style={{ color: theme.accent }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ RECURSOS ════════════════════════════════════════════ */}
      <section id="recursos" className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <SectionLabel>Recursos</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mt-5 mb-4">
              Tudo para sua campanha<br />ser levada a sério.
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
              Do lojista independente à rede com dezenas de lojas.
              Cada detalhe pensado para que a cortesia vire resultado.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <GlassCard className="p-7 h-full">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                    <feat.icon className="w-5 h-5" style={{ color: "#10b981" }} />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{feat.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {feat.desc}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PLANOS + MATERIAIS ══════════════════════════════════ */}
      <section id="planos" className="py-32 px-6 relative">
        <Orb className="w-[600px] h-[300px] top-1/2 right-0 -translate-y-1/2 opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse, rgba(16,185,129,1), transparent 70%)" }} />

        <div className="max-w-6xl mx-auto">

          {/* ── Cabeçalho ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <SectionLabel>Dois caminhos, uma plataforma</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mt-5 mb-4">
              Comece com físico.{" "}
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg, #10b981, #6ee7b7)" }}>
                Escale do jeito que quiser.
              </span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
              Compre os cards físicos e a plataforma vem inclusa para gerenciar cada chave.
              Quando a última cortesia for resgatada, você escolhe: pede mais cards ou migra para o digital.
              A plataforma se adapta ao seu ritmo.
            </p>
          </motion.div>

          {/* ── CAMINHO 1: Físico + Plataforma inclusa ── */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>1</div>
            <div>
              <p className="text-base font-semibold text-white">Comece com cards físicos</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
                Nós produzimos, você distribui. Plataforma de gestão inclusa no kit.
              </p>
            </div>
          </div>

          {/* ── CAMINHO 1: Cards físicos (materiais) ── */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {materials.map((mat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glow-card glass-card rounded-2xl p-7 relative overflow-hidden"
              >
                {/* Tier badge */}
                <div className="absolute top-5 right-5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{
                    background: `${mat.accentColor}18`,
                    color: mat.accentColor,
                    border: `1px solid ${mat.accentColor}35`,
                  }}>
                  {mat.tier}
                </div>

                {/* Plataforma inclusa badge */}
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-4"
                  style={{
                    background: "rgba(16,185,129,0.10)",
                    color: "#10b981",
                    border: "1px solid rgba(16,185,129,0.25)",
                  }}>
                  <CheckCircle2 className="w-3 h-3" />
                  Plataforma inclusa
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${mat.accentColor}12`, border: `1px solid ${mat.accentColor}28` }}>
                  <mat.icon className="w-5 h-5" style={{ color: mat.accentColor }} />
                </div>

                <h3 className="text-lg font-semibold mb-2 pr-16">{mat.name}</h3>
                <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.40)" }}>
                  {mat.desc}
                </p>

                {/* Preço unitário */}
                <div className="mb-5 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>
                    preço unitário
                  </span>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-3xl font-bold" style={{ color: mat.accentColor }}>
                      {mat.unitPrice}
                    </span>
                    <span className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>/peça</span>
                  </div>
                </div>

                {/* Kits com botão de compra */}
                <div className="space-y-2 mb-2">
                  {mat.kits.map((k) => {
                    const isLoading = loadingKit === k.priceId
                    return (
                      <button
                        key={k.label}
                        onClick={() => handlePedido(k.priceId)}
                        disabled={!!loadingKit}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{
                          background: `${mat.accentColor}10`,
                          border: `1px solid ${mat.accentColor}28`,
                        }}
                      >
                        <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{k.label}</span>
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-bold text-white">{k.price}</span>
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                            style={{
                              background: isLoading ? `${mat.accentColor}20` : `${mat.accentColor}18`,
                              color: mat.accentColor,
                              border: `1px solid ${mat.accentColor}30`,
                            }}
                          >
                            {isLoading ? "…" : "Pedir →"}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Callout: o que acontece quando as chaves acabam ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl p-8 mb-24 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.07) 0%, rgba(5,150,105,0.04) 100%)",
              border: "1px solid rgba(16,185,129,0.18)",
            }}
          >
            {/* Halo difuso */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.08), transparent 65%)" }} />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              {/* Texto */}
              <div className="flex-1 text-center md:text-left">
                <p className="text-xs font-bold uppercase tracking-[3px] mb-3" style={{ color: "#10b981" }}>
                  Quando a última chave for resgatada…
                </p>
                <h3 className="text-xl md:text-2xl font-semibold mb-2">
                  A plataforma avisa. Você decide o próximo passo.
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Acabou o estoque de cards? Sem problema. O sistema notifica e te dá duas opções na
                  hora — sem perder clientes, sem parar a campanha.
                </p>
              </div>

              {/* Duas opções */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto md:min-w-[220px]">
                <div className="flex items-center gap-3 px-5 py-4 rounded-xl"
                  style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.22)" }}>
                  <Package className="w-5 h-5 flex-shrink-0" style={{ color: "#10b981" }} />
                  <div>
                    <p className="text-sm font-semibold text-white">Pedir mais cards</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>continua no físico</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-4 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: "#a78bfa" }} />
                  <div>
                    <p className="text-sm font-semibold text-white">Migrar para digital</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>assina e imprime</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── CAMINHO 2: Assinatura ── */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.6)",
              }}>2</div>
            <div>
              <p className="text-base font-semibold text-white">Prefiro imprimir por conta</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
                Assine um plano, gere as chaves e imprima onde quiser — ou use só o digital.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn("relative rounded-2xl p-8 transition-all duration-300", plan.highlight && "md:-translate-y-4")}
                style={{
                  background: plan.highlight
                    ? "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.08) 100%)"
                    : "rgba(255,255,255,0.03)",
                  border: plan.highlight
                    ? "1px solid rgba(16,185,129,0.35)"
                    : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: plan.highlight
                    ? "0 0 40px rgba(16,185,129,0.12), 0 24px 48px -12px rgba(0,0,0,0.5)"
                    : "none",
                }}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full text-black"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                    Mais popular
                  </div>
                )}
                <p className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{plan.desc}</p>
                <h3 className="text-xl font-semibold mb-4">{plan.name}</h3>
                <div className="mb-6 flex items-end gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-sm mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>{plan.period}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />
                      <span style={{ color: "rgba(255,255,255,0.65)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className="block text-center text-sm font-semibold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
                  style={plan.highlight
                    ? { background: "linear-gradient(135deg, #10b981, #059669)", color: "#000", boxShadow: "0 0 20px rgba(16,185,129,0.3)" }
                    : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.1)" }
                  }
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ═══ CTA FINAL ═══════════════════════════════════════════ */}
      <section className="py-40 px-6 relative overflow-hidden">
        <GridBg opacity={0.05} />

        {/* Raios de luz */}
        <div className="cta-rays" aria-hidden="true">
          <div className="cta-ray" />
          <div className="cta-ray" />
          <div className="cta-ray" />
          <div className="cta-ray" />
          <div className="cta-ray" />
          <div className="cta-ray" />
          <div className="cta-ray" />
          <div className="cta-ray" />
          <div className="cta-ray" />
          <div className="cta-ray-origin" />
        </div>

        {/* Halo difuso de fundo */}
        <Orb className="w-[700px] h-[350px] top-0 left-1/2 -translate-x-1/2 opacity-[0.18]"
          style={{ background: "radial-gradient(ellipse, rgba(16,185,129,1), transparent 65%)" }} />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <SectionLabel>Comece agora</SectionLabel>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mt-6 mb-6">
              Seu próximo cliente já está<br />esperando{" "}
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #10b981, #6ee7b7, #34d399)" }}>
                sua cortesia.
              </span>
            </h2>
            <p className="text-lg mb-10" style={{ color: "rgba(255,255,255,0.45)" }}>
              Crie sua primeira campanha em minutos. Grátis, sem cartão, sem complicação.<br />
              O card sai impresso. O cliente escaneia. Você vê tudo acontecer.
            </p>
            <Link
              href="/register"
              className="group inline-flex items-center gap-3 text-base font-semibold px-10 py-5 rounded-2xl text-black transition-all hover:scale-[1.04] active:scale-95"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                boxShadow: "0 0 48px rgba(16,185,129,0.4), 0 16px 32px rgba(0,0,0,0.4)",
              }}
            >
              Criar minha primeira campanha
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="py-12 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span
            className="logo-shine font-bold select-none"
            style={{
              fontFamily: "var(--font-open-sans), 'Open Sans', sans-serif",
              fontSize: "18px",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.8)" }}>Courtesy</span>
            <span className="logo-fy-pulse" style={{ color: "#10b981" }}>fy</span>
          </span>

          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            © 2026 Courtesyfy. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-6 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            <Link href="/resgatar" className="hover:text-white transition-colors" style={{ color: "#10b981" }}>Resgatar benefício</Link>
            <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
            <Link href="/register" className="hover:text-white transition-colors">Cadastrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
