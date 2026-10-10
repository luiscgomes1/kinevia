import { useState, useMemo } from 'react'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SenhaInputProps {
  value: string
  onChange: (v: string) => void
  id: string
  label: string
  placeholder?: string
  required?: boolean
}

const requisitos = [
  { label: 'Pelo menos 8 caracteres', test: (v: string) => v.length >= 8 },
  { label: 'Uma letra maiúscula', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Uma letra minúscula', test: (v: string) => /[a-z]/.test(v) },
  { label: 'Um número', test: (v: string) => /[0-9]/.test(v) },
  { label: 'Um caractere especial', test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
] as const

function calcularForca(v: string): { nivel: number; rotulo: string; cor: string } {
  let pontos = 0
  if (v.length >= 8) pontos++
  if (v.length >= 12) pontos++
  if (/[A-Z]/.test(v)) pontos++
  if (/[a-z]/.test(v)) pontos++
  if (/[0-9]/.test(v)) pontos++
  if (/[^A-Za-z0-9]/.test(v)) pontos++
  if (pontos <= 2) return { nivel: 0, rotulo: 'Fraca', cor: 'bg-red-500' }
  if (pontos <= 4) return { nivel: 1, rotulo: 'Média', cor: 'bg-yellow-500' }
  return { nivel: 2, rotulo: 'Forte', cor: 'bg-green-500' }
}

export function SenhaInput({ value, onChange, id, label, placeholder = 'Nova senha', required = true }: SenhaInputProps) {
  const [mostrar, setMostrar] = useState(false)
  const [tocado, setTocado] = useState(false)

  const forca = useMemo(() => calcularForca(value), [value])
  const atendidos = useMemo(() => requisitos.map((r) => r.test(value)), [value])

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={mostrar ? 'text' : 'password'}
          value={value}
          onChange={(e) => { onChange(e.target.value); if (!tocado) setTocado(true) }}
          required={required}
          placeholder={placeholder}
          className="pr-9"
        />
        <button
          type="button"
          onClick={() => setMostrar((m) => !m)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {mostrar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {tocado && value.length > 0 && (
        <>
          <div className="flex gap-1 mt-1.5">
            {[0, 1, 2].map((n) => (
              <div
                key={n}
                className={`h-1 flex-1 rounded-full transition-colors ${n <= forca.nivel ? forca.cor : 'bg-muted'}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Força: <span className="font-medium">{forca.rotulo}</span>
          </p>

          <ul className="space-y-0.5 mt-1.5">
            {requisitos.map((r, i) => (
              <li key={r.label} className="flex items-center gap-1.5 text-xs">
                {atendidos[i]
                  ? <Check className="w-3 h-3 text-green-600 shrink-0" />
                  : <X className="w-3 h-3 text-red-500 shrink-0" />
                }
                <span className={atendidos[i] ? 'text-green-700' : 'text-muted-foreground'}>{r.label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}


