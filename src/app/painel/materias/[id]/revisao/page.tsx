import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { rotuloSemestre } from "@/lib/dominio"
import { anotacoesParaRevisao, PROGRESSO_VAZIO, type UnidadeComProgresso } from "@/lib/unidades"
import { BotaoImprimir } from "./_components/botao-imprimir"

export const metadata = { title: "Revisão" }

/**
 * A folha de revisão da matéria: os resumos que o aluno escreveu, em ordem.
 *
 * Vira PDF pelo "Salvar como PDF" do navegador, não por biblioteca. O texto
 * sai de verdade — selecionável e pesquisável —, a fonte é a mesma da tela e
 * nada disso pesa no bundle nem no limite de corpo da função serverless.
 */
export default async function PaginaRevisao({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const sessao = await auth()
  if (!sessao?.user?.id) redirect("/login")

  const { id } = await params
  const usuarioId = sessao.user.id

  const materia = await prisma.materia.findUnique({
    where: { id },
    include: {
      semestre: { select: { ano: true, periodo: true } },
      unidades: {
        orderBy: { numero: "asc" },
        include: {
          teleaulas: {
            orderBy: { numero: "asc" },
            // Só o estudo de quem está lendo: resumo é de cada um.
            include: { estudos: { where: { usuarioId } } },
          },
        },
      },
    },
  })

  if (!materia) notFound()

  const unidades: UnidadeComProgresso[] = materia.unidades.map((u) => ({
    id: u.id,
    numero: u.numero,
    titulo: u.titulo,
    progresso: PROGRESSO_VAZIO,
    teleaulas: u.teleaulas.map((t) => ({
      id: t.id,
      numero: t.numero,
      titulo: t.titulo,
      status: t.estudos[0]?.status ?? "A_ESTUDAR",
      anotacoes: t.estudos[0]?.anotacoes ?? null,
    })),
  }))

  const linhas = anotacoesParaRevisao(unidades)
  const nome = (sessao.user.name ?? "").trim()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Link
          href={`/painel/materias/${materia.id}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-fog transition-colors hover:text-white"
        >
          <ArrowLeft size={15} aria-hidden />
          Voltar para a matéria
        </Link>
        {linhas.length > 0 && <BotaoImprimir />}
      </div>

      {linhas.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center no-print">
          <h1 className="titulo-display text-[22px]">Nada para revisar ainda</h1>
          <p className="max-w-[460px] text-[15px] leading-relaxed text-fog">
            Escreva o resumo de pelo menos uma teleaula e ele aparece aqui, pronto para virar PDF.
          </p>
        </div>
      ) : (
        <article className="folha-revisao rounded-2xl border border-white/10 bg-white/[0.04] p-7 md:p-10">
          <header className="border-b border-white/[0.12] pb-5">
            <h1 className="titulo-display text-[24px] leading-tight md:text-[30px]">
              {materia.nome}
            </h1>
            <p className="mt-2 text-[14px] text-fog">
              Resumo de revisão
              {materia.professor ? ` · ${materia.professor}` : ""}
              {` · ${rotuloSemestre(materia.semestre.ano, materia.semestre.periodo)}`}
            </p>
            {nome && <p className="mt-1 text-[13px] text-greyple">{nome}</p>}
          </header>

          <div className="mt-7 flex flex-col gap-7">
            {linhas.map((linha, indice) => {
              const anterior = linhas[indice - 1]
              const abreUnidade = anterior?.unidade !== linha.unidade

              return (
                <section key={`${linha.unidade}-${linha.teleaula}`} className="flex flex-col gap-2">
                  {abreUnidade && (
                    <h2 className="titulo-display text-[17px] text-hover-blurple">
                      {linha.unidade}
                    </h2>
                  )}
                  <h3 className="text-[14px] font-semibold text-white">{linha.teleaula}</h3>
                  {/* HTML limpo por allowlist na gravacao (src/lib/sanitizar.ts). */}
                  <div
                    className="conteudo-rico text-[14px] leading-relaxed text-fog"
                    dangerouslySetInnerHTML={{ __html: linha.texto }}
                  />
                </section>
              )
            })}
          </div>
        </article>
      )}
    </div>
  )
}
