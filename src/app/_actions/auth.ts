// app/_actions/auth.ts
"use server"

import { signOut } from "@/lib/auth";

export async function handleLogout() {
  try {
    // O signOut() já deleta a sessão do banco automaticamente
    // Não precisamos deletar manualmente!
    await signOut({ redirect: false });
    
    return { success: true };
    
  } catch (error) {
    // Ignorar erro de redirect (é esperado)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      return { success: true };
    }
    
    console.error('❌ Erro ao fazer logout:', error);
    return { success: false };
  }
}