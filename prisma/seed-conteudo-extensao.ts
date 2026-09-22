/**
 * Conteúdo programático de Atividades de Extensão II, do Plano de Ensino da UNIP.
 *
 * Uso:  npm run db:conteudo-extensao
 *
 * IMPORTANTE — o que é do documento e o que é inferência:
 *
 * As cinco unidades e seus tópicos vêm do "CONTEÚDO PROGRAMÁTICO" do PDF,
 * literalmente. A DISTRIBUIÇÃO delas pelos dez sábados NÃO está no documento:
 * o plano é genérico para os oito semestres do curso e não traz data nenhuma.
 * Dividi duas datas por unidade, em ordem, porque dez dividido por cinco é o
 * palpite mais honesto que dá para fazer — mas é palpite.
 *
 * Ajuste pelo botão "Conteúdo" de cada encontro quando souber o calendário real.
 *
 * Só escreve em encontro com conteúdo VAZIO: nada que você escreveu é sobrescrito.
 */
import { PrismaClient } from "../src/generated/prisma"

const prisma = new PrismaClient()

/** Duas datas por unidade, na ordem em que o plano apresenta. */
const UNIDADES = [
  {
    titulo: "Fundamentos da Extensão",
    topicos: [
      "Conceitos e princípios da extensão",
      "Indissociabilidade entre ensino, pesquisa e extensão",
      "Responsabilidade social da Universidade",
      "Curricularização da extensão",
      "Legislação aplicável",
      "Diretrizes institucionais da UNIP",
    ],
  },
  {
    titulo: "Saúde, Sociedade e Território",
    topicos: [
      "Determinantes sociais da saúde",
      "Promoção da saúde e prevenção de doenças",
      "Educação em saúde",
      "Territorialização e diagnóstico comunitário",
      "Participação e controle social",
      "Políticas públicas de saúde e SUS",
    ],
  },
  {
    titulo: "Planejamento das Ações Extensionistas",
    topicos: [
      "Identificação das necessidades da comunidade",
      "Planejamento participativo",
      "Definição de objetivos e estratégias de intervenção",
      "Metodologias participativas",
      "Interdisciplinaridade e interprofissionalidade",
      "Ética nas ações comunitárias",
    ],
  },
  {
    titulo: "Desenvolvimento dos Projetos",
    topicos: [
      "Execução das atividades extensionistas",
      "Práticas educativas, campanhas e oficinas",
      "Grupos educativos e eventos comunitários",
      "Prestação de serviços",
      "Produção de materiais educativos",
      "Ações integradas com instituições parceiras",
    ],
  },
  {
    titulo: "Sistematização e Devolutiva",
    topicos: [
      "Organização e análise das informações coletadas",
      "Elaboração do produto da atividade de extensão",
      "Devolutiva social à comunidade ou instituição parceira",
      "Apresentação do produto no campus ou polo",
      "Registro e postagem na plataforma de extensão",
    ],
  },
]

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

function montarConteudo(unidade: (typeof UNIDADES)[number], parte: number): string {
  const cabecalho = `${unidade.titulo} (${parte} de 2)`
  return `${cabecalho}\n\n${unidade.topicos.map((t) => `• ${t}`).join("\n")}`
}

async function main() {
  const materia = await prisma.materia.findFirst({
    where: { arquivada: false },
    select: { id: true, nome: true },
  }).then(async () => {
    const todas = await prisma.materia.findMany({ select: { id: true, nome: true } })
    return todas.find((m) => normalizar(m.nome).includes("extensao ii")) ?? null
  })

  if (!materia) {
    console.error('\n✖ Não encontrei a matéria de Extensão II.\n')
    process.exit(1)
  }

  const encontros = await prisma.aula.findMany({
    where: { materiaId: materia.id, donoId: null },
    orderBy: { data: "asc" },
    select: { id: true, data: true, conteudo: true },
  })

  console.log(`\n${materia.nome}`)
  console.log(`${encontros.length} encontros presenciais no sistema\n`)

  let preenchidos = 0
  let pulados = 0

  for (const [indice, encontro] of encontros.entries()) {
    const iso = encontro.data.toISOString().slice(0, 10)

    if (encontro.conteudo && encontro.conteudo.trim()) {
      pulados++
      console.log(`  · ${iso} — já tem conteúdo, não toquei`)
      continue
    }

    const unidade = UNIDADES[Math.floor(indice / 2)]
    if (!unidade) {
      console.log(`  · ${iso} — além das 5 unidades do plano, deixei em branco`)
      continue
    }

    await prisma.aula.update({
      where: { id: encontro.id },
      data: { conteudo: montarConteudo(unidade, (indice % 2) + 1) },
    })
    preenchidos++
    console.log(`  ✔ ${iso} — ${unidade.titulo} (${(indice % 2) + 1} de 2)`)
  }

  console.log(`\n${preenchidos} preenchido(s), ${pulados} preservado(s).\n`)
}

main()
  .catch((erro) => {
    console.error("Falha ao preencher o conteúdo:", erro)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
