"use client"

import { useEffect, useState } from "react"

export function SplashScreen() {
  const [fading, setFading] = useState(false)
  const [gone,   setGone]   = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true),  3200) // inicia fade-out
    const t2 = setTimeout(() => setGone(true),    4000) // remove do DOM
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (gone) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position:        "fixed",
        inset:            0,
        zIndex:           9999,
        background:      "#050505",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        opacity:         fading ? 0 : 1,
        transition:      fading ? "opacity 0.8s ease" : "none",
        pointerEvents:   fading ? "none" : "all",
        /* Força camada própria na GPU — impede animações de baixo de vazar */
        transform:       "translateZ(0)",
        willChange:      "opacity",
        isolation:       "isolate",
      }}
    >
      <span
        className="logo-shine"
        style={{
          fontFamily:    "var(--font-open-sans), 'Open Sans', sans-serif",
          fontSize:      "clamp(52px, 14vw, 110px)",
          fontWeight:    700,
          letterSpacing: "-1px",
          lineHeight:    1,
          userSelect:    "none",
        }}
      >
        <span style={{ color: "#ffffff" }}>Courtesy</span>
        <span
          style={{
            color: "#10b981",
            textShadow:
              "0 0 30px rgba(16,185,129,0.7), 0 0 60px rgba(16,185,129,0.35)",
          }}
        >
          fy
        </span>
      </span>
    </div>
  )
}
