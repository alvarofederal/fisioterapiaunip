"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { Bell, Settings, LogOut, Menu, ChevronDown, X } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface Campanha {
  id: string
  nome: string
  status: string
  criadoEm: string
  loja: { nome: string } | null
}

interface TopNavbarProps {
  userName: string | null
  userEmail: string | null
  role: string
  onMenuClick: () => void
}

const STORAGE_KEY = "courtesyfy_notif_last_seen"

function formatRelTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "agora"
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  return `${Math.floor(hrs / 24)}d atrás`
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    ATIVA: "Ativa", RASCUNHO: "Rascunho", ENCERRADA: "Encerrada", CANCELADA: "Cancelada",
  }
  return map[s] ?? s
}

function statusColor(s: string) {
  if (s === "ATIVA")    return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
  if (s === "RASCUNHO") return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10"
  return "text-gray-500 dark:text-white/40 bg-gray-100 dark:bg-white/10"
}

export function TopNavbar({ userName, userEmail, role, onMenuClick }: TopNavbarProps) {
  const [bellOpen, setBellOpen]       = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [campanhas, setCampanhas]     = useState<Campanha[]>([])
  const [unread, setUnread]           = useState(0)
  const bellRef    = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const isAdmin    = role === "SUPER_ADMIN"
  const initial    = (userName ?? userEmail ?? "?")[0].toUpperCase()
  const displayName = userName ?? userEmail ?? "Usuário"

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) return
      const data = await res.json()
      const list: Campanha[] = data.campanhas ?? []
      setCampanhas(list)
      const lastSeen     = localStorage.getItem(STORAGE_KEY)
      const lastSeenDate = lastSeen ? new Date(lastSeen) : new Date(0)
      setUnread(list.filter((c) => new Date(c.criadoEm) > lastSeenDate).length)
    } catch { /* silently ignore */ }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, 2 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchNotifications])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (bellRef.current    && !bellRef.current.contains(e.target as Node))    setBellOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function openBell() {
    setBellOpen((v) => !v)
    setProfileOpen(false)
    if (!bellOpen) {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString())
      setUnread(0)
    }
  }

  return (
    <header className="h-14 dash-header flex items-center px-4 gap-3 flex-shrink-0 z-30">

      {/* Hamburger (mobile) */}
      <button onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        aria-label="Abrir menu">
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo mobile — texto puro, sem ícone */}
      <Link href="/dashboard" className="lg:hidden logo-shine flex items-center">
        <span className="text-gray-900 dark:text-white font-extrabold text-base tracking-tight"
          style={{ fontFamily: "var(--font-open-sans), 'Open Sans', sans-serif", letterSpacing: "-0.02em" }}>
          Courtesy<span className="logo-fy-pulse" style={{ color: "#10b981" }}>fy</span>
        </span>
      </Link>

      <div className="flex-1" />

      {/* ── Theme toggle ── */}
      <ThemeToggle />

      {/* ── Bell ── */}
      <div className="relative" ref={bellRef}>
        <button onClick={openBell}
          className="relative p-2 rounded-lg text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Notificações">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {bellOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 dash-dropdown overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
              <span className="text-sm font-semibold dash-title">Notificações</span>
              <button onClick={() => setBellOpen(false)}
                className="dash-muted hover:text-gray-600 dark:hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {campanhas.length === 0 ? (
                <p className="text-center text-sm dash-muted py-8">Nenhuma campanha nos últimos 7 dias</p>
              ) : (
                campanhas.map((c) => (
                  <Link key={c.id} href={`/dashboard/campanhas/${c.id}`}
                    onClick={() => setBellOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-white/[0.04] last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium dash-title truncate">{c.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor(c.status)}`}>
                          {statusLabel(c.status)}
                        </span>
                        {isAdmin && c.loja && (
                          <span className="text-xs dash-muted truncate">{c.loja.nome}</span>
                        )}
                      </div>
                      <p className="text-xs dash-muted mt-0.5">{formatRelTime(c.criadoEm)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-white/[0.06]">
              <Link href="/dashboard/campanhas" onClick={() => setBellOpen(false)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors">
                Ver todas as campanhas →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Profile ── */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => { setProfileOpen(v => !v); setBellOpen(false) }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Perfil">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(16,185,129,0.18)", border: "1px solid rgba(16,185,129,0.30)" }}>
            <span className="text-emerald-500 dark:text-emerald-400 text-xs font-bold">{initial}</span>
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-white/80 max-w-[120px] truncate">
            {displayName}
          </span>
          <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-gray-400 dark:text-white/35" />
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 dash-dropdown overflow-hidden z-50">
            {/* User info */}
            <div className="px-4 py-4 border-b border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(16,185,129,0.18)", border: "1px solid rgba(16,185,129,0.30)" }}>
                  <span className="text-emerald-500 dark:text-emerald-400 text-sm font-bold">{initial}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold dash-title truncate">{displayName}</p>
                  {userEmail && (
                    <p className="text-xs dash-muted truncate">{userEmail}</p>
                  )}
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    isAdmin
                      ? "bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400"
                      : "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  }`}>
                    {isAdmin ? "Super Admin" : "Lojista"}
                  </span>
                </div>
              </div>
            </div>
            <div className="py-1.5">
              <Link href="/dashboard/configuracoes" onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <Settings className="w-4 h-4 text-gray-400 dark:text-white/35" />
                Configurações
              </Link>
            </div>
            <div className="border-t border-gray-100 dark:border-white/[0.06] py-1.5">
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors w-full">
                <LogOut className="w-4 h-4" />
                Sair da conta
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
