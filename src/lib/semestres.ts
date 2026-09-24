// src/lib/semestres.ts

/**
 * Qual semestre está em curso, e o que isso libera.
 *
 * Regras puras, sem Prisma: a tela só desenha o que sai daqui, e o teste
 * cobre a escolha sem precisar de banco.
 */

export type SemestreBase = { id: string; ano: number; periodo: number }

/** Do mais recente para o mais antigo — a ordem em que a lista aparece. */
export function ordenarSemestres<T extends SemestreBase>(semestres: T[]): T[] {
  return [...semestres].sort((a, b) => b.ano - a.ano || b.periodo - a.periodo)
}

/**
 * O semestre vigente: o mais recente entre os que já chegaram.
 *
 * "Já chegaram" é ano menor ou igual ao ano corrente. É isso que protege o
 * semestre em curso quando o ADMIN cadastra o próximo com antecedência: em
 * 2026, criar 2027/1 não pode tirar 2026/2 de vigente e travar o cadastro de
 * matéria no meio do semestre.
 *
 * Se todos forem futuros — só há 2027 e estamos em 2026 — devolve o mais
 * próximo de chegar, porque deixar a tela sem semestre nenhum seria pior.
 */
export function semestreVigente<T extends SemestreBase>(
  semestres: T[],
  hoje = new Date()
): T | null {
  if (semestres.length === 0) return null

  const anoAtual = hoje.getFullYear()
  const jaChegaram = semestres.filter((s) => s.ano <= anoAtual)

  if (jaChegaram.length > 0) return ordenarSemestres(jaChegaram)[0]

  // Todos no futuro: o mais próximo é o menor deles.
  return ordenarSemestres(semestres).at(-1) ?? null
}

/**
 * Se dá para cadastrar matéria neste semestre.
 *
 * Só no vigente. Semestre passado é histórico — mexer nele reescreveria o que
 * a turma já cursou. Semestre futuro ainda não começou, e uma matéria criada
 * lá sumiria da tela de todo mundo até a virada do ano.
 */
export function podeCadastrarNoSemestre(
  semestreId: string | null,
  vigente: SemestreBase | null
): boolean {
  if (!semestreId || !vigente) return false
  return semestreId === vigente.id
}

/** Por que o cadastro está travado, para a tela explicar em vez de só desabilitar. */
export function motivoSemCadastro<T extends SemestreBase>(
  selecionado: T | null,
  vigente: T | null
): string | null {
  if (!vigente) return "Cadastre um semestre antes de criar matérias."
  if (!selecionado) return "Escolha um semestre para cadastrar a matéria nele."
  if (selecionado.id === vigente.id) return null

  const ehPassado =
    selecionado.ano < vigente.ano ||
    (selecionado.ano === vigente.ano && selecionado.periodo < vigente.periodo)

  return ehPassado
    ? `${selecionado.ano}/${selecionado.periodo} já passou. Só dá para cadastrar no semestre em curso.`
    : `${selecionado.ano}/${selecionado.periodo} ainda não começou. Só dá para cadastrar no semestre em curso.`
}
