"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors text-sm w-full"
    >
      <LogOut className="w-4 h-4 flex-shrink-0" />
      Sair
    </button>
  )
}
