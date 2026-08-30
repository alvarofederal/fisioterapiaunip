"use client"

import { useActionState, useState, useTransition, useEffect, useRef, useCallback } from "react"
import { useFormStatus } from "react-dom"
import { consultarChave, confirmarResgate } from "../_actions/validar-resgate"
import type { ValidarResgateState } from "../_actions/validar-resgate"
import { Search, CheckCircle, User, Phone, Mail, Camera, Keyboard, X, ZapOff, ImagePlus } from "lucide-react"

/* ── QR Scanner ─────────────────────────────────────────────── */

type ScannerState = "idle" | "requesting" | "active" | "found" | "error"

function QRScannerView({ onCode }: { onCode: (code: string) => void }) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef    = useRef<number>(0)
  const foundRef  = useRef(false)

  const [state, setState]   = useState<ScannerState>("idle")
  const [errMsg, setErrMsg] = useState("")

  /* extract codigo from QR value (URL or raw code) */
  function parseQR(raw: string): string | null {
    // URL format: .../c/XXXX-XXXX-XXXX-XXXX  or  .../c/XXXXXXXXXXXXXXXX
    const urlMatch = raw.match(/\/c\/([A-Z0-9-]{16,19})/i)
    if (urlMatch) return urlMatch[1].toUpperCase()
    // Raw code: XXXX-XXXX-XXXX-XXXX
    const codeMatch = raw.match(/^([A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4})$/i)
    if (codeMatch) return codeMatch[1].toUpperCase()
    // 16-char no dashes
    const plainMatch = raw.match(/^([A-Z0-9]{16})$/i)
    if (plainMatch) {
      const c = plainMatch[1].toUpperCase()
      return `${c.slice(0,4)}-${c.slice(4,8)}-${c.slice(8,12)}-${c.slice(12,16)}`
    }
    return null
  }

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => () => stop(), [stop])

  /* Upload de foto como fallback — funciona no Chrome sem câmera ao vivo */
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    if (!("BarcodeDetector" in window)) {
      setErrMsg("Escaneamento não disponível neste navegador. Digite o código acima.")
      setState("error")
      return
    }

    setState("requesting")
    try {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.src = url
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] })
      const results = await detector.detect(img)
      URL.revokeObjectURL(url)

      if (results.length > 0) {
        const codigo = parseQR(results[0].rawValue)
        if (codigo) { setState("found"); foundRef.current = true; onCode(codigo); return }
      }
      setErrMsg("QR Code não encontrado na imagem. Tente novamente com uma foto mais nítida.")
      setState("error")
    } catch {
      setErrMsg("Não foi possível processar a imagem.")
      setState("error")
    }
  }

  async function start() {
    if (!("BarcodeDetector" in window)) {
      setState("error")
      setErrMsg("Câmera ao vivo não disponível neste navegador (requer Chrome, Edge ou Safari 17+). Use o botão abaixo para tirar uma foto do QR.")
      return
    }

    setState("requesting")
    foundRef.current = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setState("active")

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] })

      const scan = async () => {
        if (foundRef.current) return
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(scan)
          return
        }
        canvas.width  = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.drawImage(video, 0, 0)
        try {
          const results = await detector.detect(canvas)
          if (results.length > 0) {
            const codigo = parseQR(results[0].rawValue)
            if (codigo) {
              foundRef.current = true
              setState("found")
              stop()
              onCode(codigo)
              return
            }
          }
        } catch {/* ignore */}
        rafRef.current = requestAnimationFrame(scan)
      }

      rafRef.current = requestAnimationFrame(scan)
    } catch {
      setState("error")
      setErrMsg("Não foi possível acessar a câmera. Verifique as permissões.")
    }
  }

  if (state === "idle") {
    return (
      <div className="flex flex-col gap-3">
        {/* Live camera button */}
        <button onClick={start}
          className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/15 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/[0.06] transition-all group">
          <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/15 rounded-2xl flex items-center justify-center transition-colors">
            <Camera className="w-6 h-6 text-gray-400 dark:text-white/40 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-700 dark:text-white/70 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 text-sm transition-colors">
              Câmera ao vivo
            </p>
            <p className="text-xs text-gray-400 dark:text-white/35 mt-0.5">Aponte para o QR Code da chave</p>
          </div>
        </button>

        {/* Photo upload fallback */}
        <label className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/45 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-500/50 text-sm cursor-pointer transition-all">
          <ImagePlus className="w-4 h-4" />
          Tirar foto / enviar imagem do QR
          <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
        </label>
      </div>
    )
  }

  if (state === "requesting") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-white/50">Processando...</p>
      </div>
    )
  }

  if (state === "error") {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl p-5 text-center bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
          <ZapOff className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errMsg}</p>
          <button onClick={() => setState("idle")}
            className="mt-3 text-xs text-red-400 dark:text-red-400/70 hover:text-red-600 underline">
            Tentar novamente
          </button>
        </div>
        {/* Photo upload fallback even in error state */}
        <label className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/45 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-500/50 text-sm cursor-pointer transition-all">
          <ImagePlus className="w-4 h-4" />
          Tirar foto / enviar imagem do QR
          <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
        </label>
      </div>
    )
  }

  if (state === "found") {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">QR lido com sucesso!</p>
        <p className="text-xs text-gray-400 dark:text-white/35">Buscando a chave...</p>
      </div>
    )
  }

  // state === "active"
  return (
    <div className="relative rounded-2xl overflow-hidden bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        className="w-full block"
        style={{ maxHeight: "280px", objectFit: "cover" }}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Scanning overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Dark mask with hole */}
        <div className="absolute inset-0 bg-black/40" />
        {/* Frame */}
        <div className="relative z-10 w-44 h-44">
          {/* Corners */}
          {[
            "top-0 left-0 border-t-2 border-l-2 rounded-tl-lg",
            "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
            "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg",
            "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg",
          ].map((cls, i) => (
            <div key={i} className={`absolute w-6 h-6 border-emerald-400 ${cls}`} />
          ))}
          {/* Scan line */}
          <div
            className="absolute inset-x-0 h-0.5 bg-emerald-400/80"
            style={{ animation: "scanline 2s linear infinite" }}
          />
        </div>
      </div>

      {/* Bottom label */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 py-2 text-center">
        <p className="text-white text-xs font-medium">Aponte para o QR Code da chave</p>
      </div>

      <style>{`
        @keyframes scanline {
          0%   { top: 10%; }
          50%  { top: 85%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  )
}

/* ── Confirm button ─────────────────────────────────────────── */

function ConfirmarButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
    >
      {pending ? "Confirmando resgate..." : "Confirmar resgate"}
    </button>
  )
}

/* ── Validador ──────────────────────────────────────────────── */

type Modo = "digitar" | "scanner"

export function Validador() {
  const [modo, setModo] = useState<Modo>("digitar")
  const [codigoDigitado, setCodigoDigitado]   = useState("")
  const [consultaResult, setConsultaResult]   = useState<ValidarResgateState | null>(null)
  const [isPending, startTransition]          = useTransition()
  const [confirmState, confirmAction]         = useActionState<ValidarResgateState, FormData>(
    confirmarResgate,
    {},
  )

  function formatarCodigo(valor: string) {
    const limpo  = valor.toUpperCase().replace(/[^A-Z0-9]/g, "")
    const grupos = limpo.match(/.{1,4}/g) ?? []
    return grupos.join("-").slice(0, 19)
  }

  const buscar = useCallback((codigo: string) => {
    const limpo = codigo.replace(/-/g, "")
    if (limpo.length < 16) return
    startTransition(async () => {
      const result = await consultarChave(codigo)
      setConsultaResult(result)
    })
  }, [])

  function handleBuscar() {
    buscar(codigoDigitado)
  }

  /* QR scanner auto-fill */
  function handleQRCode(codigo: string) {
    setCodigoDigitado(codigo)
    setModo("digitar") // volta pra aba de digitação mostrando o código
    buscar(codigo)
  }

  function handleReset() {
    setConsultaResult(null)
    setCodigoDigitado("")
    confirmAction // reset already handled by useActionState
  }

  /* ── Sucesso ── */
  if (confirmState.success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Resgate confirmado!</h3>
        <p className="text-gray-500 text-sm mb-6">O benefício foi entregue com sucesso.</p>
        <button
          onClick={handleReset}
          className="bg-black hover:bg-gray-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          Validar outra chave
        </button>
      </div>
    )
  }

  /* ── Chave encontrada ── */
  if (consultaResult?.chave) {
    const ch = consultaResult.chave
    return (
      <div className="space-y-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-700 text-sm font-semibold">Chave ativada — pronta para resgate</span>
          </div>
          <p className="font-mono text-lg font-bold text-gray-900 mb-1">{ch.codigo}</p>
          <p className="text-sm text-gray-600 font-medium">{ch.campanhaNome}</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{ch.beneficio}</p>
        </div>

        {(ch.clienteNome || ch.clienteTelefone || ch.clienteEmail) && (
          <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Cliente</p>
            {ch.clienteNome && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User className="w-3.5 h-3.5 text-gray-400" /> {ch.clienteNome}
              </div>
            )}
            {ch.clienteTelefone && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="w-3.5 h-3.5 text-gray-400" /> {ch.clienteTelefone}
              </div>
            )}
            {ch.clienteEmail && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="w-3.5 h-3.5 text-gray-400" /> {ch.clienteEmail}
              </div>
            )}
          </div>
        )}

        <form action={confirmAction} className="space-y-3">
          <input type="hidden" name="codigo" value={ch.codigo} />

          {confirmState.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              {confirmState.error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Observação <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              name="observacao"
              type="text"
              placeholder="Ex: Brinde retirado no balcão"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <ConfirmarButton />
        </form>

        <button
          onClick={handleReset}
          className="w-full text-sm text-gray-400 hover:text-gray-600 py-2"
        >
          Cancelar
        </button>
      </div>
    )
  }

  /* ── Busca ── */
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-white/[0.06] rounded-xl p-1 gap-1">
        <button onClick={() => setModo("digitar")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            modo === "digitar"
              ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-white/45 hover:text-gray-700 dark:hover:text-white"
          }`}>
          <Keyboard className="w-3.5 h-3.5" />
          Digitar código
        </button>
        <button onClick={() => setModo("scanner")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            modo === "scanner"
              ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-white/45 hover:text-gray-700 dark:hover:text-white"
          }`}>
          <Camera className="w-3.5 h-3.5" />
          Escanear QR
        </button>
      </div>

      {/* Error */}
      {consultaResult?.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm text-center flex items-center justify-between gap-2">
          <span>{consultaResult.error}</span>
          <button onClick={() => setConsultaResult(null)}>
            <X className="w-4 h-4 text-red-400 hover:text-red-600" />
          </button>
        </div>
      )}

      {/* Digitar */}
      {modo === "digitar" && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código da chave
            </label>
            <input
              type="text"
              value={codigoDigitado}
              onChange={(e) => setCodigoDigitado(formatarCodigo(e.target.value))}
              onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center text-lg"
              maxLength={19}
              autoFocus
            />
            <p className="text-gray-400 text-xs mt-1 text-center">
              Digite, cole ou use a câmera. Pressione Enter para buscar.
            </p>
          </div>

          <button
            onClick={handleBuscar}
            disabled={isPending || codigoDigitado.replace(/-/g, "").length < 16}
            className="w-full bg-black hover:bg-gray-800 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            {isPending ? "Buscando..." : "Buscar chave"}
          </button>
        </div>
      )}

      {/* Scanner */}
      {modo === "scanner" && (
        <QRScannerView onCode={handleQRCode} />
      )}
    </div>
  )
}
