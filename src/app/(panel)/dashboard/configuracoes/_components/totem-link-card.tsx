"use client"

import { useState, useEffect, useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Copy, Check, ExternalLink, QrCode, MonitorSmartphone } from "lucide-react"

interface Props {
  lojaId: string
}

export function TotemLinkCard({ lojaId }: Props) {
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const url = `${origin}/r/${lojaId}`

  function copyUrl() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  useEffect(() => {
    if (!qrOpen) return
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setQrOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [qrOpen])

  useEffect(() => {
    document.body.style.overflow = qrOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [qrOpen])

  return (
    <>
      <div className="dash-card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MonitorSmartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold dash-title">Link do Totem de Resgate</p>
            <p className="text-xs dash-muted mt-0.5 mb-3">
              Exiba este link em um totem, tablet ou tela da loja para seus clientes resgatarem os benefícios.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-0 text-xs bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 dash-muted truncate font-mono">
                {url}
              </code>
              <button
                onClick={copyUrl}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${
                  copied
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 dark:bg-white/[0.07] text-gray-700 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/[0.12]"
                }`}
              >
                {copied
                  ? <><Check className="w-3.5 h-3.5" />Copiado!</>
                  : <><Copy className="w-3.5 h-3.5" />Copiar</>
                }
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/[0.07] text-gray-700 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/[0.12] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir
              </a>
              <button
                onClick={() => setQrOpen(true)}
                className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                QR Code
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal QR Code ── */}
      {qrOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setQrOpen(false) }}
        >
          <div
            ref={modalRef}
            className="relative bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6 w-full max-w-xs"
          >
            <button
              onClick={() => setQrOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="Fechar"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center">
              <p className="text-base font-bold text-gray-900">QR Code do Totem</p>
              <p className="text-xs text-gray-500 mt-1">
                Imprima ou exiba na tela da sua loja
              </p>
            </div>

            {url && (
              <QRCodeSVG
                value={url}
                size={220}
                bgColor="transparent"
                fgColor="#111827"
                level="M"
                marginSize={1}
              />
            )}

            <div className="text-center w-full">
              <code className="text-xs text-gray-400 font-mono break-all">{url}</code>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
