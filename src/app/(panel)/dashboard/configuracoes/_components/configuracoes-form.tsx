"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { atualizarLoja } from "../_actions/atualizar-loja"
import type { ConfiguracaoLojaState } from "../_actions/atualizar-loja"
import { CheckCircle, Printer, PackageCheck } from "lucide-react"

const UFS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA",
  "MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN",
  "RO","RR","RS","SC","SE","SP","TO",
]

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
    >
      {pending ? "Salvando..." : "Salvar alterações"}
    </button>
  )
}

type LojaData = {
  nome: string
  nomeExibicao: string | null
  email: string
  telefone: string | null
  cnpjCpf: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  siteUrl: string | null
  logoUrl: string | null
}

export function ConfiguracoesForm({
  loja,
  tipoImpressao,
}: {
  loja: LojaData
  tipoImpressao: "PROPRIO" | "ADMIN_COURTESYFY"
}) {
  const [state, formAction] = useActionState<ConfiguracaoLojaState, FormData>(atualizarLoja, {})
  const [logoUrl, setLogoUrl] = useState(loja.logoUrl ?? "")
  const [impressao, setImpressao] = useState<"PROPRIO" | "ADMIN_COURTESYFY">(tipoImpressao)
  const fe = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-8">
      {state.success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-2 text-emerald-700 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Configurações salvas com sucesso.
        </div>
      )}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      {/* Dados básicos */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Dados da loja</h2>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome da loja <span className="text-red-500">*</span>
              </label>
              <input
                name="nome"
                defaultValue={loja.nome}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {fe.nome && <p className="text-red-500 text-xs mt-1">{fe.nome[0]}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome de exibição{" "}
                <span className="text-gray-400 font-normal text-xs">(aparece na landing page)</span>
              </label>
              <input
                name="nomeExibicao"
                defaultValue={loja.nomeExibicao ?? ""}
                placeholder={loja.nome}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-mail comercial <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                defaultValue={loja.email}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {fe.email && <p className="text-red-500 text-xs mt-1">{fe.email[0]}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
              <input
                name="telefone"
                defaultValue={loja.telefone ?? ""}
                placeholder="(11) 99999-9999"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CNPJ / CPF</label>
              <input
                name="cnpjCpf"
                defaultValue={loja.cnpjCpf ?? ""}
                placeholder="00.000.000/0001-00"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Site</label>
              <input
                name="siteUrl"
                type="url"
                defaultValue={loja.siteUrl ?? ""}
                placeholder="https://sualoja.com.br"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {fe.siteUrl && <p className="text-red-500 text-xs mt-1">{fe.siteUrl[0]}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Endereço */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Endereço</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Logradouro</label>
              <input
                name="logradouro"
                defaultValue={loja.logradouro ?? ""}
                placeholder="Rua, Avenida..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Número</label>
              <input
                name="numero"
                defaultValue={loja.numero ?? ""}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Complemento</label>
              <input
                name="complemento"
                defaultValue={loja.complemento ?? ""}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bairro</label>
              <input
                name="bairro"
                defaultValue={loja.bairro ?? ""}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CEP</label>
              <input
                name="cep"
                defaultValue={loja.cep ?? ""}
                placeholder="00000-000"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
              <input
                name="cidade"
                defaultValue={loja.cidade ?? ""}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">UF</label>
              <select
                name="estado"
                defaultValue={loja.estado ?? ""}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">—</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Logo URL — ainda usada na landing page e totem */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Logo da loja</h2>
        <p className="text-sm text-gray-500 mb-4">
          Aparece na landing page das chaves e no totem de resgate.{" "}
          <a href="/dashboard/layout" className="text-emerald-600 hover:underline">
            Cores e imagens dos cards → Layout
          </a>
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            URL do logo{" "}
            <span className="text-gray-400 font-normal text-xs">(link de imagem)</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              name="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://sualoja.com.br/logo.png"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Preview do logo"
                className="w-10 h-10 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
          </div>
          {fe.logoUrl && <p className="text-red-500 text-xs mt-1">{fe.logoUrl[0]}</p>}
        </div>
      </section>

      {/* Modo de Impressão */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Modo de impressão</h2>
        <p className="text-sm text-gray-500 mb-4">
          Define como os cards das campanhas serão impressos. Pode ser alterado a qualquer momento.
        </p>
        <input type="hidden" name="tipoImpressao" value={impressao} />
        <div className="grid sm:grid-cols-2 gap-3">
          {/* PROPRIO */}
          <button
            type="button"
            onClick={() => setImpressao("PROPRIO")}
            className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
              impressao === "PROPRIO"
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              impressao === "PROPRIO" ? "bg-emerald-100" : "bg-gray-100"
            }`}>
              <Printer className={`w-4 h-4 ${impressao === "PROPRIO" ? "text-emerald-600" : "text-gray-400"}`} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${impressao === "PROPRIO" ? "text-emerald-700" : "text-gray-700"}`}>
                Imprimir por conta própria
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Você mesmo imprime os cards. Faça o download do PDF gerado na plataforma. Grátis.
              </p>
            </div>
          </button>

          {/* ADMIN_COURTESYFY */}
          <button
            type="button"
            onClick={() => setImpressao("ADMIN_COURTESYFY")}
            className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
              impressao === "ADMIN_COURTESYFY"
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              impressao === "ADMIN_COURTESYFY" ? "bg-emerald-100" : "bg-gray-100"
            }`}>
              <PackageCheck className={`w-4 h-4 ${impressao === "ADMIN_COURTESYFY" ? "text-emerald-600" : "text-gray-400"}`} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${impressao === "ADMIN_COURTESYFY" ? "text-emerald-700" : "text-gray-700"}`}>
                Solicitar ao Courtesyfy
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                O Courtesyfy imprime e entrega os cards para você. Sujeito a disponibilidade e pagamento.
              </p>
            </div>
          </button>
        </div>
      </section>

      <div className="flex justify-end pt-2">
        <SaveButton />
      </div>
    </form>
  )
}
