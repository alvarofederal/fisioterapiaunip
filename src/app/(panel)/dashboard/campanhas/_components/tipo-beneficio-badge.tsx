const tipoConfig = {
  DESCONTO_PERCENTUAL: { label: "Desconto %",   className: "bg-blue-50 text-blue-700" },
  DESCONTO_FIXO:       { label: "Desconto R$",   className: "bg-indigo-50 text-indigo-700" },
  BRINDE:              { label: "Brinde",        className: "bg-purple-50 text-purple-700" },
  SORTEIO:             { label: "Sorteio",       className: "bg-pink-50 text-pink-700" },
  FRETE_GRATIS:        { label: "Frete Grátis",  className: "bg-teal-50 text-teal-700" },
  CASHBACK:            { label: "Cashback",      className: "bg-orange-50 text-orange-700" },
} as const

type Tipo = keyof typeof tipoConfig

export function TipoBeneficioBadge({ tipo }: { tipo: Tipo }) {
  const cfg = tipoConfig[tipo]
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
