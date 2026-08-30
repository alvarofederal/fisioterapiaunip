import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { LojaForm } from "./_components/loja-form"
import Link from "next/link"

export default async function OnboardingLojaPage() {
  const session = await auth()
  if (!session?.user)      redirect("/login")
  if (session.user.lojaId) redirect("/dashboard")

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "#050505" }}
    >
      {/* Grid bg */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Ambient orb */}
      <div
        aria-hidden="true"
        className="fixed pointer-events-none"
        style={{
          width: "700px", height: "500px",
          top: "-200px", left: "50%",
          transform: "translateX(-50%)",
          background: "radial-gradient(ellipse, rgba(16,185,129,0.10), transparent 65%)",
          borderRadius: "50%",
        }}
      />

      {/* Logo */}
      <div className="relative z-10 mb-8">
        <Link href="/">
          <span
            className="logo-shine font-bold tracking-tight select-none"
            style={{ fontFamily: "var(--font-open-sans), 'Open Sans', sans-serif", fontSize: "22px" }}
          >
            <span style={{ color: "#fff" }}>Courtesy</span>
            <span className="logo-fy-pulse" style={{ color: "#10b981" }}>fy</span>
          </span>
        </Link>
      </div>

      {/* Step indicator */}
      <div className="relative z-10 flex items-center gap-2 mb-8 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black" style={{ background: "#10b981" }}>✓</span>
        <span>Conta</span>
        <span className="w-6 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black" style={{ background: "#10b981" }}>2</span>
        <span style={{ color: "rgba(255,255,255,0.75)" }}>Sua loja</span>
        <span className="w-6 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.35)" }}
        >3</span>
        <span>Campanha</span>
      </div>

      {/* Card — sem max-w fixo, cresce até a tela */}
      <div
        className="relative z-10 w-full rounded-3xl p-6 sm:p-8"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          backdropFilter: "blur(24px)",
        }}
      >
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Configure sua loja</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.40)" }}>
            Essas informações aparecem na tela que o cliente vê ao escanear o QR Code.
          </p>
        </div>

        <LojaForm />
      </div>
    </div>
  )
}
