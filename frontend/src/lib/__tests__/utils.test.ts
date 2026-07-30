import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn', () => {
  it('combina classes', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('remove classes conflitantes do tailwind', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2')
  })

  it('aceita arrays', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c')
  })

  it('aceita objetos condicionais', () => {
    expect(cn('a', { b: true, c: false })).toBe('a b')
  })

  it('lida com entradas vazias', () => {
    expect(cn()).toBe('')
  })
})
