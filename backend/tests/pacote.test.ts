import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import prisma from '../src/lib/prisma'
import { criarProfissional, criarPaciente, gerarToken, getAuthHeaders, managePrisma } from './helpers'

managePrisma()

const FUTURO = '2030-06-15'
const FUTURO2 = '2030-06-16'

describe('POST /v1/pacientes/:id/pacotes', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `pacote-${Date.now()}@test.com` })
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
    const res = await request(app).post(`/v1/pacientes/${pacienteId}/pacotes`).send({ tipo: 'INDIVIDUAL', valor_cobrado: 100 })
    expect(res.status).toBe(401)
  })

  it('cria pacote sem sessões', async () => {
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/pacotes`)
      .set(getAuthHeaders(token))
      .send({ tipo: 'INDIVIDUAL', valor_cobrado: 120 })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('pacote')
    expect(res.body.pacote.tipo).toBe('INDIVIDUAL')
  })

  it('cria pacote com sessões', async () => {
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/pacotes`)
      .set(getAuthHeaders(token))
      .send({
        tipo: 'PACOTE_5',
        valor_cobrado: 500,
        sessoes: [
          { data: FUTURO, horario: '09:00', slot: 1 },
          { data: FUTURO, horario: '09:00', slot: 2 },
        ],
      })
    expect(res.status).toBe(201)
    expect(res.body.sessoes).toHaveLength(2)
  })

  it('rejeita slot duplicado', async () => {
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/pacotes`)
      .set(getAuthHeaders(token))
      .send({
        tipo: 'INDIVIDUAL',
        valor_cobrado: 100,
        sessoes: [
          { data: FUTURO2, horario: '10:00', slot: 1 },
          { data: FUTURO2, horario: '10:00', slot: 1 },
        ],
      })
    expect(res.status).toBe(400)
  })

  it('rejeita tipo inválido', async () => {
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/pacotes`)
      .set(getAuthHeaders(token))
      .send({ tipo: 'INVALIDO', valor_cobrado: 100 })
    expect(res.status).toBe(400)
  })

  it('rejeita valor negativo', async () => {
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/pacotes`)
      .set(getAuthHeaders(token))
      .send({ tipo: 'INDIVIDUAL', valor_cobrado: -10 })
    expect(res.status).toBe(400)
  })

  it('retorna 404 para paciente inexistente', async () => {
    const res = await request(app)
      .post('/v1/pacientes/00000000-0000-0000-0000-000000000000/pacotes')
      .set(getAuthHeaders(token))
      .send({ tipo: 'INDIVIDUAL', valor_cobrado: 100 })
    expect(res.status).toBe(404)
  })
})

describe('GET /v1/pacientes/:id/pacotes', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `list-pacote-${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    pacienteId = pac.id
    await prisma.pacote.create({
      data: { paciente_id: pacienteId, profissional_id: profissionalId, tipo: 'INDIVIDUAL', valor_cobrado: 100 },
    })
  })

  afterAll(async () => {
    await prisma.pacote.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('lista pacotes do paciente', async () => {
    const res = await request(app)
      .get(`/v1/pacientes/${pacienteId}/pacotes`)
      .set(getAuthHeaders(token))
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(1)
  })
})

describe('POST /v1/pacotes/:id/sessoes', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string
  let pacoteId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `sessao-${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    pacienteId = pac.id
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/pacotes`)
      .set(getAuthHeaders(token))
      .send({ tipo: 'PACOTE_5', valor_cobrado: 500 })
    pacoteId = res.body.pacote.id
  })

  afterAll(async () => {
    await prisma.sessaoPacote.deleteMany({ where: { pacote: { profissional_id: profissionalId } } })
    await prisma.agendamento.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.pacote.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('adiciona sessão ao pacote', async () => {
    const res = await request(app)
      .post(`/v1/pacotes/${pacoteId}/sessoes`)
      .set(getAuthHeaders(token))
      .send({ data: FUTURO, horario: '14:00', slot: 1 })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('agendamento')
    expect(res.body).toHaveProperty('sessaoPacote')
  })

  it('rejeita slot já ocupado', async () => {
    const res = await request(app)
      .post(`/v1/pacotes/${pacoteId}/sessoes`)
      .set(getAuthHeaders(token))
      .send({ data: FUTURO, horario: '14:00', slot: 1 })
    expect(res.status).toBe(400)
  })
})

describe('PATCH /v1/pacotes/:id/pagamento', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string
  let pacoteId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `pag-${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    pacienteId = pac.id
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/pacotes`)
      .set(getAuthHeaders(token))
      .send({ tipo: 'INDIVIDUAL', valor_cobrado: 100 })
    pacoteId = res.body.pacote.id
  })

  afterAll(async () => {
    await prisma.pacote.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('marca como pago', async () => {
    const res = await request(app)
      .patch(`/v1/pacotes/${pacoteId}/pagamento`)
      .set(getAuthHeaders(token))
      .send({ status_pagamento: 'PAGO' })
    expect(res.status).toBe(200)
    expect(res.body.status_pagamento).toBe('PAGO')
    expect(res.body).toHaveProperty('pago_em')
  })

  it('reverte para aguardando', async () => {
    const res = await request(app)
      .patch(`/v1/pacotes/${pacoteId}/pagamento`)
      .set(getAuthHeaders(token))
      .send({ status_pagamento: 'AGUARDANDO' })
    expect(res.status).toBe(200)
    expect(res.body.status_pagamento).toBe('AGUARDANDO')
    expect(res.body.pago_em).toBeNull()
  })

  it('rejeita status inválido', async () => {
    const res = await request(app)
      .patch(`/v1/pacotes/${pacoteId}/pagamento`)
      .set(getAuthHeaders(token))
      .send({ status_pagamento: 'INVALIDO' })
    expect(res.status).toBe(400)
  })
})
