const statusConfig = {
  RASCUNHO:  { label: "Rascunho",  className: "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60" },
  ATIVA:     { label: "Ativa",     className: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  PAUSADA:   { label: "Pausada",   className: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  ENCERRADA: { label: "Encerrada", className: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400" },
  CANCELADA: { label: "Cancelada", className: "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/30" },
} as const

type Status = keyof typeof statusConfig

export function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status] ?? statusConfig.CANCELADA
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
