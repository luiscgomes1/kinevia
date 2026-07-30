import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import prisma from '../src/lib/prisma'
import { criarProfissional, gerarToken, getAuthHeaders, managePrisma } from './helpers'

managePrisma()

describe('GET /v1/profissional/me', () => {
  let profissionalId: string
  let token: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `me${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
  })

  afterAll(async () => {
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('retorna dados do profissional autenticado', async () => {
    const res = await request(app)
      .get('/v1/profissional/me')
      .set(getAuthHeaders(token))
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('nome')
    expect(res.body).toHaveProperty('email')
    expect(res.body).toHaveProperty('crefito')
  })
})

describe('PUT /v1/profissional/me', () => {
  let profissionalId: string
  let token: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `put-me${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
  })

  afterAll(async () => {
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('atualiza dados profissionais', async () => {
    const res = await request(app)
      .put('/v1/profissional/me')
      .set(getAuthHeaders(token))
      .send({
        nome: 'Nome Atualizado',
        crefito: 'CREFITO-2/99999-F',
        cidade: 'Niterói',
        uf: 'RJ',
        horario_inicio: '08:00',
        horario_fim: '17:00',
        preco_sessao_individual: 120,
        preco_pacote_5: 500,
        preco_pacote_10: 900,
      })
    expect(res.status).toBe(200)
  })

  it('rejeita UF inválida', async () => {
    const res = await request(app)
      .put('/v1/profissional/me')
      .set(getAuthHeaders(token))
      .send({
        nome: 'Teste',
        crefito: 'CREFITO-2/99999-F',
        cidade: 'Cidade',
        uf: 'RJO',
        horario_inicio: '08:00',
        horario_fim: '17:00',
      })
    expect(res.status).toBe(400)
  })
})
