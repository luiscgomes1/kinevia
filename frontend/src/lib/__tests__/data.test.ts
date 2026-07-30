import { describe, it, expect } from 'vitest'
import { formatarDataISO, mesmoDia } from '../data'

describe('formatarDataISO', () => {
  it('formata data no formato YYYY-MM-DD', () => {
    const data = new Date(2026, 6, 21)
    expect(formatarDataISO(data)).toBe('2026-07-21')
  })

  it('usa componentes locais, não UTC', () => {
    const data = new Date(2026, 0, 1)
    expect(formatarDataISO(data)).toBe('2026-01-01')
  })

  it('preenche mês e dia com zero', () => {
    const data = new Date(2026, 0, 5)
    expect(formatarDataISO(data)).toBe('2026-01-05')
  })
})

describe('mesmoDia', () => {
  it('retorna true para mesma data', () => {
    expect(mesmoDia(new Date(2026, 6, 21), new Date(2026, 6, 21))).toBe(true)
  })

  it('retorna false para datas diferentes', () => {
    expect(mesmoDia(new Date(2026, 6, 21), new Date(2026, 6, 22))).toBe(false)
  })
})
