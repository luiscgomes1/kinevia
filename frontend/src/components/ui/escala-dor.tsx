import { useState } from 'react'

const CORES: Record<number, { bg: string; ring: string; text: string }> = {
  0:  { bg: 'bg-green-500', ring: 'ring-green-400', text: 'text-green-700' },
  1:  { bg: 'bg-green-400', ring: 'ring-green-300', text: 'text-green-700' },
  2:  { bg: 'bg-lime-400', ring: 'ring-lime-300', text: 'text-lime-800' },
  3:  { bg: 'bg-yellow-300', ring: 'ring-yellow-200', text: 'text-yellow-800' },
  4:  { bg: 'bg-yellow-400', ring: 'ring-yellow-300', text: 'text-yellow-800' },
  5:  { bg: 'bg-orange-400', ring: 'ring-orange-300', text: 'text-orange-800' },
  6:  { bg: 'bg-orange-500', ring: 'ring-orange-400', text: 'text-orange-800' },
  7:  { bg: 'bg-red-400', ring: 'ring-red-300', text: 'text-red-700' },
  8:  { bg: 'bg-red-500', ring: 'ring-red-400', text: 'text-red-700' },
  9:  { bg: 'bg-red-600', ring: 'ring-red-500', text: 'text-red-700' },
  10: { bg: 'bg-red-700', ring: 'ring-red-600', text: 'text-red-700' },
}

const ROTULOS = [
  'Sem dor',
  'Muito leve',
  'Leve',
  'Moderada',
  'Moderada+',
  'Forte',
  'Muito forte',
  'Intensa',
  'Muito intensa',
  'Insuportável',
  'Pior dor possível',
]

interface Props {
  value: number | null
  onChange: (value: number) => void
  label?: string
}

export function EscalaDor({ value, onChange, label }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const atual = hover ?? value

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm font-medium text-foreground">{label}</p>
      )}
      <div className="flex items-end justify-between px-0.5 mb-0.5">
        <div className="flex items-center gap-1">
          <span className="text-lg">😊</span>
          <span className="text-xs text-muted-foreground">Sem dor</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Dor máxima</span>
          <span className="text-lg">😢</span>
        </div>
      </div>
      <div className="flex gap-0.5 sm:gap-1" role="radiogroup" aria-label={label || 'Escala de dor'}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
          const cor = CORES[num]
          const selecionado = value === num

          return (
            <button
              key={num}
              type="button"
              role="radio"
              aria-checked={selecionado}
              aria-label={`${num} — ${ROTULOS[num]}`}
              onClick={() => onChange(num)}
              onMouseEnter={() => setHover(num)}
              onMouseLeave={() => setHover(null)}
              className={`
                flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg
                text-xs font-bold transition-all duration-150
                ${selecionado || (hover !== null && hover >= num) ? `${cor.bg} text-white scale-105 shadow-md` : 'bg-muted text-muted-foreground hover:bg-accent'}
                ${selecionado ? `ring-2 ring-offset-1 ${cor.ring}` : ''}
              `}
            >
              <span>{num}</span>
            </button>
          )
        })}
      </div>
      {atual !== null && (
        <div className={`text-center text-sm font-semibold ${CORES[atual]?.text ?? 'text-muted-foreground'}`}>
          {atual}/10 — {ROTULOS[atual]}
        </div>
      )}
    </div>
  )
}
