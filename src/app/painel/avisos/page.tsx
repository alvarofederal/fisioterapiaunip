import { Megaphone, Archive, Globe, EyeOff } from "lucide-react"
import prisma from "@/lib/prisma"
import { exigirRotaLiberada } from "@/lib/porta-de-rota"
import { cn } from "@/lib/utils"
import { DialogoAviso } from "./_components/dialogo-aviso"
import { AcoesAviso } from "./_components/acoes-aviso"

export const metadata = { title: "Avisos" }

export default async function PaginaAvisos() {
  const { ehAdmin } = await exigirRotaLiberada("menu_avisos")

  // O ADMIN precisa ver os guardados para trazê-los de volta; o aluno, não —
  // para ele um aviso desligado simplesmente não existe.
  const avisos = await prisma.aviso.findMany({
    where: ehAdmin ? {} : { ativo: true },
    orderBy: [{ ativo: "desc" }, { ordem: "asc" }, { criadoEm: "desc" }],
    select: {
      id: true,
      titulo: true,
      conteudo: true,
      ordem: true,
      ativo: true,
      publico: true,
      atualizadoEm: true,
    },
  })

  const noMural = avisos.filter((a) => a.ativo).length

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="titulo-display text-[30px] md:text-[38px]">Avisos</h1>
          <p className="mt-2 max-w-[620px] text-[15px] leading-relaxed text-fog">
            Recados que valem o semestre inteiro. Ficam fixos aqui e no topo da tela inicial —
            não vencem nem somem sozinhos.
          </p>
        </div>
        {ehAdmin && <DialogoAviso />}
      </header>

      {avisos.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-ember-orange/15 text-ember-orange">
            <Megaphone size={26} aria-hidden />
          </span>
          <h2 className="titulo-display text-[22px]">Nenhum aviso no mural</h2>
          <p className="max-w-[460px] text-[15px] leading-relaxed text-fog">
            {ehAdmin
              ? "Publique o primeiro recado fixo. Ele aparece aqui e abre a tela inicial da turma."
              : "Quando o representante publicar um recado, ele aparece aqui."}
          </p>
          {ehAdmin && <DialogoAviso />}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {ehAdmin && noMural !== avisos.length && (
            <p className="text-[12px] text-greyple">
              {noMural} no mural · {avisos.length - noMural} guardado(s), que só você vê
            </p>
          )}

          {avisos.map((aviso) => (
            <article
              key={aviso.id}
              className={cn(
                "acento-lateral overflow-hidden rounded-2xl border bg-white/[0.04] p-6 pl-7",
                aviso.ativo ? "border-white/10" : "border-white/10 opacity-60"
              )}
              style={{ ["--acento" as string]: aviso.ativo ? "#fda220" : "#50555f" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="titulo-display text-[19px] leading-tight">{aviso.titulo}</h2>
                <span className="flex shrink-0 flex-wrap items-center gap-2">
                  {ehAdmin &&
                    (aviso.publico ? (
                      <span
                        title="Aparece fora do portal, para qualquer pessoa"
                        className="inline-flex items-center gap-1.5 rounded-full bg-vivid-cerulean/15 px-2.5 py-1 text-[11px] font-semibold text-vivid-cerulean"
                      >
                        <Globe size={11} aria-hidden />
                        Público
                      </span>
                    ) : (
                      <span
                        title="Só quem entra no portal vê"
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-greyple"
                      >
                        <EyeOff size={11} aria-hidden />
                        Só no portal
                      </span>
                    ))}

                  {!aviso.ativo && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-greyple">
                      <Archive size={11} aria-hidden />
                      Guardado
                    </span>
                  )}
                </span>
              </div>

              {/* HTML limpo por allowlist na gravação (src/lib/sanitizar.ts). */}
              <div
                className="conteudo-rico mt-3 text-[15px] leading-relaxed text-fog"
                dangerouslySetInnerHTML={{ __html: aviso.conteudo }}
              />

              {ehAdmin && (
                <div className="mt-4">
                  <AcoesAviso
                    aviso={{
                      id: aviso.id,
                      titulo: aviso.titulo,
                      conteudo: aviso.conteudo,
                      ordem: aviso.ordem,
                      ativo: aviso.ativo,
                      publico: aviso.publico,
                    }}
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
