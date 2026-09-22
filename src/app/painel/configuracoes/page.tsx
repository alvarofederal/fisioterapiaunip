import { redirect } from "next/navigation"
import { SlidersHorizontal, ShieldAlert } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { lerConfiguracoes } from "@/lib/configuracoes-servidor"
import { CONFIGURACOES, ORDEM_GRUPOS } from "@/lib/configuracoes"
import { ChaveConfiguravel } from "./_components/chave-configuravel"

export const metadata = { title: "Configurações" }

export default async function PaginaConfiguracoes() {
  const sessao = await auth()
  if (!sessao?.user?.id) redirect("/login")

  // O papel vem do banco, nunca do token — mesma regra das outras telas de
  // ADMIN. Esconder o item do menu não é proteção.
  const eu = await prisma.user.findUnique({
    where: { id: sessao.user.id },
    select: { role: true },
  })
  if (eu?.role !== "ADMIN") redirect("/painel")

  const ligadas = await lerConfiguracoes()

  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="titulo-display text-[30px] md:text-[38px]">Configurações</h1>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-fog">
          O que a turma vê e o que ela pode fazer. As mudanças valem na hora, para todo mundo —
          não é preciso ninguém sair e entrar de novo.
        </p>
      </header>

      <div className="flex flex-col gap-8">
        {ORDEM_GRUPOS.map((grupo) => {
          const doGrupo = CONFIGURACOES.filter((c) => c.grupo === grupo)
          if (doGrupo.length === 0) return null

          return (
            <section key={grupo} className="flex flex-col gap-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-greyple">
                {grupo}
              </h2>

              <div className="flex flex-col gap-3">
                {doGrupo.map((opcao) => (
                  <ChaveConfiguravel
                    key={opcao.chave}
                    chave={opcao.chave}
                    rotulo={opcao.rotulo}
                    descricao={opcao.descricao}
                    perigo={opcao.perigo}
                    ligada={ligadas[opcao.chave]}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <aside className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-ember-orange" aria-hidden />
        <div>
          <p className="text-[14px] font-medium text-white">
            Desligar esconde de verdade, não só do menu
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-fog">
            A rota também passa a recusar quem tentar abrir pelo endereço direto. Nada é apagado:
            religar traz tudo de volta como estava, com os resumos e as marcações de cada um.
          </p>
        </div>
      </aside>

      <p className="flex items-center gap-2 text-[12px] text-greyple">
        <SlidersHorizontal size={13} aria-hidden />
        Estas opções não afetam o seu acesso de administrador.
      </p>
    </div>
  )
}
