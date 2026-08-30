const statusConfig = {
  GERADA:     { label: "Gerada",     className: "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60" },
  CONSULTADA: { label: "Consultada", className: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  ATIVADA:    { label: "Ativada",    className: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  RESGATADA:  { label: "Resgatada",  className: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  EXPIRADA:   { label: "Expirada",   className: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" },
  CANCELADA:  { label: "Cancelada",  className: "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30" },
} as const

type ChaveStatus = keyof typeof statusConfig

export function ChaveStatusBadge({ status }: { status: ChaveStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.CANCELADA
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
