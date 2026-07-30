import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import prisma from '../src/lib/prisma'
import { criarProfissional, criarPaciente, gerarToken, getAuthHeaders, managePrisma } from './helpers'

managePrisma()

describe('GET /v1/financeiro', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `fin-${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    pacienteId = pac.id
  })

  afterAll(async () => {
    await prisma.sessaoPacote.deleteMany({ where: { pacote: { profissional_id: profissionalId } } })
    await prisma.agendamento.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.pacote.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('rejeita sem token', async () => {
    const res = await request(app).get('/v1/financeiro')
    expect(res.status).toBe(401)
  })

  it('retorna resumo vazio quando não há pacotes', async () => {
    const res = await request(app)
      .get('/v1/financeiro')
      .set(getAuthHeaders(token))
    expect(res.status).toBe(200)
    expect(res.body.recebido_no_mes).toBe(0)
    expect(res.body.a_receber_no_mes).toBe(0)
    expect(res.body.total_periodo).toBe(0)
    expect(res.body.total_acumulado).toBe(0)
  })

  it('retorna valores corretos com pacotes', async () => {
    await prisma.pacote.createMany({
      data: [
        { paciente_id: pacienteId, profissional_id: profissionalId, tipo: 'INDIVIDUAL', valor_cobrado: 100, status_pagamento: 'PAGO' },
        { paciente_id: pacienteId, profissional_id: profissionalId, tipo: 'PACOTE_5', valor_cobrado: 400, status_pagamento: 'AGUARDANDO' },
      ],
    })

    const res = await request(app)
      .get('/v1/financeiro')
      .set(getAuthHeaders(token))
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('periodo')
    expect(Number(res.body.recebido_no_mes)).toBeGreaterThanOrEqual(100)
    expect(Number(res.body.a_receber_no_mes)).toBeGreaterThanOrEqual(400)
    expect(Number(res.body.total_acumulado)).toBeGreaterThanOrEqual(100)
  })

  it('rejeita mes inválido', async () => {
    const res = await request(app)
      .get('/v1/financeiro?mes=13')
      .set(getAuthHeaders(token))
    expect(res.status).toBe(400)
  })

  it('rejeita ano inválido', async () => {
    const res = await request(app)
      .get('/v1/financeiro?ano=abc')
      .set(getAuthHeaders(token))
    expect(res.status).toBe(400)
  })
})

describe('GET /v1/financeiro/pacientes', () => {
  let profissionalId: string
  let token: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `fin-pac-${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
  })

  afterAll(async () => {
    await prisma.pacote.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('retorna array vazio quando não há pacientes', async () => {
    const res = await request(app)
      .get('/v1/financeiro/pacientes')
      .set(getAuthHeaders(token))
    expect(res.status).toBe(200)
    expect(res.body.pacientes).toEqual([])
  })

  it('retorna lista com pacientes que possuem pacotes', async () => {
    const pac = await criarPaciente(profissionalId, { nome: 'Paciente Financeiro' })
    await prisma.pacote.create({
      data: { paciente_id: pac.id, profissional_id: profissionalId, tipo: 'INDIVIDUAL', valor_cobrado: 150, status_pagamento: 'PAGO' },
    })

    const res = await request(app)
      .get('/v1/financeiro/pacientes')
      .set(getAuthHeaders(token))
    expect(res.status).toBe(200)
    expect(res.body.pacientes.length).toBeGreaterThanOrEqual(1)
  })
})

describe('GET /v1/financeiro/pacientes/:id', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `fin-pac-id-${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    pacienteId = pac.id
  })

  afterAll(async () => {
    await prisma.pacote.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('retorna financeiro de um paciente específico', async () => {
    await prisma.pacote.create({
      data: { paciente_id: pacienteId, profissional_id: profissionalId, tipo: 'INDIVIDUAL', valor_cobrado: 200, status_pagamento: 'PAGO' },
    })

    const res = await request(app)
      .get(`/v1/financeiro/pacientes/${pacienteId}`)
      .set(getAuthHeaders(token))
    expect(res.status).toBe(200)
    expect(res.body.paciente_id).toBe(pacienteId)
    expect(Number(res.body.total_cobrado)).toBeGreaterThanOrEqual(200)
  })

  it('retorna 404 para paciente de outro profissional (não revela existência)', async () => {
    const outro = await criarProfissional({ email: `outro-fin-${Date.now()}@test.com` })
    const res = await request(app)
      .get(`/v1/financeiro/pacientes/${pacienteId}`)
      .set(getAuthHeaders(gerarToken(outro.id)))
    expect(res.status).toBe(404)
    await prisma.profissional.delete({ where: { id: outro.id } })
  })
})
