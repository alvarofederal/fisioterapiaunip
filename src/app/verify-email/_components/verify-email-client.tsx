// src/app/verify-email/_components/verify-email-client.tsx
"use client"

import Link from "next/link"
import { VerifyEmailForm } from "./verify-email-form"

interface VerifyEmailClientProps {
  email?: string
  code?: string
}

export function VerifyEmailClient({ email, code }: VerifyEmailClientProps) {
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

          {/* Ícone de envelope */}
          <div
            className="mx-auto mt-5 mb-3 flex items-center justify-center w-14 h-14 rounded-2xl"
            style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.20)" }}
          >
            <span className="text-2xl">✉️</span>
          </div>

          <h1 className="text-xl font-bold mb-1" style={{ color: "#ffffff" }}>
            Verificar Email
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
            Digite o código de 6 dígitos enviado para seu email
          </p>
        </div>

        <VerifyEmailForm initialEmail={email} />

        <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.20)" }}>
          Já verificou?{" "}
          <Link
            href="/login"
            className="font-semibold transition-colors hover:text-white"
            style={{ color: "#10b981" }}
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
