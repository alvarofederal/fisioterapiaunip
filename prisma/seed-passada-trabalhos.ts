/**
 * Quando cada trabalho foi passado em sala.
 *
 * Uso:  npm run db:passada-trabalhos
 *
 * A data sai do cronograma: o trabalho de um tema é passado na aula daquele
 * tema. "3 questões sobre o Sistema Respiratório" casa com a aula de
 * Sistema Respiratório, de 19/09.
 *
 * É idempotente e conservador: só grava onde o campo está vazio, e só quando
 * acha a aula correspondente. Trabalho sem aula equivalente fica em branco,
 * para o ADMIN preencher pela tela — chutar uma data aqui seria pior do que
 * deixar "ainda não passado".
 */
import { PrismaClient } from "../src/generated/prisma"

const prisma = new PrismaClient()

/** Casa o trabalho com a aula pelo tema, ignorando acento e caixa. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

async function main() {
  const trabalhos = await prisma.atividade.findMany({
    where: { tipo: "TRABALHO_EXTRA_CLASSE" },
    select: {
      id: true,
      titulo: true,
      passadaEm: true,
      materiaId: true,
      materia: { select: { nome: true } },
    },
    orderBy: { criadoEm: "asc" },
  })

  console.log("")
  let gravados = 0
  let jaTinham = 0
  let semAula = 0

  for (const trabalho of trabalhos) {
    if (trabalho.passadaEm) {
      jaTinham++
      console.log(`  · ${trabalho.titulo.slice(0, 52)} (já tinha data)`)
      continue
    }

    if (!trabalho.materiaId) {
      semAula++
      continue
    }

    const aulas = await prisma.aula.findMany({
      where: { materiaId: trabalho.materiaId, donoId: null, titulo: { not: null } },
      select: { data: true, titulo: true },
      // A última aula do tema é quando o trabalho costuma ser passado:
      // Cardiovascular foi dado em 08/08 e 22/08, e o trabalho veio no fim.
      orderBy: { data: "desc" },
    })

    const alvo = normalizar(trabalho.titulo)
    const aula = aulas.find((a) => a.titulo && alvo.includes(normalizar(a.titulo)))

    if (!aula) {
      semAula++
      console.warn(`  ⚠ ${trabalho.titulo.slice(0, 52)} — sem aula com tema equivalente`)
      continue
    }

    await prisma.atividade.update({
      where: { id: trabalho.id },
      data: { passadaEm: aula.data },
    })
    gravados++
    console.log(
      `  ✔ ${trabalho.titulo.slice(0, 52)}` +
        `\n      passado em ${aula.data.toISOString().slice(0, 10)} — aula "${aula.titulo}"`
    )
  }

  console.log(
    `\n${gravados} gravado(s), ${jaTinham} já tinha(m), ${semAula} sem aula equivalente.\n`
  )
}

main()
  .catch((erro) => {
    console.error("Falha ao gravar as datas:", erro)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
