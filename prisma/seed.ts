/**
 * Cria (ou promove) a conta de administrador do portal.
 *
 * Uso:
 *   ADMIN_EMAIL=voce@exemplo.com ADMIN_SENHA="UmaSenhaForte1" ADMIN_RA="123456" npm run db:seed
 *
 * É idempotente: rodar de novo não duplica nada. Se a conta já existir, ela é
 * promovida a ADMIN e ativada — útil para recuperar acesso sem mexer no banco
 * na unha.
 */
import bcrypt from "bcryptjs"
import { PrismaClient } from "../src/generated/prisma"

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim()
  const senha = process.env.ADMIN_SENHA
  const nome = process.env.ADMIN_NOME ?? "Administrador"
  const ra = process.env.ADMIN_RA ?? "ADMIN"

  if (!email || !senha) {
    console.error("\n✖ Faltam variáveis de ambiente.\n")
    console.error('  ADMIN_EMAIL="voce@exemplo.com" ADMIN_SENHA="SuaSenha123" npm run db:seed\n')
    process.exit(1)
  }

  if (senha.length < 8) {
    console.error("\n✖ A senha precisa ter pelo menos 8 caracteres.\n")
    process.exit(1)
  }

  const senhaHash = await bcrypt.hash(senha, 12)

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", ativo: true, senha: senhaHash },
    create: { nome, ra, email, senha: senhaHash, role: "ADMIN", ativo: true },
  })

  console.log(`\n✔ Administrador pronto: ${admin.email}`)
  console.log("  Entre em /login com esse e-mail e a senha informada.\n")
}

main()
  .catch((erro) => {
    console.error("Falha ao criar o administrador:", erro)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
