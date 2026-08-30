// src/app/forgot-password/page.tsx
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-amber-600" />
            Em Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            A funcionalidade de recuperação de senha estará disponível em breve.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Por enquanto, entre em contato com o suporte se precisar redefinir sua senha.
          </p>
          <Link 
            href="/login"
            className="inline-block w-full text-center py-3 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Voltar para o Login
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}