import { describe, it, expect } from 'vitest'
import { formatarCPF, formatarTelefone } from '../masks'

describe('formatarCPF', () => {
  it('formata CPF completo', () => {
    expect(formatarCPF('52998224725')).toBe('529.982.247-25')
  })

  it('formata CPF parcial', () => {
    expect(formatarCPF('529')).toBe('529')
    expect(formatarCPF('5299')).toBe('529.9')
    expect(formatarCPF('529982')).toBe('529.982')
    expect(formatarCPF('5299822')).toBe('529.982.2')
  })

  it('ignora caracteres não numéricos', () => {
    expect(formatarCPF('529.982.247-25')).toBe('529.982.247-25')
  })

  it('limita a 11 dígitos', () => {
    expect(formatarCPF('5299822472512345')).toBe('529.982.247-25')
  })

  it('retorna vazio para string vazia', () => {
    expect(formatarCPF('')).toBe('')
  })
})

describe('formatarTelefone', () => {
  it('formata telefone fixo (10 dígitos)', () => {
    expect(formatarTelefone('2122223333')).toBe('(21) 2222-3333')
  })

  it('formata celular (11 dígitos)', () => {
    expect(formatarTelefone('21988887777')).toBe('(21) 98888-7777')
  })

  it('formata celular parcial', () => {
    expect(formatarTelefone('219')).toBe('(21) 9')
    expect(formatarTelefone('2198')).toBe('(21) 98')
    expect(formatarTelefone('21988')).toBe('(21) 988')
    expect(formatarTelefone('2198888')).toBe('(21) 9888-8')
  })

  it('ignora caracteres não numéricos', () => {
    expect(formatarTelefone('(21) 98888-7777')).toBe('(21) 98888-7777')
  })

  it('limita a 11 dígitos', () => {
    expect(formatarTelefone('219888877771234')).toBe('(21) 98888-7777')
  })

  it('retorna vazio para string vazia', () => {
    expect(formatarTelefone('')).toBe('')
  })
})
