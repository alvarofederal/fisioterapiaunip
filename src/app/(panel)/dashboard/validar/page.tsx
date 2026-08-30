import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ScanLine } from "lucide-react"
import { ValidarForm } from "./_components/validar-form"

export default async function ValidarPage() {
  const session = await auth()
  if (!session?.user?.lojaId) redirect("/login")

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
            <ScanLine className="w-5 h-5 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold dash-title">Validar resgate</h1>
        </div>
        <p className="dash-subtitle text-sm mt-1">
          Digite ou escaneie o código que o cliente apresentou para confirmar o benefício.
        </p>
      </div>

      <ValidarForm />
    </div>
  )
}
