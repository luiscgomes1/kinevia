import { forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CampoProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
  /** Texto de apoio exibido abaixo do input (ex: "O e-mail não pode ser alterado.") */
  helperText?: string
}

/**
 * Envelope de Label + Input, no padrão repetido em Pacientes/Novo,
 * Pacientes/Editar e Configuracoes — item 7 do Bloco 3 da refatoração
 * (ver Diagnostico-Tecnico.md). Só cobre o par Label+Input (a maioria dos
 * casos); <select> e <textarea> continuam declarados diretamente onde já
 * estavam, por serem poucos casos e terem estrutura própria.
 */
export const Campo = forwardRef<HTMLInputElement, CampoProps>(
  ({ label, id, helperText, className, ...inputProps }, ref) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} ref={ref} className={`peer ${className || ''}`} {...inputProps} />
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  )
)
Campo.displayName = 'Campo'
