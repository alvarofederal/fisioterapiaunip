"use client"

import { useId, useState } from "react"
import { Eye, EyeOff } from "lucide-react"

/**
 * Campo de senha com botão de mostrar/ocultar.
 *
 * O botão é `type="button"` de propósito: dentro de um formulário, um botão
 * sem tipo é tratado como submit e enviaria o formulário ao revelar a senha.
 *
 * A senha volta a ficar oculta sempre que o componente é remontado — não
 * guardamos essa preferência em lugar nenhum. Deixar revelado por padrão
 * exporia a senha de quem digita com alguém por perto.
 */
export function CampoSenha({
  id,
  label,
  value,
  onChange,
  autoComplete = "current-password",
  placeholder = "••••••••",
  required = false,
  ajuda,
}: {
  id?: string
  label: string
  value: string
  onChange: (valor: string) => void
  autoComplete?: "current-password" | "new-password"
  placeholder?: string
  required?: boolean
  ajuda?: string
}) {
  const idGerado = useId()
  const idCampo = id ?? idGerado
  const idAjuda = `${idCampo}-ajuda`
  const [revelada, setRevelada] = useState(false)

  return (
    <div>
      <label htmlFor={idCampo} className="rotulo">
        {label}
      </label>

      <div className="relative">
        <input
          id={idCampo}
          type={revelada ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-describedby={ajuda ? idAjuda : undefined}
          className="campo pr-12"
        />

        <button
          type="button"
          onClick={() => setRevelada((v) => !v)}
          aria-label={revelada ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={revelada}
          title={revelada ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-greyple transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          {revelada ? (
            <EyeOff size={17} aria-hidden />
          ) : (
            <Eye size={17} aria-hidden />
          )}
        </button>
      </div>

      {ajuda && (
        <p id={idAjuda} className="mt-2 text-[12px] text-greyple">
          {ajuda}
        </p>
      )}
    </div>
  )
}
