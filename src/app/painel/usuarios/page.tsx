import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowDown, ArrowUp, ArrowUpDown, Clock } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { iniciaisDe } from "@/lib/dominio"
import { dataHoraNoBrasil, ultimoLoginTexto } from "@/lib/datas"
import {
  DIRECAO_INICIAL,
  filtrarPorSituacao,
  ordenarUsuarios,
  parametrosDaTabela,
  type ParametrosDaTabela,
  type Situacao,
  type UsuarioDaTabela,
} from "@/lib/lista-usuarios"
import { AcoesUsuario } from "./_components/acoes-usuario"

export const metadata = { title: "Usuários" }

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function PaginaUsuarios({ searchParams }: Props) {
  const sessao = await auth()
  if (!sessao?.user) redirect("/login")

  // O papel é lido do BANCO, não do token: um admin rebaixado continuaria
  // passando por aqui até o token expirar. Esta é a tela mais sensível.
  const eu = await prisma.user.findUnique({
    where: { id: sessao.user.id },
    select: { id: true, role: true, ativo: true },
  })
  if (!eu?.ativo || eu.role !== "ADMIN") redirect("/painel")

  const usuarios: UsuarioDaTabela[] = await prisma.user.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      ra: true,
      role: true,
      ativo: true,
      ultimoAcesso: true,
    },
  })

  // Filtro e ordem vêm da URL: o ADMIN pode voltar, recarregar ou mandar o link.
  const params = parametrosDaTabela.parse(await searchParams)
  const visiveis = ordenarUsuarios(filtrarPorSituacao(usuarios, params.situacao), params.ordem, params.dir)

  const pendentes = usuarios.filter((u) => !u.ativo).length
  // Um "agora" só para a página inteira: todas as linhas contam do mesmo instante.
  const agora = new Date()

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="titulo-display text-[28px] md:text-[34px]">Usuários</h1>
        <p className="text-[14px] text-fog">
          {usuarios.length} {usuarios.length === 1 ? "conta" : "contas"}
          {pendentes > 0 && (
            <>
              {" · "}
              <strong className="font-semibold text-ember-orange">{pendentes} aguardando</strong>
            </>
          )}
        </p>
      </header>

      {pendentes > 0 && (
        <p className="flex items-start gap-2 rounded-xl border border-ember-orange/30 bg-ember-orange/[0.07] px-3.5 py-2.5 text-[13px] leading-relaxed text-fog">
          <Clock size={15} className="mt-0.5 shrink-0 text-ember-orange" aria-hidden />
          Confira o RA na lista da turma antes de liberar — é o RA que garante que a pessoa
          é mesmo da sala.
        </p>
      )}

      <FiltroSituacao params={params} total={usuarios.length} pendentes={pendentes} />

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
        <table className="w-full text-left">
          <caption className="sr-only">
            Contas do portal. Use os cabeçalhos Nome e Último login para ordenar.
          </caption>
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-[0.08em] text-greyple">
              <CabecalhoOrdenavel coluna="nome" rotulo="Nome" params={params} />
              <th scope="col" className="hidden px-3 py-2.5 lg:table-cell">
                E-mail
              </th>
              <th scope="col" className="hidden px-3 py-2.5 sm:table-cell">
                RA
              </th>
              <th scope="col" className="hidden px-3 py-2.5 lg:table-cell">
                Papel
              </th>
              <th scope="col" className="hidden px-3 py-2.5 sm:table-cell">
                Situação
              </th>
              <CabecalhoOrdenavel coluna="login" rotulo="Último login" params={params} />
              <th scope="col" className="px-2 py-2.5">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.07]">
            {visiveis.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-[13px] text-fog">
                  {MENSAGEM_VAZIA[params.situacao]}
                </td>
              </tr>
            ) : (
              visiveis.map((usuario) => (
                <LinhaUsuario
                  key={usuario.id}
                  usuario={usuario}
                  agora={agora}
                  souEu={usuario.id === eu.id}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const MENSAGEM_VAZIA: Record<Situacao, string> = {
  todos: "Nenhuma conta cadastrada.",
  aguardando: "Ninguém aguardando liberação.",
  ativos: "Nenhuma conta com acesso.",
}

/** Monta o link da tabela mudando só o que foi pedido; o que é padrão não vai para a URL. */
function hrefDaTabela(atual: ParametrosDaTabela, mudanca: Partial<ParametrosDaTabela>): string {
  const p = { ...atual, ...mudanca }
  const query = new URLSearchParams()
  if (p.situacao !== "todos") query.set("situacao", p.situacao)
  if (p.ordem !== "padrao") {
    query.set("ordem", p.ordem)
    if (p.dir && p.dir !== DIRECAO_INICIAL[p.ordem]) query.set("dir", p.dir)
  }
  const texto = query.toString()
  return texto ? `/painel/usuarios?${texto}` : "/painel/usuarios"
}

function FiltroSituacao({
  params,
  total,
  pendentes,
}: {
  params: ParametrosDaTabela
  total: number
  pendentes: number
}) {
  const opcoes: { valor: Situacao; rotulo: string; quantos: number }[] = [
    { valor: "todos", rotulo: "Todos", quantos: total },
    { valor: "aguardando", rotulo: "Aguardando", quantos: pendentes },
    { valor: "ativos", rotulo: "Com acesso", quantos: total - pendentes },
  ]

  return (
    <nav aria-label="Filtrar por situação" className="flex flex-wrap gap-1.5">
      {opcoes.map(({ valor, rotulo, quantos }) => {
        const atual = params.situacao === valor
        return (
          <Link
            key={valor}
            href={hrefDaTabela(params, { situacao: valor })}
            scroll={false}
            aria-current={atual ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] transition-colors",
              atual ? "bg-white/[0.1] text-white" : "text-fog hover:bg-white/[0.05] hover:text-white"
            )}
          >
            {rotulo}
            <span
              className={cn(
                "tabular-nums",
                valor === "aguardando" && quantos > 0 ? "text-ember-orange" : "text-greyple"
              )}
            >
              {quantos}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

/** Cabeçalho que ordena ao clicar; clicar de novo inverte. */
function CabecalhoOrdenavel({
  coluna,
  rotulo,
  params,
}: {
  coluna: "nome" | "login"
  rotulo: string
  params: ParametrosDaTabela
}) {
  const ativa = params.ordem === coluna
  const dirAtual = ativa ? (params.dir ?? DIRECAO_INICIAL[coluna]) : undefined
  const proxima = ativa ? (dirAtual === "asc" ? "desc" : "asc") : undefined
  const Seta = !ativa ? ArrowUpDown : dirAtual === "asc" ? ArrowUp : ArrowDown

  return (
    <th
      scope="col"
      aria-sort={!ativa ? "none" : dirAtual === "asc" ? "ascending" : "descending"}
      // No celular o rótulo pode quebrar: "Último login" numa linha só roubava espaço do nome.
      className="px-3 py-2.5 sm:whitespace-nowrap"
    >
      <Link
        href={hrefDaTabela(params, { ordem: coluna, dir: proxima })}
        scroll={false}
        className={cn(
          "inline-flex items-center gap-1 rounded transition-colors hover:text-white",
          ativa && "text-white"
        )}
      >
        {rotulo}
        <Seta size={12} aria-hidden className={cn(!ativa && "opacity-50")} />
      </Link>
    </th>
  )
}

function SeloAguardando({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full bg-ember-orange/15 px-2 py-0.5 text-[11px] font-semibold text-ember-orange",
        className
      )}
    >
      Aguardando
    </span>
  )
}

function SeloAdministrador({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] font-semibold text-white",
        className
      )}
    >
      Administrador
    </span>
  )
}

function LinhaUsuario({
  usuario,
  agora,
  souEu,
}: {
  usuario: UsuarioDaTabela
  agora: Date
  souEu: boolean
}) {
  const admin = usuario.role === "ADMIN"

  return (
    <tr className="transition-colors hover:bg-white/[0.03]">
      {/* w-full + max-w-0: a coluna do nome fica com o espaço que sobra e corta
          com reticências, em vez de empurrar a tabela para fora da tela. */}
      <td className="w-full max-w-0 px-3 py-2">
        <div className="flex items-center gap-3">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback
              className={cn("text-[11px]", usuario.ativo ? "bg-blurple" : "bg-[#2c2f33] text-greyple")}
            >
              {iniciaisDe(usuario.nome)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            {/* No celular o nome quebra linha em vez de virar "Aldira Alv…". */}
            <p className="break-words text-[14px] font-medium leading-snug text-white sm:truncate">
              {usuario.nome}
            </p>
            {/* Nas telas em que as colunas somem, o que elas mostrariam vem aqui.
                O RA vai antes do e-mail: e-mail comprido não pode cortar o RA. */}
            <p className="truncate text-[12px] leading-snug text-fog lg:hidden">
              <span className="font-mono text-greyple sm:hidden">RA {usuario.ra} · </span>
              {usuario.email}
            </p>
            {(admin || !usuario.ativo) && (
              <p className={cn("mt-1 flex flex-wrap gap-1.5", admin ? "lg:hidden" : "sm:hidden")}>
                {admin && <SeloAdministrador className="lg:hidden" />}
                {!usuario.ativo && <SeloAguardando className="sm:hidden" />}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="hidden max-w-[260px] truncate px-3 py-2 text-[13px] text-fog lg:table-cell">
        {usuario.email}
      </td>
      <td className="hidden whitespace-nowrap px-3 py-2 font-mono text-[12px] text-greyple sm:table-cell">
        {usuario.ra}
      </td>
      <td className="hidden whitespace-nowrap px-3 py-2 lg:table-cell">
        {admin ? <SeloAdministrador /> : <span className="text-[13px] text-fog">Aluno</span>}
      </td>
      <td className="hidden whitespace-nowrap px-3 py-2 sm:table-cell">
        {usuario.ativo ? <span className="text-[13px] text-fog">Ativo</span> : <SeloAguardando />}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-[13px]">
        {/* É o último login com senha: a sessão dura 30 dias, então quem segue
            logado pode estar usando o portal com um login antigo. */}
        {usuario.ultimoAcesso ? (
          <time
            dateTime={usuario.ultimoAcesso.toISOString()}
            title={dataHoraNoBrasil(usuario.ultimoAcesso)}
            className="text-fog"
          >
            {ultimoLoginTexto(usuario.ultimoAcesso, agora)}
          </time>
        ) : (
          <span className="text-greyple">Nunca</span>
        )}
      </td>
      <td className="px-2 py-2 text-right">
        <AcoesUsuario
          usuarioId={usuario.id}
          nome={usuario.nome}
          ativo={usuario.ativo}
          role={usuario.role}
          souEu={souEu}
        />
      </td>
    </tr>
  )
}
