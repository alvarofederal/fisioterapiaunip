"use server"

import { z } from "zod"
import { db } from "@/lib/prisma"
import { sendChaveAtivadaEmail } from "@/lib/email"

const schema = z.object({
  codigo:    z.string().min(1),
  nome:      z.string().max(100).optional(),
  telefone:  z.string().max(20).optional(),
  email:     z.string().email("E-mail inválido").optional().or(z.literal("")),
})

export type AtivarChaveState = {
  success?: boolean
  error?: string
  fieldErrors?: Partial<Record<string, string[]>>
}

function buildBenefit(tipo: string, valor: unknown, premio: string | null) {
  if (tipo === "DESCONTO_PERCENTUAL" && valor)
    return { label: "Desconto especial", destaque: `${valor}% OFF` }
  if (tipo === "DESCONTO_FIXO" && valor)
    return { label: "Desconto especial", destaque: `R$ ${Number(valor).toFixed(2)} OFF` }
  if (tipo === "CASHBACK" && valor)
    return { label: "Cashback", destaque: `${valor}% de volta` }
  if (tipo === "FRETE_GRATIS")
    return { label: "Frete Grátis", destaque: "Frete grátis" }
  if (premio)
    return { label: tipo === "SORTEIO" ? "Sorteio" : "Brinde", destaque: premio }
  return { label: tipo.replace(/_/g, " ").toLowerCase(), destaque: "" }
}

export async function ativarChave(
  _prev: AtivarChaveState,
  formData: FormData,
): Promise<AtivarChaveState> {
  const result = schema.safeParse({
    codigo:   formData.get("codigo"),
    nome:     formData.get("nome"),
    telefone: formData.get("telefone"),
    email:    formData.get("email"),
  })

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { codigo, nome, telefone, email } = result.data

  if (!telefone && !email) {
    return { fieldErrors: { telefone: ["Informe telefone ou e-mail para ativar"] } }
  }

  const chave = await db.chave.findUnique({
    where: { codigo },
    include: {
      campanha: {
        select: {
          nome:            true,
          tipoBeneficio:   true,
          valorBeneficio:  true,
          descricaoPremio: true,
          regrasUso:       true,
          expiraEm:        true,
          status:          true,
        },
      },
      loja: {
        select: {
          nomeExibicao: true,
          nome:         true,
          corPrimaria:  true,
        },
      },
    },
  })

  if (!chave) return { error: "Chave não encontrada" }

  if (chave.status === "RESGATADA")
    return { error: "Esta chave já foi resgatada." }
  if (chave.status === "ATIVADA")
    return { error: "Esta chave já está ativada. Apresente ao lojista para resgatar." }
  if (chave.status === "EXPIRADA" || chave.status === "CANCELADA")
    return { error: "Esta chave não é mais válida." }
  if (chave.campanha.status === "ENCERRADA" || chave.campanha.status === "CANCELADA")
    return { error: "Esta campanha foi encerrada." }
  if (new Date() > chave.campanha.expiraEm) {
    await db.chave.update({ where: { id: chave.id }, data: { status: "EXPIRADA" } })
    return { error: "Esta chave expirou." }
  }

  // ── Criar ou encontrar cliente ───────────────────────────────
  let cliente = await db.cliente.findFirst({
    where: {
      OR: [
        ...(telefone ? [{ telefone }] : []),
        ...(email    ? [{ email }]    : []),
      ],
    },
  })

  if (!cliente) {
    cliente = await db.cliente.create({
      data: { nome: nome || null, telefone: telefone || null, email: email || null, canalOrigem: "WEB" },
    })
  } else {
    // Atualiza os dados do cliente com as informações mais recentes:
    // - nome: sempre atualiza se fornecido (cliente pode corrigir o próprio nome)
    // - telefone/email: preenche apenas se estiver vazio (são chaves de busca)
    const updates: Record<string, string> = {}
    if (nome) updates.nome = nome
    if (telefone && !cliente.telefone) updates.telefone = telefone
    if (email && !cliente.email) updates.email = email

    if (Object.keys(updates).length > 0) {
      cliente = await db.cliente.update({ where: { id: cliente.id }, data: updates })
    }
  }

  // ── Ativar chave ─────────────────────────────────────────────
  await db.chave.update({
    where: { id: chave.id },
    data: { status: "ATIVADA", clienteId: cliente.id, ativadaEm: new Date() },
  })

  await db.logEvento.create({
    data: {
      tipoEvento: "CHAVE_ATIVADA",
      chaveId:    chave.id,
      campanhaId: chave.campanhaId,
      lojaId:     chave.lojaId,
      clienteId:  cliente.id,
      canal:      "WEB",
    },
  })

  // ── Enviar email de confirmação (fire-and-forget) ────────────
  if (email) {
    const nomeLoja = chave.loja.nomeExibicao ?? chave.loja.nome
    const { label, destaque } = buildBenefit(
      chave.campanha.tipoBeneficio,
      chave.campanha.valorBeneficio,
      chave.campanha.descricaoPremio,
    )

    sendChaveAtivadaEmail(email, {
      nomeLoja,
      nomeCampanha:   chave.campanha.nome,
      beneficioLabel: label,
      destaque,
      codigo,
      expiraEm:    new Date(chave.campanha.expiraEm).toLocaleDateString("pt-BR"),
      regrasUso:   chave.campanha.regrasUso,
      corPrimaria: chave.loja.corPrimaria ?? "#10b981",
    }).catch(err => console.error("[email] ativar-chave:", err))
  }

  return { success: true }
}
