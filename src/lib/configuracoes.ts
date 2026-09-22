// src/lib/configuracoes.ts
import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  CalendarDays,
  ListChecks,
  PencilRuler,
  Newspaper,
  UserPlus,
} from "lucide-react"

/**
 * O que o ADMIN liga e desliga para a turma.
 *
 * O vocabulário vive aqui, não no banco: a tabela guarda só chave e valor. Uma
 * opção nova é uma linha nesta lista — sem migração, sem coluna. E chave que
 * não tem linha no banco cai no `padrao` declarado aqui, então o portal
 * funciona com a tabela vazia.
 *
 * `perigo` marca a chave que, desligada, tira algo essencial da turma. A tela
 * avisa antes, em vez de deixar o ADMIN descobrir pelo grupo do WhatsApp.
 */
export type ChaveConfiguracao =
  | "menu_materias"
  | "menu_cronograma"
  | "menu_atividades"
  | "aluno_cria_unidades"
  | "noticias_publicas"
  | "cadastro_aberto"

export type OpcaoConfiguracao = {
  chave: ChaveConfiguracao
  rotulo: string
  descricao: string
  padrao: boolean
  icone: LucideIcon
  grupo: "Menu do aluno" | "O que o aluno pode fazer" | "Portal público"
  perigo?: string
}

export const CONFIGURACOES: OpcaoConfiguracao[] = [
  {
    chave: "menu_materias",
    rotulo: "Meus estudos",
    descricao:
      "O aluno vê as matérias, abre as unidades, marca o que estudou e escreve os resumos.",
    padrao: true,
    icone: BookOpen,
    grupo: "Menu do aluno",
    perigo: "Desligado, ninguém acessa unidades, teleaulas nem o PDF de revisão.",
  },
  {
    chave: "menu_cronograma",
    rotulo: "Cronograma",
    descricao: "Os encontros presenciais do semestre, com o acompanhamento de estudo de cada um.",
    padrao: true,
    icone: CalendarDays,
    grupo: "Menu do aluno",
  },
  {
    chave: "menu_atividades",
    rotulo: "Atividades",
    descricao: "Trabalhos, seminários, eventos e congressos, com os arquivos para baixar.",
    padrao: true,
    icone: ListChecks,
    grupo: "Menu do aluno",
    perigo: "Desligado, a turma deixa de ver prazo de entrega e anexo de trabalho.",
  },
  {
    chave: "aluno_cria_unidades",
    rotulo: "Aluno monta as próprias unidades",
    descricao:
      "Dentro das matérias que você cadastrou, cada aluno pode criar unidades e teleaulas só dele. Ninguém mais vê, nem você — é a organização de estudo particular dele.",
    padrao: true,
    icone: PencilRuler,
    grupo: "O que o aluno pode fazer",
  },
  {
    chave: "noticias_publicas",
    rotulo: "Página de notícias",
    descricao:
      "A vitrine em /noticias, aberta sem login. Mostra título, tipo e data — nunca descrição, local nem arquivo.",
    padrao: true,
    icone: Newspaper,
    grupo: "Portal público",
  },
  {
    chave: "cadastro_aberto",
    rotulo: "Cadastro de novas contas",
    descricao:
      "Permite criar conta em /register. A conta continua nascendo inativa e só entra depois que você liberar.",
    padrao: true,
    icone: UserPlus,
    grupo: "Portal público",
    perigo: "Desligado, nenhum colega novo consegue se cadastrar.",
  },
]

export const ORDEM_GRUPOS: OpcaoConfiguracao["grupo"][] = [
  "Menu do aluno",
  "O que o aluno pode fazer",
  "Portal público",
]

/** O padrão de cada chave, para preencher o que o banco ainda não tem. */
export function padroes(): Record<ChaveConfiguracao, boolean> {
  const mapa = {} as Record<ChaveConfiguracao, boolean>
  for (const opcao of CONFIGURACOES) mapa[opcao.chave] = opcao.padrao
  return mapa
}

/**
 * Junta o que está no banco com os padrões.
 *
 * Linha ausente não é "desligado", é "nunca foi mexido" — tratar as duas
 * coisas como iguais desligaria o portal inteiro na primeira vez que alguém
 * abrisse a tela, antes de salvar qualquer coisa.
 */
export function montarConfiguracoes(
  linhas: { chave: string; ativo: boolean }[]
): Record<ChaveConfiguracao, boolean> {
  const mapa = padroes()
  const validas = new Set<string>(CONFIGURACOES.map((c) => c.chave))

  for (const linha of linhas) {
    // Chave que saiu do vocabulário fica no banco sem efeito, em vez de virar
    // uma propriedade solta que nenhuma tela sabe ler.
    if (validas.has(linha.chave)) mapa[linha.chave as ChaveConfiguracao] = linha.ativo
  }

  return mapa
}

export function ehChaveValida(chave: string): chave is ChaveConfiguracao {
  return CONFIGURACOES.some((c) => c.chave === chave)
}
