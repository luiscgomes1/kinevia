import { beforeAll, afterAll } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../src/lib/prisma'

let dbDisponivel = false

export function managePrisma() {
  beforeAll(async () => {
    try {
      await prisma.$connect()
      dbDisponivel = true
    } catch {
      console.warn('[tests] Banco de teste indisponível — pulando testes que dependem de DB')
    }
  })
  afterAll(async () => {
    if (dbDisponivel) await prisma.$disconnect()
  })
}

export function skipSeSemDb() {
  if (!dbDisponivel) return it.skip
  return it
}

export function gerarToken(profissionalId: string, tokenVersion = 1): string {
  return jwt.sign(
    { id: profissionalId, token_version: tokenVersion },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '15m' },
  )
}

export function gerarRefreshToken(profissionalId: string, tokenVersion = 1): string {
  return jwt.sign(
    { id: profissionalId, token_version: tokenVersion },
    process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key',
    { expiresIn: '30d' },
  )
}

export async function criarProfissional(override: Partial<{
  nome: string
  email: string
  senha: string
  crefito: string
  cidade: string
  uf: string
  token_version: number
}> = {}) {
  const senhaHash = await bcrypt.hash(override.senha || 'Teste1234', 10)
  return prisma.profissional.create({
    data: {
      nome: override.nome || 'Profissional Teste',
      email: override.email || `teste${Date.now()}@email.com`,
      senha_hash: senhaHash,
      crefito: override.crefito || 'CREFITO-2/12345-F',
      cidade: override.cidade || 'Rio de Janeiro',
      uf: override.uf || 'RJ',
      token_version: override.token_version ?? 1,
    },
  })
}

export async function criarPaciente(profissionalId: string, override: Partial<{
  nome: string
  cpf: string
  data_nascimento: string
  endereco: string
  estado_civil: string
  nacionalidade: string
  telefone: string
  email: string
}> = {}) {
  const cpfRaw = override.cpf || '52998224725'
  return prisma.paciente.create({
    data: {
      nome: override.nome || 'Paciente Teste',
      cpf: cpfRaw,
      data_nascimento: override.data_nascimento || new Date('1990-01-15').toISOString(),
      endereco: override.endereco || 'Rua A, 123, Centro, Cidade',
      estado_civil: override.estado_civil || 'Solteiro(a)',
      nacionalidade: override.nacionalidade || 'Brasileira',
      telefone: override.telefone || '21999999999',
      email: override.email,
      profissional_id: profissionalId,
    },
  })
}

export function getAuthHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

export function getCookieHeader(token: string): string {
  return `refreshToken=${token}; Path=/; HttpOnly`
}
