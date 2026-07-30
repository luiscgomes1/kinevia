import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import prisma from '../src/lib/prisma'
import { criarProfissional, criarPaciente, gerarToken, getAuthHeaders, managePrisma } from './helpers'

managePrisma()

describe('GET /v1/agenda', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string

  beforeAll(async () => {
    const p = await criarProfissional({
      email: `agenda${Date.now()}@test.com`,
      horario_inicio: '08:00',
      horario_fim: '18:00',
    })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    pacienteId = pac.id
  })

  afterAll(async () => {
    await prisma.agendamento.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('retorna grade vazia para data sem agendamentos', async () => {
    const res = await request(app)
      .get('/v1/agenda')
      .query({ data: '2030-01-01' })
      .set(getAuthHeaders(token))
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(res.body).toHaveProperty('horarios')
  })

  it('rejeita requisição sem data', async () => {
    const res = await request(app)
      .get('/v1/agenda')
      .set(getAuthHeaders(token))
    expect(res.status).toBe(400)
  })
})
