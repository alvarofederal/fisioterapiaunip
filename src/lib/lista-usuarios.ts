// src/lib/lista-usuarios.ts
//
// Filtro e ordenação da tabela de usuários do ADMIN. Funções puras: a página
// só lê o banco e entrega a lista; o que aparece, e em que ordem, é decidido
// aqui (tests/unit/lista-usuarios.test.ts).

import { z } from "zod"

export type UsuarioDaTabela = {
  id: string
  nome: string
  email: string
  ra: string
  role: "ADMIN" | "ALUNO"
  ativo: boolean
  ultimoAcesso: Date | null
}

/**
 * O que vem na URL (?situacao=&ordem=&dir=). Valor desconhecido ou repetido
 * volta para o padrão em vez de quebrar a página.
 */
export const parametrosDaTabela = z.object({
  situacao: z.enum(["todos", "aguardando", "ativos"]).catch("todos"),
  ordem: z.enum(["padrao", "nome", "login"]).catch("padrao"),
  dir: z.enum(["asc", "desc"]).optional().catch(undefined),
})

export type ParametrosDaTabela = z.infer<typeof parametrosDaTabela>
export type Situacao = ParametrosDaTabela["situacao"]
export type Ordem = ParametrosDaTabela["ordem"]
export type Direcao = "asc" | "desc"

/** Direção de quem clica pela primeira vez: nome de A a Z, login do mais recente. */
export const DIRECAO_INICIAL: Record<Exclude<Ordem, "padrao">, Direcao> = {
  nome: "asc",
  login: "desc",
}

export function filtrarPorSituacao(usuarios: UsuarioDaTabela[], situacao: Situacao): UsuarioDaTabela[] {
  if (situacao === "aguardando") return usuarios.filter((u) => !u.ativo)
  if (situacao === "ativos") return usuarios.filter((u) => u.ativo)
  return usuarios
}

const porNome = (a: UsuarioDaTabela, b: UsuarioDaTabela) =>
  a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })

/**
 * - padrão: quem aguarda liberação primeiro (é a fila de trabalho do ADMIN), depois por nome;
 * - nome: A→Z ou Z→A, sem diferenciar maiúscula e acento;
 * - login: mais recente primeiro (ou o contrário). Quem nunca entrou fica
 *   sempre no fim — "nunca" não é "há muito tempo".
 */
export function ordenarUsuarios(
  usuarios: UsuarioDaTabela[],
  ordem: Ordem,
  dir?: Direcao
): UsuarioDaTabela[] {
  const lista = [...usuarios]

  if (ordem === "nome") {
    const sinal = (dir ?? DIRECAO_INICIAL.nome) === "desc" ? -1 : 1
    return lista.sort((a, b) => sinal * porNome(a, b))
  }

  if (ordem === "login") {
    const sinal = (dir ?? DIRECAO_INICIAL.login) === "desc" ? -1 : 1
    return lista.sort((a, b) => {
      if (!a.ultimoAcesso || !b.ultimoAcesso) {
        if (a.ultimoAcesso) return -1
        if (b.ultimoAcesso) return 1
        return porNome(a, b)
      }
      return sinal * (a.ultimoAcesso.getTime() - b.ultimoAcesso.getTime()) || porNome(a, b)
    })
  }

  return lista.sort((a, b) => Number(a.ativo) - Number(b.ativo) || porNome(a, b))
}
