import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { PrintLayoutClient } from "./_components/print-layout-client"

export default async function PrintLayoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  const sp = await searchParams
  return <PrintLayoutClient params={sp} />
}
