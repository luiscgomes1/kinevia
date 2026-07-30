import { useMemo } from 'react'

const requisitos = [
  { label: 'Pelo menos 8 caracteres', test: (v: string) => v.length >= 8 },
  { label: 'Uma letra maiúscula', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Uma letra minúscula', test: (v: string) => /[a-z]/.test(v) },
  { label: 'Um número', test: (v: string) => /[0-9]/.test(v) },
  { label: 'Um caractere especial', test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
] as const

export function useSenhaValida(senha: string): boolean {
  return useMemo(() => requisitos.every((r) => r.test(senha)), [senha])
}
