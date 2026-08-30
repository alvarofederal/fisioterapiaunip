import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"

export default async function CheckAndRedirectPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("authjs.session-token")?.value

  if (!sessionToken) redirect("/login")

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  })

  if (!session?.user) redirect("/login")

  if (!session.user.emailVerified) redirect("/verify-email")

  redirect("/dashboard")
}
