"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Keyboard, Camera, ArrowRight, QrCode, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import jsQR from "jsqr"

/* ── helpers ──────────────────────────────────────────────────── */
const CODE_REGEX = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/

function formatCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16)
  const parts = []
  for (let i = 0; i < clean.length; i += 4) parts.push(clean.slice(i, i + 4))
  return parts.join("-")
}

/** Extrai código XXXX-XXXX-XXXX-XXXX de uma URL courtesyfy ou de texto puro */
function extractCode(text: string): string | null {
  // URL: /c/XXXX-XXXX-XXXX-XXXX
  const urlMatch = text.match(/\/c\/([A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4})/i)
  if (urlMatch) return urlMatch[1].toUpperCase()
  // Texto puro
  const rawMatch = text.match(/([A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4})/i)
  if (rawMatch) return rawMatch[1].toUpperCase()
  return null
}

/* ── Tab: Digitar código ─────────────────────────────────────── */
function DigitarTab() {
  const router = useRouter()
  const [code, setCode]     = useState("")
  const [error, setError]   = useState("")
  const [loading, setLoading] = useState(false)

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setError("")
    setCode(formatCode(e.target.value))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") submit()
  }

  function submit() {
    if (!CODE_REGEX.test(code)) {
      setError("Código inválido. Verifique os 16 caracteres no cartão.")
      return
    }
    setLoading(true)
    router.push(`/c/${code}`)
  }

  const isComplete = CODE_REGEX.test(code)

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={code}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          placeholder="XXXX-XXXX-XXXX-XXXX"
          maxLength={19}
          className="w-full rounded-2xl px-5 py-5 font-mono text-xl font-bold tracking-widest text-center transition-all outline-none"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `2px solid ${error ? "#ef4444" : isComplete ? "#10b981" : "rgba(255,255,255,0.10)"}`,
            color: isComplete ? "#10b981" : "#ffffff",
            boxShadow: isComplete ? "0 0 24px rgba(16,185,129,0.12)" : "none",
            caretColor: "#10b981",
          }}
        />
        {isComplete && (
          <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 pointer-events-none" />
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm text-red-400"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint */}
      {!error && (
        <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
          O código está no seu cartão físico ou na mensagem que você recebeu
        </p>
      )}

      {/* Botão */}
      <button
        onClick={submit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 text-base font-semibold py-4 rounded-2xl transition-all disabled:opacity-60 active:scale-[0.98]"
        style={{
          background: isComplete
            ? "linear-gradient(135deg, #10b981, #059669)"
            : "rgba(255,255,255,0.07)",
          color: isComplete ? "#000" : "rgba(255,255,255,0.4)",
          boxShadow: isComplete ? "0 0 24px rgba(16,185,129,0.28)" : "none",
          cursor: isComplete ? "pointer" : "default",
        }}
      >
        {loading
          ? <Loader2 className="w-5 h-5 animate-spin" />
          : <>Ver meu benefício <ArrowRight className="w-5 h-5" /></>
        }
      </button>
    </div>
  )
}

/* ── Tab: Escanear QR ────────────────────────────────────────── */
function EscanearTab() {
  const router = useRouter()
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)

  const [status, setStatus]   = useState<"idle" | "loading" | "scanning" | "found" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [foundCode, setFoundCode] = useState("")

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  // Cleanup ao desmontar / trocar de tab
  useEffect(() => () => stopCamera(), [stopCamera])

  async function startCamera() {
    setStatus("loading")
    setErrorMsg("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus("scanning")
      scan()
    } catch {
      setStatus("error")
      setErrorMsg("Não foi possível acessar a câmera. Verifique as permissões do navegador.")
    }
  }

  function scan() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scan)
      return
    }
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const result  = jsQR(imgData.data, imgData.width, imgData.height)

    if (result) {
      const code = extractCode(result.data)
      if (code) {
        stopCamera()
        setFoundCode(code)
        setStatus("found")
        setTimeout(() => router.push(`/c/${code}`), 900)
        return
      }
    }
    rafRef.current = requestAnimationFrame(scan)
  }

  return (
    <div className="space-y-4">
      {/* Idle: botão para iniciar câmera */}
      {status === "idle" && (
        <div className="text-center space-y-4">
          <div
            className="w-full aspect-[4/3] rounded-2xl flex flex-col items-center justify-center gap-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.12)" }}
          >
            <QrCode className="w-12 h-12" style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Câmera desligada</p>
          </div>
          <button
            onClick={startCamera}
            className="w-full flex items-center justify-center gap-2.5 text-base font-semibold py-4 rounded-2xl transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#000",
              boxShadow: "0 0 24px rgba(16,185,129,0.28)",
            }}
          >
            <Camera className="w-5 h-5" />
            Ligar câmera
          </button>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            Aponte para o QR Code no cartão físico
          </p>
        </div>
      )}

      {/* Loading */}
      {status === "loading" && (
        <div
          className="w-full aspect-[4/3] rounded-2xl flex flex-col items-center justify-center gap-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Iniciando câmera…</p>
        </div>
      )}

      {/* Scanning */}
      {status === "scanning" && (
        <div className="relative">
          <div
            className="w-full aspect-[4/3] rounded-2xl overflow-hidden relative"
            style={{ border: "2px solid rgba(16,185,129,0.40)" }}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Corner guides */}
              {[
                "top-6 left-6 border-t-2 border-l-2 rounded-tl-lg",
                "top-6 right-6 border-t-2 border-r-2 rounded-tr-lg",
                "bottom-6 left-6 border-b-2 border-l-2 rounded-bl-lg",
                "bottom-6 right-6 border-b-2 border-r-2 rounded-br-lg",
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 border-emerald-400 ${cls}`} />
              ))}
              {/* Scan line */}
              <motion.div
                className="absolute left-8 right-8 h-0.5 rounded-full"
                style={{ background: "linear-gradient(90deg, transparent, #10b981, transparent)" }}
                animate={{ top: ["25%", "75%", "25%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
              Escaneando…
            </p>
            <button
              onClick={stopCamera}
              className="text-xs underline transition-colors"
              style={{ color: "rgba(255,255,255,0.35)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.70)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Found */}
      {status === "found" && (
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full aspect-[4/3] rounded-2xl flex flex-col items-center justify-center gap-4"
          style={{ background: "rgba(16,185,129,0.06)", border: "2px solid rgba(16,185,129,0.40)" }}
        >
          <CheckCircle2 className="w-14 h-14 text-emerald-500" />
          <div className="text-center">
            <p className="text-base font-bold text-white">QR Code lido!</p>
            <code className="font-mono text-sm mt-1" style={{ color: "#10b981" }}>{foundCode}</code>
            <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>Redirecionando…</p>
          </div>
        </motion.div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="space-y-3">
          <div
            className="w-full aspect-[4/3] rounded-2xl flex flex-col items-center justify-center gap-3"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.20)" }}
          >
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-center px-6" style={{ color: "rgba(255,255,255,0.45)" }}>
              {errorMsg}
            </p>
          </div>
          <button
            onClick={() => setStatus("idle")}
            className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)" }}
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Página principal ─────────────────────────────────────────── */
export default function ResgatarPage() {
  const [tab, setTab] = useState<"digitar" | "escanear">("digitar")

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#050505", color: "#fff" }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(16,185,129,0.10), transparent 60%)",
        }}
      />

      {/* Header */}
      <header
        className="relative z-10 px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Link
          href="/"
          className="font-bold tracking-tight select-none"
          style={{ fontFamily: "var(--font-open-sans), 'Open Sans', sans-serif", fontSize: "20px" }}
        >
          <span style={{ color: "#ffffff" }}>Courtesy</span>
          <span style={{ color: "#10b981" }}>fy</span>
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium transition-colors"
          style={{ color: "rgba(255,255,255,0.40)" }}
        >
          Entrar
        </Link>
      </header>

      {/* Body */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.22)" }}
            >
              <QrCode className="w-7 h-7" style={{ color: "#10b981" }} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Resgatar benefício</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
              Digite o código do seu cartão ou escaneie o QR Code
            </p>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
            }}
          >
            {/* Tabs */}
            <div
              className="flex"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              {[
                { key: "digitar",  label: "Digitar código", icon: Keyboard },
                { key: "escanear", label: "Escanear QR",    icon: Camera   },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key as typeof tab)}
                  className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all"
                  style={{
                    color: tab === key ? "#10b981" : "rgba(255,255,255,0.35)",
                    background: tab === key ? "rgba(16,185,129,0.06)" : "transparent",
                    borderBottom: tab === key ? "2px solid #10b981" : "2px solid transparent",
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: tab === "digitar" ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {tab === "digitar" ? <DigitarTab /> : <EscanearTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Dica */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-xs mt-6"
            style={{ color: "rgba(255,255,255,0.18)" }}
          >
            Recebeu um cartão de uma loja? Aqui você vê seu benefício.
          </motion.p>
        </div>
      </main>

      <footer className="relative z-10 text-center py-5">
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
