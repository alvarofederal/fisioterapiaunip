import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AppShell } from "./_components/app-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? null}
      userEmail={session.user.email ?? null}
    >
      {children}
    </AppShell>
  )
}
