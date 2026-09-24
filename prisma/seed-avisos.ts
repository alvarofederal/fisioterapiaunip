/**
 * Primeiro aviso do mural.
 *
 * Uso:  npm run db:avisos
 *
 * É idempotente pelo título: rodar de novo não duplica, e não sobrescreve um
 * aviso que já tenha sido editado pela tela.
 */
import { PrismaClient } from "../src/generated/prisma"
import { sanitizarHtml } from "../src/lib/sanitizar"

const prisma = new PrismaClient()

const AVISOS = [
  {
    titulo: "Entrega dos relatórios: só no fim do semestre",
    ordem: 0,
    conteudo: `
<p>Todos os relatórios e exercícios são para levar <strong>no final do semestre</strong>. Juntem tudo para levar nas aulas finais do Projeto de Extensão com a <strong>Professora Gracielle</strong>, para ela assinar e carimbar — e então subir na Plataforma do AVA da UNIP.</p>
<p>Como no primeiro semestre.</p>
<p>Tanto ela quanto a Professora Camila já explicaram isso em sala, nas primeiras aulas.</p>
<p><strong>Não precisam ficar levando os trabalhos todos os sábados.</strong></p>
`.trim(),
  },
]

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, nome: true },
  })

  if (!admin) {
    console.error("\n✖ Nenhum ADMIN cadastrado. O aviso precisa de um autor.\n")
    process.exit(1)
  }

  console.log("")

  for (const item of AVISOS) {
    const existente = await prisma.aviso.findFirst({
      where: { titulo: item.titulo },
      select: { id: true },
    })

    if (existente) {
      console.log(`  · "${item.titulo}" (já existia)`)
      continue
    }

    await prisma.aviso.create({
      data: {
        titulo: item.titulo,
        // Pelo mesmo caminho da tela: o que entra no banco já sai limpo.
        conteudo: sanitizarHtml(item.conteudo),
        ordem: item.ordem,
        ativo: true,
        criadoPorId: admin.id,
      },
    })
    console.log(`  ✔ "${item.titulo}"`)
  }

  const total = await prisma.aviso.count({ where: { ativo: true } })
  console.log(`\n${total} aviso(s) no mural.\n`)
}

main()
  .catch((erro) => {
    console.error("Falha ao gravar os avisos:", erro)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
