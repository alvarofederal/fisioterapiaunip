"use server"

import { signIn } from '@/lib/auth'

type LoginType = 'google' | 'github'

export async function handleRegister(provider: LoginType) {
  // ✅ Redireciona para página intermediária que vai verificar o perfil
  await signIn(provider, { redirectTo: "/auth/callback" })
}