import { Resend } from "resend"
import { render } from "@react-email/render"
import { VerificationEmailTemplate } from "@/components/emails/verification-email-template"
import { ChaveAtivadaEmail } from "@/components/emails/chave-ativada-email"

const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Courtesyfy <noreply@karollynemorais.com.br>"

const isDev = process.env.NODE_ENV === "development"

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY não configurada")
  return new Resend(apiKey)
}

export async function sendVerificationEmail(
  email: string,
  code: string,
  expiresInMinutes: number = 0.75
) {
  if (isDev) {
    console.log("\n✉️  ========================================")
    console.log("✉️  [DEV] Código de Verificação de Email")
    console.log("✉️  ========================================")
    console.log(`✉️  Para: ${email}`)
    console.log(`✉️  Código: ${code}`)
    console.log(`✉️  Expira em: ${expiresInMinutes * 60}s`)
    console.log("✉️  ========================================\n")
    return
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.warn("⚠️ RESEND_API_KEY não configurada. Email não será enviado.")
    return
  }

  const emailHtml = await render(
    VerificationEmailTemplate({ code, expiresInMinutes })
  )

  const { error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "🔐 Código de Verificação - Courtesyfy",
    html: emailHtml,
  })

  if (error) {
    console.error("Erro ao enviar email de verificação:", error)
    throw new Error(`Erro ao enviar email: ${error.message}`)
  }
}

export interface ChaveAtivadaEmailData {
  nomeLoja:       string
  nomeCampanha:   string
  beneficioLabel: string
  destaque:       string
  codigo:         string
  expiraEm:       string
  regrasUso?:     string | null
  corPrimaria:    string
}

export async function sendChaveAtivadaEmail(email: string, data: ChaveAtivadaEmailData) {
  if (isDev) {
    console.log("\n🎫 ========================================")
    console.log("🎫 [DEV] Email de Chave Ativada")
    console.log("🎫 ========================================")
    console.log(`🎫 Para: ${email}`)
    console.log(`🎫 Loja: ${data.nomeLoja}`)
    console.log(`🎫 Campanha: ${data.nomeCampanha}`)
    console.log(`🎫 Benefício: ${data.destaque}`)
    console.log(`🎫 Código: ${data.codigo}`)
    console.log(`🎫 Expira: ${data.expiraEm}`)
    console.log("🎫 ========================================\n")
    return
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY não configurada. Email não será enviado.")
    return
  }

  const html = await render(ChaveAtivadaEmail(data))

  const { error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `🎫 Sua chave foi ativada — ${data.nomeLoja}`,
    html,
  })

  if (error) {
    // Não bloqueia o fluxo — loga e segue
    console.error("Erro ao enviar email de ativação de chave:", error)
  }
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (isDev) {
    console.log("\n🔑 ========================================")
    console.log("🔑 [DEV] Email de Recuperação de Senha")
    console.log("🔑 ========================================")
    console.log(`🔑 Para: ${email}`)
    console.log(`🔑 Link: ${resetUrl}`)
    console.log("🔑 ========================================\n")
    return
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.warn("⚠️ RESEND_API_KEY não configurada. Email não será enviado.")
    return
  }

  const emailHtml = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"></head>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f4f4f4">
    <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1)">
      <div style="background:linear-gradient(135deg,#10b981,#14b8a6);padding:40px 30px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:28px">🔑 Recuperação de Senha</h1>
      </div>
      <div style="padding:40px 30px">
        <p style="color:#4b5563;font-size:16px">Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <div style="text-align:center;margin:30px 0">
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#10b981,#14b8a6);color:#fff;padding:16px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px">Redefinir Senha</a>
        </div>
        <p style="color:#d97706;font-size:14px;background:#fef3c7;padding:12px;border-radius:6px"><strong>⚠️ Este link expira em 1 hora.</strong></p>
        <p style="color:#6b7280;font-size:14px">Se não solicitou a recuperação, ignore este email.</p>
      </div>
      <div style="background:#f9fafb;padding:30px;text-align:center">
        <p style="color:#6b7280;font-size:14px;margin:0">© ${new Date().getFullYear()} Courtesyfy. Todos os direitos reservados.</p>
      </div>
    </div>
  </body>
</html>`

  const { error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "🔑 Recuperação de Senha - Courtesyfy",
    html: emailHtml,
  })

  if (error) {
    console.error("Erro ao enviar email de recuperação:", error)
    throw new Error(`Erro ao enviar email: ${error.message}`)
  }
}
