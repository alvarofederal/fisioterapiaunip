"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

const STORAGE_KEY = "cfy-theme"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)   // padrão escuro
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Lê o estado real do DOM após montar no cliente
    setIsDark(document.documentElement.classList.contains("dark"))
    setMounted(true)
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)

    if (next) {
      document.documentElement.classList.add("dark")
      localStorage.setItem(STORAGE_KEY, "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem(STORAGE_KEY, "light")
    }
  }

  // Placeholder com mesmo tamanho para evitar layout shift
  if (!mounted) return <div className="w-9 h-9" />

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10"
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      title={isDark ? "Modo claro" : "Modo escuro"}
    >
      {isDark
        ? <Sun  className="w-5 h-5" />
        : <Moon className="w-5 h-5" />
      }
    </button>
  )
}
