import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "./_components/login-form"
import Link from "next/link"

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#050505" }}
    >
      {/* Grid faint background */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Ambient green orb */}
      <div
        aria-hidden="true"
        className="fixed pointer-events-none"
        style={{
          width: "600px",
          height: "600px",
          top: "-200px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "radial-gradient(circle, rgba(16,185,129,0.12), transparent 65%)",
          borderRadius: "50%",
        }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-3xl p-8 z-10"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span
              className="logo-shine font-bold tracking-tight select-none"
              style={{
                fontFamily: "var(--font-open-sans), 'Open Sans', sans-serif",
                fontSize: "28px",
              }}
            >
              <span style={{ color: "#ffffff" }}>Courtesy</span>
              <span className="logo-fy-pulse" style={{ color: "#10b981" }}>fy</span>
            </span>
          </Link>
          <p className="text-sm mt-3" style={{ color: "rgba(255,255,255,0.40)" }}>
            Bem-vindo de volta
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.20)" }}>
          Ainda não tem conta?{" "}
          <Link href="/register" className="font-semibold transition-colors hover:text-white" style={{ color: "#10b981" }}>
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
