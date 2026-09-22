/**
 * Conteúdo dos encontros de ATIVIDADES DE EXTENSÃO II.
 *
 * Uso:  npm run db:conteudo-extensao
 *
 * Fonte: "CRONOGRAMA_PROJETO DE EXTENSÃO_2026-2.pdf" — o cronograma oficial,
 * com temática e responsável de cada uma das 10 datas.
 *
 * Este arquivo já existiu com um conteúdo GENÉRICO, distribuído a partir das
 * unidades do Plano de Ensino porque na época não havia calendário por data.
 * Aquilo era palpite; isto aqui é o documento. Por isso o seed SUBSTITUI o
 * texto inferido — e só ele: se alguém tiver escrito o conteúdo à mão pela
 * tela, o encontro é pulado com aviso, para não apagar trabalho de ninguém.
 */
import { PrismaClient } from "../src/generated/prisma"
import { dataDeEncontro } from "../src/lib/datas"

const prisma = new PrismaClient()

/**
 * Título do projeto do semestre, que vale para todos os encontros — por isso
 * fica na matéria, não repetido em cada data.
 */
const TITULO_DO_PROJETO = "Educação em Dor na Fisioterapia"

const ANOTACOES_DA_MATERIA = [
  "Projeto de Extensão 2026/2",
  "",
  "Educação em Dor na Fisioterapia: abordagem biopsicossocial, raciocínio",
  "clínico e aplicação em diferentes contextos.",
  "",
  "Encontros aos sábados, das 09:00 às 13:20.",
  "Entrega do relatório final: 19/12/2026.",
].join("\n")

const CRONOGRAMA: { data: string; conteudo: string }[] = [
  {
    data: "2026-08-15",
    conteudo: ["Apresentação do Cronograma", "", "Responsáveis: Prof. Camila e Prof. Gracielle"].join("\n"),
  },
  {
    data: "2026-08-29",
    conteudo: [
      "Palestra: Fármacos na dor",
      "",
      "Palestrante: Prof. Elle Tanus",
      "Responsável: Prof. Gracielle",
    ].join("\n"),
  },
  {
    data: "2026-09-12",
    conteudo: [
      "Atividade: Relatório Epidemiológico",
      "",
      "Resultados do questionário sobre caracterização da dor preenchido pelos",
      "pacientes da Clínica Escola em 2025.",
      "",
      "No mesmo encontro: Instrumentos de Avaliação em Dor.",
      "",
      "Responsável: Prof. Gracielle",
    ].join("\n"),
  },
  {
    data: "2026-09-26",
    conteudo: ["Aula Prática: Dor Radicular", "", "Responsável: Prof. Gracielle"].join("\n"),
  },
  {
    data: "2026-10-10",
    conteudo: [
      "Prática: Prevenção e principais fatores de risco na dança",
      "",
      "Convidada: Prof. Giulia",
      "Responsável: Prof. Gracielle",
    ].join("\n"),
  },
  {
    data: "2026-10-24",
    conteudo: [
      "Corpo, violência e vulnerabilidade social",
      "",
      "Responsáveis: Prof. Aline e Prof. Gracielle",
    ].join("\n"),
  },
  {
    data: "2026-11-07",
    conteudo: [
      "Dor, relações familiares e redes de apoio",
      "",
      "Responsáveis: Prof. Aline e Prof. Gracielle",
    ].join("\n"),
  },
  {
    data: "2026-11-21",
    conteudo: [
      "Corpo: luto, depressão e ansiedade",
      "",
      "Responsáveis: Prof. Aline e Prof. Gracielle",
    ].join("\n"),
  },
  {
    data: "2026-12-05",
    conteudo: [
      "Corpo no mundo: contando sua história em busca de sentido",
      "",
      "Responsáveis: Prof. Aline e Prof. Gracielle",
    ].join("\n"),
  },
  {
    data: "2026-12-19",
    conteudo: ["ENTREGA DE RELATÓRIO", "", "Responsável: Prof. Gracielle"].join("\n"),
  },
]

/**
 * Reconhece o conteúdo genérico que este seed gravava antes.
 *
 * Todo texto inferido começava com "Unidade (N de 2)" — a numeração foi
 * inventada para espalhar 5 unidades por 10 datas. Nenhum texto vindo do
 * cronograma oficial tem essa marca, então ela distingue com segurança o que
 * pode ser substituído do que foi escrito por uma pessoa.
 */
function eConteudoInferido(texto: string): boolean {
  return /\([12] de 2\)/.test(texto.split("\n")[0] ?? "")
}

async function main() {
  const materia = await prisma.materia.findFirst({
    where: { nome: { contains: "EXTENS" } },
    select: { id: true, nome: true, anotacoes: true },
  })

  if (!materia) {
    console.error("\n✖ Matéria de Extensão II não encontrada. Cadastre antes de rodar.\n")
    process.exit(1)
  }

  console.log(`\n${materia.nome}\n`)

  let gravados = 0
  let jaEstavam = 0
  let pulados = 0
  let semEncontro = 0

  for (const item of CRONOGRAMA) {
    const aula = await prisma.aula.findFirst({
      // donoId nulo: cronograma da turma, não estudo particular de ninguém.
      where: { materiaId: materia.id, data: dataDeEncontro(item.data), donoId: null },
      select: { id: true, conteudo: true },
    })

    const dia = item.data.split("-").reverse().join("/")
    const primeiraLinha = item.conteudo.split("\n")[0]

    if (!aula) {
      semEncontro++
      console.warn(`  ⚠ ${dia} — não existe encontro nessa data. Rode antes: npm run db:cronograma`)
      continue
    }

    if (aula.conteudo === item.conteudo) {
      jaEstavam++
      console.log(`  · ${dia} — ${primeiraLinha} (já estava)`)
      continue
    }

    const atual = aula.conteudo?.trim()
    if (atual && !eConteudoInferido(atual)) {
      pulados++
      console.warn(`  ⚠ ${dia} — já tem conteúdo escrito à mão, não vou sobrescrever:`)
      console.warn(`      "${atual.split("\n")[0]}"`)
      continue
    }

    await prisma.aula.update({ where: { id: aula.id }, data: { conteudo: item.conteudo } })
    gravados++
    console.log(`  ✔ ${dia} — ${primeiraLinha}`)
  }

  // Acrescenta, nunca substitui: o que estiver ali foi escrito por uma pessoa.
  // Procurar o título antes de escrever é o que torna isto repetível.
  const anotacoesAtuais = materia.anotacoes?.trim() ?? ""
  if (anotacoesAtuais.includes(TITULO_DO_PROJETO)) {
    console.log("\n  · As anotações da matéria já traziam o título do projeto.")
  } else {
    const texto = anotacoesAtuais
      ? anotacoesAtuais + "\n\n" + ANOTACOES_DA_MATERIA
      : ANOTACOES_DA_MATERIA

    await prisma.materia.update({ where: { id: materia.id }, data: { anotacoes: texto } })
    console.log(
      anotacoesAtuais
        ? "\n  ✔ Título do projeto acrescentado às anotações da matéria."
        : "\n  ✔ Título do projeto gravado nas anotações da matéria."
    )
  }

  console.log(
    `\n${gravados} encontro(s) atualizado(s), ${jaEstavam} já estava(m) certo(s), ` +
      `${pulados} pulado(s), ${semEncontro} sem encontro no banco.\n`
  )
}

main()
  .catch((erro) => {
    console.error("Falha ao gravar o conteúdo de Extensão II:", erro)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
