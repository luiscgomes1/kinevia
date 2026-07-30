import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import prisma from '../src/lib/prisma'
import { criarProfissional, criarPaciente, gerarToken, getAuthHeaders, managePrisma } from './helpers'

managePrisma()

describe('POST /v1/pacientes/:id/laudos', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `laudo-${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    pacienteId = pac.id
    await request(app)
      .put(`/v1/pacientes/${pacienteId}/prontuario`)
      .set(getAuthHeaders(token))
      .send({
        queixa_principal: 'Dor lombar',
        hda: 'Há 2 meses',
        diagnostico_fisio: 'Lombalgia mecânica',
      })
  })

  afterAll(async () => {
    await prisma.laudo.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.evolucao.deleteMany({ where: { prontuario: { paciente: { profissional_id: profissionalId } } } })
    await prisma.prontuario.deleteMany({ where: { paciente: { profissional_id: profissionalId } } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('rejeita sem token', async () => {
    const res = await request(app).post(`/v1/pacientes/${pacienteId}/laudos`)
    expect(res.status).toBe(401)
  })

  it('cria laudo com dados do prontuario', async () => {
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/laudos`)
      .set(getAuthHeaders(token))
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.conteudo).toHaveProperty('quadro_clinico')
  })

  it('cria laudo com tipo_assinatura', async () => {
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/laudos`)
      .set(getAuthHeaders(token))
      .send({ tipo_assinatura: 'DIGITAL' })
    expect(res.status).toBe(201)
    expect(res.body.tipo_assinatura).toBe('DIGITAL')
  })

  it('retorna 404 para paciente inexistente', async () => {
    const res = await request(app)
      .post('/v1/pacientes/00000000-0000-0000-0000-000000000000/laudos')
      .set(getAuthHeaders(token))
    expect(res.status).toBe(404)
  })
})

describe('POST laudo sem prontuario', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `laudo-nopront-${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    pacienteId = pac.id
  })

  afterAll(async () => {
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('retorna erro se não há prontuario', async () => {
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/laudos`)
      .set(getAuthHeaders(token))
    expect(res.status).toBe(400)
  })
})

describe('GET /v1/pacientes/:id/laudos', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `list-laudo-${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    pacienteId = pac.id
    await request(app)
      .put(`/v1/pacientes/${pacienteId}/prontuario`)
      .set(getAuthHeaders(token))
      .send({ queixa_principal: 'Teste' })
    await request(app)
      .post(`/v1/pacientes/${pacienteId}/laudos`)
      .set(getAuthHeaders(token))
  })

  afterAll(async () => {
    await prisma.laudo.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.evolucao.deleteMany({ where: { prontuario: { paciente: { profissional_id: profissionalId } } } })
    await prisma.prontuario.deleteMany({ where: { paciente: { profissional_id: profissionalId } } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('lista laudos do paciente', async () => {
    const res = await request(app)
      .get(`/v1/pacientes/${pacienteId}/laudos`)
      .set(getAuthHeaders(token))
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(1)
  })
})

describe('GET /v1/laudos/:id', () => {
  let profissionalId: string
  let token: string
  let laudoId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `get-laudo-${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    await request(app)
      .put(`/v1/pacientes/${pac.id}/prontuario`)
      .set(getAuthHeaders(token))
      .send({ queixa_principal: 'Teste' })
    const res = await request(app)
      .post(`/v1/pacientes/${pac.id}/laudos`)
      .set(getAuthHeaders(token))
    laudoId = res.body.id
  })

  afterAll(async () => {
    await prisma.laudo.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.evolucao.deleteMany({ where: { prontuario: { paciente: { profissional_id: profissionalId } } } })
    await prisma.prontuario.deleteMany({ where: { paciente: { profissional_id: profissionalId } } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('retorna laudo pelo id', async () => {
    const res = await request(app)
      .get(`/v1/laudos/${laudoId}`)
      .set(getAuthHeaders(token))
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(laudoId)
  })

  it('retorna 404 para laudo de outro profissional', async () => {
    const outro = await criarProfissional({ email: `outro-laudo-${Date.now()}@test.com` })
    const res = await request(app)
      .get(`/v1/laudos/${laudoId}`)
      .set(getAuthHeaders(gerarToken(outro.id)))
    expect(res.status).toBe(404)
    await prisma.profissional.delete({ where: { id: outro.id } })
  })
})

describe('PUT /v1/laudos/:id', () => {
  let profissionalId: string
  let token: string
  let laudoId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `edit-laudo-${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    await request(app)
      .put(`/v1/pacientes/${pac.id}/prontuario`)
      .set(getAuthHeaders(token))
      .send({ queixa_principal: 'Teste' })
    const res = await request(app)
      .post(`/v1/pacientes/${pac.id}/laudos`)
      .set(getAuthHeaders(token))
    laudoId = res.body.id
  })

  afterAll(async () => {
    await prisma.laudo.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.evolucao.deleteMany({ where: { prontuario: { paciente: { profissional_id: profissionalId } } } })
    await prisma.prontuario.deleteMany({ where: { paciente: { profissional_id: profissionalId } } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('edita campos do laudo', async () => {
    const res = await request(app)
      .put(`/v1/laudos/${laudoId}`)
      .set(getAuthHeaders(token))
      .send({
        conteudo: {
          quadro_clinico: 'Paciente com dor lombar crônica',
          cid: 'M54.5',
        },
      })
    expect(res.status).toBe(200)
    expect(res.body.conteudo.quadro_clinico).toBe('Paciente com dor lombar crônica')
    expect(res.body.conteudo.cid).toBe('M54.5')
  })

  it('altera tipo_assinatura', async () => {
    const res = await request(app)
      .put(`/v1/laudos/${laudoId}`)
      .set(getAuthHeaders(token))
      .send({ tipo_assinatura: 'DIGITAL' })
    expect(res.status).toBe(200)
    expect(res.body.tipo_assinatura).toBe('DIGITAL')
  })
})
