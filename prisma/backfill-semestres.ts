/**
 * Migração: tira ano e período de dentro da Matéria e põe num Semestre.
 *
 * Uso:  npm run db:backfill-semestres
 *
 * Roda entre as duas fases do schema: a fase 1 acrescentou `semestres` e
 * `materias.semestreId` sem tirar nada; este script move o dado; só então a
 * fase 2 derruba `materias.ano` e `materias.periodo`. Invertida, a ordem
 * perderia em qual semestre cada matéria era cursada.
 *
 * SQL bruto de propósito: o client gerado ainda não conhece o modelo Semestre
 * quando isto precisa rodar.
 *
 * É idempotente — reconhece o semestre pelo par (ano, período).
 */
import { PrismaClient } from "../src/generated/prisma"

const prisma = new PrismaClient()

/** Id no mesmo formato dos outros: o Prisma não gera fora do client. */
function novoId(): string {
  const tempo = Date.now().toString(36)
  const acaso = Math.random().toString(36).slice(2, 10)
  return "c" + tempo + acaso
}

type LinhaMateria = { id: string; nome: string; ano: number; periodo: number }
type LinhaSemestre = { id: string; ano: number; periodo: number }

async function main() {
  const materias = await prisma.$queryRawUnsafe<LinhaMateria[]>(
    "SELECT id, nome, ano, periodo FROM materias ORDER BY ano, periodo, nome"
  )

  if (materias.length === 0) {
    console.log("\nNenhuma matéria para migrar.\n")
    return
  }

  // Um semestre por par distinto — normalmente um só, mas a turma vai avançar.
  const pares = new Map<string, { ano: number; periodo: number }>()
  for (const m of materias) pares.set(`${m.ano}/${m.periodo}`, { ano: m.ano, periodo: m.periodo })

  console.log("")
  const idDoSemestre = new Map<string, string>()

  for (const [chave, { ano, periodo }] of pares) {
    const existentes = await prisma.$queryRawUnsafe<LinhaSemestre[]>(
      "SELECT id, ano, periodo FROM semestres WHERE ano = ? AND periodo = ?",
      ano,
      periodo
    )

    if (existentes.length > 0) {
      idDoSemestre.set(chave, existentes[0].id)
      console.log(`  · ${chave} (já existia)`)
      continue
    }

    const id = novoId()
    await prisma.$executeRawUnsafe(
      "INSERT INTO semestres (id, ano, periodo, criadoEm, atualizadoEm) VALUES (?, ?, ?, NOW(3), NOW(3))",
      id,
      ano,
      periodo
    )
    idDoSemestre.set(chave, id)
    console.log(`  ✔ ${chave} criado`)
  }

  console.log("")
  let ligadas = 0
  let jaLigadas = 0

  for (const m of materias) {
    const semestreId = idDoSemestre.get(`${m.ano}/${m.periodo}`)!

    const atual = await prisma.$queryRawUnsafe<{ semestreId: string | null }[]>(
      "SELECT semestreId FROM materias WHERE id = ?",
      m.id
    )

    if (atual[0]?.semestreId === semestreId) {
      jaLigadas++
      continue
    }

    await prisma.$executeRawUnsafe(
      "UPDATE materias SET semestreId = ? WHERE id = ?",
      semestreId,
      m.id
    )
    ligadas++
    console.log(`  ✔ ${m.ano}/${m.periodo}  ${m.nome}`)
  }

  const semSemestre = await prisma.$queryRawUnsafe<{ total: bigint }[]>(
    "SELECT COUNT(*) AS total FROM materias WHERE semestreId IS NULL"
  )

  console.log(
    `\n${ligadas} matéria(s) ligada(s), ${jaLigadas} já estava(m). ` +
      `Sem semestre: ${Number(semSemestre[0].total)}.\n`
  )

  // A fase 2 derruba as colunas de origem; se alguma matéria ficasse sem
  // semestre, o dado se perderia sem ninguém notar.
  if (Number(semSemestre[0].total) > 0) {
    console.error("✖ Ainda há matéria sem semestre — NÃO rode a fase 2 do schema.\n")
    process.exit(1)
  }
}

main()
  .catch((erro) => {
    console.error("Falha no backfill:", erro)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
