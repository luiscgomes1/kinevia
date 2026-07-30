import { describe, it, expect } from 'vitest'
import { loginSchema, esqueciSenhaSchema } from '../auth'

describe('loginSchema', () => {
  it('aceita email e senha válidos', () => {
    const result = loginSchema.safeParse({ email: 'teste@email.com', senha: '123456' })
    expect(result.success).toBe(true)
  })

  it('rejeita email inválido', () => {
    const result = loginSchema.safeParse({ email: 'invalido', senha: '123456' })
    expect(result.success).toBe(false)
  })

  it('rejeita senha vazia', () => {
    const result = loginSchema.safeParse({ email: 'teste@email.com', senha: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita email vazio', () => {
    const result = loginSchema.safeParse({ email: '', senha: '123456' })
    expect(result.success).toBe(false)
  })
})

describe('esqueciSenhaSchema', () => {
  it('aceita email válido', () => {
    const result = esqueciSenhaSchema.safeParse({ email: 'teste@email.com' })
    expect(result.success).toBe(true)
  })

  it('rejeita email inválido', () => {
    const result = esqueciSenhaSchema.safeParse({ email: 'invalido' })
    expect(result.success).toBe(false)
  })
})
