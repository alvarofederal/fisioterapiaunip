"use client"

import { useEffect, useRef } from "react"

/* ─── types ───────────────────────────────────────────────────── */
type Pt = [number, number]

interface Branch {
  pts: Pt[]
  alpha: number
  widthMul: number
}

interface Bolt {
  trunk: Pt[]
  branches: Branch[]
}

/* ─── midpoint displacement ───────────────────────────────────── */
function displace(a: Pt, b: Pt, rough: number): Pt {
  return [
    (a[0] + b[0]) / 2 + (Math.random() - 0.5) * rough,
    (a[1] + b[1]) / 2 + (Math.random() - 0.38) * rough * 0.22,
  ]
}

function buildPath(a: Pt, b: Pt, rough: number, depth: number): Pt[] {
  if (depth === 0) return [a, b]
  const m = displace(a, b, rough)
  return [
    ...buildPath(a, m, rough * 0.54, depth - 1).slice(0, -1),
    m,
    ...buildPath(m, b, rough * 0.54, depth - 1),
  ]
}

/* ─── bolt factory ────────────────────────────────────────────── */
function createBolts(w: number, h: number): Bolt[] {
  const bolts: Bolt[] = []
  const numTrunks = 1 + (Math.random() < 0.35 ? 1 : 0)

  for (let t = 0; t < numTrunks; t++) {
    const startX = w * 0.38 + Math.random() * w * 0.24
    const endX   = startX + (Math.random() - 0.5) * w * 0.22
    const endY   = h * (0.68 + Math.random() * 0.22)

    const trunk  = buildPath([startX, -8], [endX, endY], w * 0.09, 7)
    const branches: Branch[] = []

    const numBranches = 5 + Math.floor(Math.random() * 4)
    for (let i = 0; i < numBranches; i++) {
      const idx = Math.floor(trunk.length * 0.12 + Math.random() * trunk.length * 0.70)
      if (idx >= trunk.length) continue
      const [bx, by] = trunk[idx]

      const side  = Math.random() < 0.5 ? -1 : 1
      const angle = Math.PI / 2 + side * (0.35 + Math.random() * 0.85)
      const len   = 28 + Math.random() * 110
      const ex    = bx + Math.cos(angle) * len
      const ey    = by + Math.sin(angle) * len

      const bpts  = buildPath([bx, by], [ex, ey], 18 + Math.random() * 28, 4)
      const alpha = 0.28 + Math.random() * 0.52
      branches.push({ pts: bpts, alpha, widthMul: 0.25 + Math.random() * 0.42 })

      /* sub-branch */
      if (Math.random() < 0.45 && bpts.length > 6) {
        const si = Math.floor(bpts.length * 0.3 + Math.random() * bpts.length * 0.4)
        if (si < bpts.length) {
          const [sx, sy] = bpts[si]
          const sa = Math.PI / 2 + (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 1.0)
          const sl = 12 + Math.random() * 48
          const spts = buildPath([sx, sy], [sx + Math.cos(sa) * sl, sy + Math.sin(sa) * sl], 8, 3)
          branches.push({ pts: spts, alpha: alpha * 0.42, widthMul: 0.12 + Math.random() * 0.18 })
        }
      }
    }

    bolts.push({ trunk, branches })
  }

  return bolts
}

/* ─── painter's glow (no filter, pure multi-pass strokes) ─────── */
function paintGlow(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  baseAlpha: number,
  baseWidth: number,
) {
  if (pts.length < 2) return

  const passes: [number, number, string][] = [
    [baseWidth * 16, baseAlpha * 0.04, "130,200,255"],
    [baseWidth * 9,  baseAlpha * 0.11, "160,215,255"],
    [baseWidth * 5,  baseAlpha * 0.28, "210,235,255"],
    [baseWidth * 2.2, baseAlpha * 0.65, "240,248,255"],
    [baseWidth * 0.9, baseAlpha,        "255,255,255"],
  ]

  for (const [lw, a, rgb] of passes) {
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
    ctx.strokeStyle  = `rgba(${rgb},${Math.min(a, 1)})`
    ctx.lineWidth    = lw
    ctx.lineCap      = "round"
    ctx.lineJoin     = "round"
    ctx.globalAlpha  = 1
    ctx.stroke()
  }
}

/* ─── component ───────────────────────────────────────────────── */
export function LightningCanvas() {
  const ref    = useRef<HTMLCanvasElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let bolts: Bolt[] = []

    function resize() {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      canvas.width  = canvas.offsetWidth  * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx!.resetTransform()
      ctx!.scale(dpr, dpr)
    }
    resize()
    window.addEventListener("resize", resize)

    function clear() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
    }

    function flash(intensity: number) {
      if (!canvas || !ctx) return
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      clear()

      /* ambient sky glow */
      const grad = ctx.createRadialGradient(w * 0.5, 0, 0, w * 0.5, h * 0.55, h * 0.75)
      grad.addColorStop(0,   `rgba(150,210,255,${0.09 * intensity})`)
      grad.addColorStop(0.45,`rgba(100,170,240,${0.04 * intensity})`)
      grad.addColorStop(1,   "transparent")
      ctx.fillStyle = grad
      ctx.globalAlpha = 1
      ctx.fillRect(0, 0, w, h)

      for (const bolt of bolts) {
        paintGlow(ctx, bolt.trunk, intensity, 2.6)
        for (const br of bolt.branches) {
          paintGlow(ctx, br.pts, intensity * br.alpha, 2.6 * br.widthMul)
        }
      }
    }

    function strike() {
      if (!canvas) return
      /* regenerate every strike — natural variation */
      bolts = createBolts(canvas.offsetWidth, canvas.offsetHeight)

      /* real lightning rhythm: bright flash → quick off → echo → fade */
      const seq: [number, number][] = [
        [0,   1.00],
        [65,  0.00],
        [115, 0.72],
        [195, 0.00],
        [240, 0.38],
        [320, 0.00],
      ]
      for (const [t, i] of seq) {
        const id = setTimeout(() => (i > 0 ? flash(i) : clear()), t)
        timers.current.push(id)
      }

      /* next strike: 7–15 s random interval */
      const next = 7000 + Math.random() * 8000
      timers.current.push(setTimeout(strike, next))
    }

    /* wait for splash to clear before first strike */
    timers.current.push(setTimeout(strike, 4300))

    return () => {
      window.removeEventListener("resize", resize)
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position:      "absolute",
        inset:          0,
        width:         "100%",
        height:        "100%",
        pointerEvents: "none",
        zIndex:         1,
      }}
    />
  )
}
