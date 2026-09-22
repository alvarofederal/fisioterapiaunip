/**
 * Cronograma fixo do semestre — encontros presenciais de sábado.
 *
 * Uso:  npm run db:cronograma
 *
 * É idempotente: roda quantas vezes quiser que não duplica. A chave de
 * comparação é matéria + data, então rodar de novo depois de acrescentar uma
 * data nova insere só a que falta.
 */
import { PrismaClient } from "../src/generated/prisma"
import { dataDeEncontro } from "../src/lib/datas"

const prisma = new PrismaClient()

/** Compara nomes ignorando acento, caixa e pontuação. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

const CRONOGRAMA = [
  {
    // "ANATOMIA HUMANA E NEUROCIÊNCIAS APLICADAS À FISIOTERAPIA"
    procurarPor: "anatomia",
    horaInicio: "08:00",
    horaFim: "10:50",
    datas: [
      "2026-08-08",
      "2026-08-22",
      "2026-09-19",
      "2026-10-17",
      "2026-10-31",
      "2026-11-14",
      "2026-11-28",
    ],
  },
  {
    // "ATIVIDADES DE EXTENSÃO II - FS - EDUCAÇÃO SOBRE DOR"
    procurarPor: "extensao ii",
    horaInicio: "09:00",
    horaFim: "13:20",
    datas: [
      "2026-08-15",
      "2026-08-29",
      "2026-09-12",
      "2026-09-26",
      "2026-10-10",
      "2026-10-24",
      "2026-11-07",
      "2026-11-21",
      "2026-12-05",
      "2026-12-19",
    ],
  },
]

async function main() {
  const materias = await prisma.materia.findMany({ select: { id: true, nome: true } })

  if (materias.length === 0) {
    console.error("\n✖ Nenhuma matéria cadastrada. Cadastre antes de rodar o cronograma.\n")
    process.exit(1)
  }

  let criadas = 0
  let jaExistiam = 0

  for (const bloco of CRONOGRAMA) {
    const alvo = materias.find((m) => normalizar(m.nome).includes(bloco.procurarPor))

    if (!alvo) {
      console.warn(`⚠ Nenhuma matéria encontrada para "${bloco.procurarPor}" — bloco ignorado.`)
      continue
    }

    console.log(`\n${alvo.nome}`)
    console.log(`  ${bloco.horaInicio} às ${bloco.horaFim}`)

    for (const iso of bloco.datas) {
      const data = dataDeEncontro(iso)

      const existente = await prisma.aula.findFirst({
        where: { materiaId: alvo.id, data },
        select: { id: true },
      })

      if (existente) {
        jaExistiam++
        console.log(`  · ${iso} (já estava)`)
        continue
      }

      await prisma.aula.create({
        data: {
          materiaId: alvo.id,
          data,
          horaInicio: bloco.horaInicio,
          horaFim: bloco.horaFim,
        },
      })
      criadas++
      console.log(`  ✔ ${iso}`)
    }
  }

  console.log(`\n${criadas} encontro(s) criado(s), ${jaExistiam} já existia(m).\n`)
}

main()
  .catch((erro) => {
    console.error("Falha ao montar o cronograma:", erro)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
