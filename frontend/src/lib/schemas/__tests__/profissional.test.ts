import { describe, it, expect } from 'vitest'
import { profissionalSchema } from '../profissional'

describe('profissionalSchema', () => {
  const dadosValidos = {
    nome: 'Dr. João',
    crefito: 'CREFITO-2/12345-F',
    cidade: 'São Paulo',
    uf: 'SP',
    horario_inicio: '07:00',
    horario_fim: '18:00',
    preco_sessao_individual: 100,
    preco_pacote_5: 450,
    preco_pacote_10: 800,
  }

  it('aceita dados válidos', () => {
    const result = profissionalSchema.safeParse(dadosValidos)
    expect(result.success).toBe(true)
  })

  it('rejeita nome curto', () => {
    const result = profissionalSchema.safeParse({ ...dadosValidos, nome: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejeita UF com mais de 2 caracteres', () => {
    const result = profissionalSchema.safeParse({ ...dadosValidos, uf: 'SPO' })
    expect(result.success).toBe(false)
  })

  it('converte UF para maiúsculas', () => {
    const result = profissionalSchema.safeParse({ ...dadosValidos, uf: 'sp' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.uf).toBe('SP')
    }
  })

  it('rejeita horário com formato inválido', () => {
    const result = profissionalSchema.safeParse({ ...dadosValidos, horario_inicio: 'abc' })
    expect(result.success).toBe(false)
  })

  it('rejeita preço negativo', () => {
    const result = profissionalSchema.safeParse({ ...dadosValidos, preco_sessao_individual: -1 })
    expect(result.success).toBe(false)
  })
})
