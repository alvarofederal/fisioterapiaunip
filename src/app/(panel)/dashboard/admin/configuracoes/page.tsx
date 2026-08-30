import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import {
  Settings, Shield, CreditCard, Zap, Bell, Database,
  Key, Megaphone, Users, Building2, Globe, Lock,
} from "lucide-react"

/* ── Limites por plano ─────────────────────────────────────────────
   Valores atuais do sistema — futuramente vêm do banco de dados
   ────────────────────────────────────────────────────────────────── */
const PLANOS = [
  {
    key: "ESSENCIAL",
    label: "Essencial",
    preco: "Grátis",
    cor: "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/70",
    limites: {
      campanhas: 1,
      chavesPorCampanha: 100,
      usuarios: 1,
      relatorios: false,
      totem: true,
      impressao: false,
    },
  },
  {
    key: "PROFISSIONAL",
    label: "Profissional",
    preco: "R$ 97/mês",
    cor: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    limites: {
      campanhas: 5,
      chavesPorCampanha: 1000,
      usuarios: 3,
      relatorios: true,
      totem: true,
      impressao: true,
    },
  },
  {
    key: "EMPRESARIAL",
    label: "Empresarial",
    preco: "R$ 297/mês",
    cor: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    limites: {
      campanhas: 999,
      chavesPorCampanha: 10000,
      usuarios: 999,
      relatorios: true,
      totem: true,
      impressao: true,
    },
  },
]

function Check() {
  return <span className="text-emerald-500">✓</span>
}
function Cross() {
  return <span className="text-gray-300 dark:text-white/20">✕</span>
}

export default async function AdminConfiguracoesPage() {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard")

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-white/[0.07] border border-gray-200 dark:border-white/10">
          <Settings className="w-5 h-5 dash-muted" />
        </div>
        <div>
          <h1 className="text-2xl font-bold dash-title">Configurações da Plataforma</h1>
          <p className="dash-subtitle text-sm mt-0.5">Parâmetros globais que afetam todos os lojistas</p>
        </div>
      </div>

      {/* Seções em grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {[
          {
            icon: Shield,
            color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
            label: "Segurança",
            desc: "Autenticação, 2FA, sessões, políticas de senha",
            status: "Padrão",
          },
          {
            icon: Bell,
            color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
            label: "Notificações",
            desc: "Templates de e-mail, SMS, webhooks por evento",
            status: "Padrão",
          },
          {
            icon: Database,
            color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10",
            label: "Banco de Dados",
            desc: "Backup automático, expiração de chaves, limpeza",
            status: "Ativo",
          },
          {
            icon: Globe,
            color: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10",
            label: "Domínios",
            desc: "Domínio padrão para landing pages e totens",
            status: "Padrão",
          },
          {
            icon: Lock,
            color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10",
            label: "Permissões",
            desc: "Roles, o que cada perfil pode fazer na plataforma",
            status: "Padrão",
          },
          {
            icon: CreditCard,
            color: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10",
            label: "Pagamentos",
            desc: "Integração Stripe, webhook de eventos de cobrança",
            status: "Stripe",
          },
        ].map((item) => (
          <div key={item.label} className="dash-card p-4 flex gap-3 opacity-70 cursor-not-allowed select-none" title="Em breve">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold dash-title">{item.label}</p>
                <span className="text-xs dash-muted bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                  {item.status}
                </span>
              </div>
              <p className="text-xs dash-muted mt-0.5 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Planos e limites */}
      <div className="dash-card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-500" />
          <h2 className="font-semibold dash-title">Planos e Limites</h2>
          <span className="ml-auto text-xs dash-muted bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded">
            somente leitura
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.07]">
                <th className="text-left py-3 px-5 text-xs font-medium dash-muted uppercase tracking-wide">Funcionalidade</th>
                {PLANOS.map((p) => (
                  <th key={p.key} className="py-3 px-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.cor}`}>
                        {p.label}
                      </span>
                      <span className="text-xs dash-muted">{p.preco}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {[
                {
                  icon: Megaphone,
                  label: "Campanhas simultâneas",
                  values: PLANOS.map((p) =>
                    p.limites.campanhas >= 999 ? "Ilimitado" : String(p.limites.campanhas)
                  ),
                },
                {
                  icon: Key,
                  label: "Chaves por campanha",
                  values: PLANOS.map((p) =>
                    p.limites.chavesPorCampanha >= 9999
                      ? "Ilimitado"
                      : p.limites.chavesPorCampanha.toLocaleString("pt-BR")
                  ),
                },
                {
                  icon: Users,
                  label: "Usuários por loja",
                  values: PLANOS.map((p) =>
                    p.limites.usuarios >= 999 ? "Ilimitado" : String(p.limites.usuarios)
                  ),
                },
                {
                  icon: Building2,
                  label: "Totem de resgate",
                  values: PLANOS.map((p) => p.limites.totem ? "check" : "cross"),
                },
                {
                  icon: Database,
                  label: "Impressão de QR Codes",
                  values: PLANOS.map((p) => p.limites.impressao ? "check" : "cross"),
                },
                {
                  icon: Shield,
                  label: "Relatórios avançados",
                  values: PLANOS.map((p) => p.limites.relatorios ? "check" : "cross"),
                },
              ].map((row) => (
                <tr key={row.label} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <row.icon className="w-3.5 h-3.5 dash-muted flex-shrink-0" />
                      <span className="text-sm dash-subtitle">{row.label}</span>
                    </div>
                  </td>
                  {row.values.map((v, i) => (
                    <td key={i} className="py-3 px-4 text-center text-sm font-medium dash-title">
                      {v === "check" ? <Check /> : v === "cross" ? <Cross /> : v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cron / Automações */}
      <div className="dash-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-500" />
          <h2 className="font-semibold dash-title">Automações do Sistema</h2>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
          {[
            {
              name: "Expiração de chaves",
              desc: "Expira automaticamente chaves de campanhas vencidas",
              schedule: "Diário · 03:00 UTC",
              status: "Ativo",
              statusColor: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
            },
            {
              name: "Encerramento de campanhas",
              desc: "Encerra campanhas com data de expiração no passado",
              schedule: "Diário · 03:00 UTC",
              status: "Ativo",
              statusColor: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
            },
            {
              name: "Limpeza de sessões",
              desc: "Remove sessões expiradas do banco de dados",
              schedule: "Semanal · Dom 04:00 UTC",
              status: "Padrão",
              statusColor: "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60",
            },
          ].map((auto) => (
            <div key={auto.name} className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium dash-title">{auto.name}</p>
                <p className="text-xs dash-muted mt-0.5">{auto.desc}</p>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-xs dash-muted">{auto.schedule}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${auto.statusColor}`}>
                {auto.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
