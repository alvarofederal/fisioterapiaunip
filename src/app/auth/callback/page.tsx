"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session?.user) {
      router.push("/login")
      return
    }

    router.push("/dashboard")
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
      </div>
    </div>
  )
}
