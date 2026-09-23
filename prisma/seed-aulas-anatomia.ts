/**
 * Temas das aulas presenciais de Anatomia, e a matéria dada em 19/09.
 *
 * Uso:  npm run db:aulas-anatomia
 *
 * O conteúdo é o consolidado das anotações da Amanda e da Aldira sobre o
 * Sistema Respiratório, com as correções anatômicas revisadas.
 *
 * É idempotente: só grava o tema onde ainda não há, e só grava o conteúdo
 * onde o campo está vazio. Aula que já tenha texto escrito pela tela é
 * pulada com aviso — o seed não sobrescreve trabalho de ninguém.
 */
import { PrismaClient } from "../src/generated/prisma"
import { dataDeEncontro } from "../src/lib/datas"
import { sanitizarHtml } from "../src/lib/sanitizar"

const prisma = new PrismaClient()

const SISTEMA_RESPIRATORIO = `
<h2>1. Definição e funções</h2>
<p>Conjunto de órgãos responsável pela <strong>captação de O₂</strong> e <strong>eliminação de CO₂</strong>.</p>
<ul>
<li>Hematose (troca gasosa)</li>
<li>Filtração, aquecimento e umidificação do ar</li>
<li>Regulação do pH sanguíneo</li>
<li>Fonação</li>
</ul>

<h2>2. As duas zonas</h2>
<table><tbody>
<tr><th>Zona de condução</th><th>Zona respiratória</th></tr>
<tr><td>Só transporta o ar — <strong>não há troca gasosa</strong></td><td>Onde ocorre a <strong>hematose</strong></td></tr>
<tr><td>Do nariz até os bronquíolos terminais</td><td>Dos bronquíolos respiratórios até os alvéolos</td></tr>
</tbody></table>

<h2>3. Vias aéreas superiores</h2>
<ol>
<li><strong>Cavidade nasal</strong> — filtra, aquece e umidifica (sistema mucociliar, rico em muco)</li>
<li><strong>Nasofaringe</strong></li>
<li><strong>Orofaringe</strong></li>
<li><strong>Laringofaringe</strong></li>
<li><strong>Laringe</strong></li>
</ol>
<h3>Referências de posição</h3>
<ul>
<li><strong>Epiglote</strong> — abaixo da língua e <strong>acima</strong> da entrada da laringe. Fecha a laringe durante a deglutição.</li>
<li><strong>Glote</strong> — abaixo da epiglote.</li>
<li><strong>Esôfago</strong> — atrás da laringe e da traqueia.</li>
</ul>

<h2>4. Vias aéreas inferiores — árvore brônquica</h2>
<ol>
<li>Traqueia</li>
<li>Carina — final da traqueia, onde ela se bifurca</li>
<li>Brônquios principais — direito e esquerdo</li>
<li>Brônquios lobares</li>
<li>Brônquios segmentares</li>
<li>Bronquíolos</li>
<li>Bronquíolos terminais — <em>fim da zona de condução</em></li>
<li>Bronquíolos respiratórios — <em>início da zona respiratória</em></li>
<li>Ductos alveolares</li>
<li>Sacos alveolares</li>
<li>Alvéolos</li>
</ol>
<blockquote><p><strong>Brônquio × bronquíolo:</strong> brônquio tem cartilagem na parede; bronquíolo não tem.</p></blockquote>

<h2>5. Pulmões</h2>
<ul>
<li><strong>Direito — 3 lobos:</strong> superior, médio e inferior</li>
<li><strong>Esquerdo — 2 lobos:</strong> superior e inferior</li>
<li>Cada lobo se subdivide em <strong>segmentos</strong></li>
</ul>
<blockquote><p><strong>Terminologia cirúrgica:</strong> <em>-tomia</em> = corte, incisão (toracotomia). <em>-ectomia</em> = retirada (lobectomia, pneumectomia).</p></blockquote>

<h2>6. Pleuras</h2>
<ul>
<li><strong>Pleura parietal</strong> — reveste a parede interna da caixa torácica</li>
<li><strong>Pleura visceral</strong> — membrana aderida diretamente ao pulmão</li>
<li>Entre as duas fica o <strong>espaço pleural</strong>, com cerca de <strong>10 ml de líquido pleural</strong></li>
</ul>

<h2>7. Mecânica respiratória</h2>
<h3>Inspiração — movimento cranial (para cima e para fora)</h3>
<p><strong>Fase ativa:</strong> exige contração muscular. O diafragma contrai e desce, o volume da caixa aumenta, a pressão interna diminui (pressão negativa) e <strong>o ar entra</strong>.</p>
<ul>
<li><strong>Diafragma</strong> — principal</li>
<li><strong>Intercostais externos</strong> — aumentam a amplitude da caixa</li>
<li><strong>Acessórios:</strong> esternocleidomastóideo, escalenos, serrátil anterior, peitoral menor</li>
</ul>
<h3>Expiração — movimento caudal (para baixo e para dentro)</h3>
<ul>
<li><strong>Passiva</strong> em repouso: o diafragma relaxa e sobe, o volume diminui, a pressão aumenta e <strong>o ar sai</strong></li>
<li><strong>Ativa</strong> na expiração forçada</li>
</ul>
<p><strong>Músculos da expiração forçada:</strong> reto abdominal, oblíquos interno e externo, transverso do abdome, intercostais internos.</p>

<h2>8. Volumes e frequência</h2>
<ul>
<li><strong>12 a 20</strong> ciclos respiratórios por minuto</li>
<li><strong>Volume corrente:</strong> cerca de <strong>500 ml</strong> por inspiração</li>
<li>Desses, cerca de <strong>150 ml</strong> ficam no <strong>espaço morto anatômico</strong> e apenas <strong>~350 ml</strong> chegam aos alvéolos</li>
<li>Cerca de <strong>5 litros de sangue</strong> circulam por minuto</li>
</ul>

<h2>9. Controle da respiração</h2>
<ul>
<li><strong>Centro respiratório:</strong> bulbo raquidiano</li>
<li>Regulado <strong>principalmente pela concentração de CO₂</strong> no sangue — não pela de O₂</li>
<li>CO₂ alto → respiração mais rápida</li>
</ul>

<h2>Exercícios</h2>
<ol>
<li>Escreva a condução do ar pelas vias aéreas superiores e inferiores em que <strong>não</strong> há troca gasosa.</li>
<li>Escreva os músculos inspiratórios.</li>
<li>Quais as regiões do pulmão que realizam a troca gasosa.</li>
</ol>

<hr>
<p><em>Consolidado das anotações da Amanda e da Aldira, com as correções anatômicas revisadas.</em></p>
`.trim()

const AULAS = [
  { data: "2026-08-08", titulo: "Sistema Cardiovascular", conteudo: null },
  { data: "2026-08-22", titulo: "Sistema Cardiovascular", conteudo: null },
  { data: "2026-09-19", titulo: "Sistema Respiratório", conteudo: SISTEMA_RESPIRATORIO },
  { data: "2026-10-17", titulo: "Sistema Digestório", conteudo: null },
]

async function main() {
  const materia = await prisma.materia.findFirst({
    where: { nome: { contains: "ANATOMIA" }, modalidade: "PRESENCIAL" },
    select: { id: true, nome: true },
  })

  if (!materia) {
    console.error("\n✖ Anatomia presencial não encontrada.\n")
    process.exit(1)
  }

  console.log(`\n${materia.nome}\n`)

  for (const item of AULAS) {
    const aula = await prisma.aula.findFirst({
      where: { materiaId: materia.id, data: dataDeEncontro(item.data), donoId: null },
      select: { id: true, titulo: true, conteudo: true },
    })

    const dia = item.data.split("-").reverse().join("/")

    if (!aula) {
      console.warn(`  ⚠ ${dia} — não existe encontro nessa data.`)
      continue
    }

    const dados: { titulo?: string; conteudo?: string } = {}

    if (aula.titulo !== item.titulo) dados.titulo = item.titulo

    if (item.conteudo) {
      if (aula.conteudo && aula.conteudo.trim().length > 0) {
        console.warn(`  ⚠ ${dia} — já tem matéria escrita, não vou sobrescrever.`)
      } else {
        // Pelo mesmo caminho da tela: o que entra no banco já sai limpo.
        dados.conteudo = sanitizarHtml(item.conteudo)
      }
    }

    if (Object.keys(dados).length === 0) {
      console.log(`  · ${dia} — ${item.titulo} (já estava)`)
      continue
    }

    await prisma.aula.update({ where: { id: aula.id }, data: dados })
    console.log(
      `  ✔ ${dia} — ${item.titulo}${dados.conteudo ? " (com a matéria dada)" : ""}`
    )
  }

  console.log("")
}

main()
  .catch((erro) => {
    console.error("Falha ao gravar as aulas:", erro)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
