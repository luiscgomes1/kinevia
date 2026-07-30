import { describe, it, expect } from 'vitest'
import { criarPacienteSchema, atualizarPacienteSchema, enderecoSchema } from '../paciente'

describe('criarPacienteSchema', () => {
  const dadosValidos = {
    nome: 'João Silva',
    cpf: '529.982.247-25',
    data_nascimento: '1990-05-20',
    rua: 'Rua ABC',
    numero: '100',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado_civil: 'Solteiro(a)',
    nacionalidade: 'Brasileira',
  }

  it('aceita dados válidos', () => {
    const result = criarPacienteSchema.safeParse(dadosValidos)
    expect(result.success).toBe(true)
  })

  it('rejeita nome curto', () => {
    const result = criarPacienteSchema.safeParse({ ...dadosValidos, nome: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejeita CPF inválido', () => {
    const result = criarPacienteSchema.safeParse({ ...dadosValidos, cpf: '111.111.111-11' })
    expect(result.success).toBe(false)
  })

  it('rejeita data de nascimento inválida', () => {
    const result = criarPacienteSchema.safeParse({ ...dadosValidos, data_nascimento: '99-99-9999' })
    expect(result.success).toBe(false)
  })

  it('rejeita estado civil inválido', () => {
    const result = criarPacienteSchema.safeParse({ ...dadosValidos, estado_civil: 'invalido' })
    expect(result.success).toBe(false)
  })

  it('aceita campos opcionais de contato', () => {
    const result = criarPacienteSchema.safeParse({
      ...dadosValidos,
      telefone: '(21) 98888-7777',
      email: 'joao@email.com',
      observacoes: 'Paciente antigo',
    })
    expect(result.success).toBe(true)
  })
})

describe('atualizarPacienteSchema', () => {
  it('aceita dados válidos', () => {
    const result = atualizarPacienteSchema.safeParse({
      nome: 'João Silva',
      estado_civil: 'Casado(a)',
      nacionalidade: 'Brasileira',
    })
    expect(result.success).toBe(true)
  })

  it('aceita telefone e email opcionais', () => {
    const result = atualizarPacienteSchema.safeParse({
      nome: 'João',
      estado_civil: 'Solteiro(a)',
      nacionalidade: 'Brasileira',
      telefone: '',
      email: '',
    })
    expect(result.success).toBe(true)
  })
})

describe('enderecoSchema', () => {
  it('aceita endereço válido', () => {
    const result = enderecoSchema.safeParse({
      rua: 'Rua ABC',
      bairro: 'Centro',
      cidade: 'São Paulo',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita rua curta', () => {
    const result = enderecoSchema.safeParse({ rua: 'AB', bairro: 'Centro', cidade: 'São Paulo' })
    expect(result.success).toBe(false)
  })

  it('aceita número opcional', () => {
    const result = enderecoSchema.safeParse({
      rua: 'Rua ABC',
      numero: '',
      bairro: 'Centro',
      cidade: 'São Paulo',
    })
    expect(result.success).toBe(true)
  })
})
