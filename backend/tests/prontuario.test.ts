import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import prisma from '../src/lib/prisma'
import { criarProfissional, criarPaciente, gerarToken, getAuthHeaders, managePrisma } from './helpers'

managePrisma()

describe('GET /v1/pacientes/:id/prontuario', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `pront-${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    pacienteId = pac.id
  })

  afterAll(async () => {
    await prisma.evolucao.deleteMany({ where: { prontuario: { paciente: { profissional_id: profissionalId } } } })
    await prisma.prontuario.deleteMany({ where: { paciente: { profissional_id: profissionalId } } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('rejeita sem token', async () => {
    const res = await request(app).get(`/v1/pacientes/${pacienteId}/prontuario`)
    expect(res.status).toBe(401)
  })

  it('retorna preenchido: false quando não existe', async () => {
    const res = await request(app)
      .get(`/v1/pacientes/${pacienteId}/prontuario`)
      .set(getAuthHeaders(token))
    expect(res.status).toBe(200)
    expect(res.body.preenchido).toBe(false)
    expect(res.body.evolucoes).toEqual([])
  })

  it('retorna 404 para paciente de outro profissional', async () => {
    const outro = await criarProfissional({ email: `outro-pront-${Date.now()}@test.com` })
    const res = await request(app)
      .get(`/v1/pacientes/${pacienteId}/prontuario`)
      .set(getAuthHeaders(gerarToken(outro.id)))
    expect(res.status).toBe(404)
    await prisma.profissional.delete({ where: { id: outro.id } })
  })
})

describe('PUT /v1/pacientes/:id/prontuario', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `put-pront-${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    pacienteId = pac.id
  })

  afterAll(async () => {
    await prisma.prontuario.deleteMany({ where: { paciente: { profissional_id: profissionalId } } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('cria prontuario do zero', async () => {
    const res = await request(app)
      .put(`/v1/pacientes/${pacienteId}/prontuario`)
      .set(getAuthHeaders(token))
      .send({
        queixa_principal: 'Dor no joelho',
        hda: 'Paciente relata dor há 3 meses',
        diagnostico_fisio: 'Condromalácia patelar',
      })
    expect(res.status).toBe(200)
    expect(res.body.queixa_principal).toBe('Dor no joelho')
    expect(res.body.diagnostico_fisio).toBe('Condromalácia patelar')
  })

  it('atualiza prontuario existente', async () => {
    const res = await request(app)
      .put(`/v1/pacientes/${pacienteId}/prontuario`)
      .set(getAuthHeaders(token))
      .send({ queixa_principal: 'Dor no ombro' })
    expect(res.status).toBe(200)
    expect(res.body.queixa_principal).toBe('Dor no ombro')
  })

  it('aceita envio vazio (todos opcionais)', async () => {
    const res = await request(app)
      .put(`/v1/pacientes/${pacienteId}/prontuario`)
      .set(getAuthHeaders(token))
      .send({})
    expect(res.status).toBe(200)
  })
})

describe('POST /v1/pacientes/:id/evolucoes', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `evol-${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    pacienteId = pac.id
    await request(app)
      .put(`/v1/pacientes/${pacienteId}/prontuario`)
      .set(getAuthHeaders(token))
      .send({ queixa_principal: 'Teste' })
  })

  afterAll(async () => {
    await prisma.evolucao.deleteMany({ where: { prontuario: { paciente: { profissional_id: profissionalId } } } })
    await prisma.prontuario.deleteMany({ where: { paciente: { profissional_id: profissionalId } } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('adiciona evolução com texto', async () => {
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/evolucoes`)
      .set(getAuthHeaders(token))
      .send({ texto: 'Paciente apresentou melhora significativa.' })
    expect(res.status).toBe(201)
    expect(res.body.texto).toBe('Paciente apresentou melhora significativa.')
  })

  it('adiciona evolução com dor_eva', async () => {
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/evolucoes`)
      .set(getAuthHeaders(token))
      .send({ texto: 'Dor reduzida.', dor_eva: 3 })
    expect(res.status).toBe(201)
    expect(res.body.dor_eva).toBe(3)
  })

  it('rejeita texto vazio', async () => {
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/evolucoes`)
      .set(getAuthHeaders(token))
      .send({ texto: '' })
    expect(res.status).toBe(400)
  })

  it('rejeita dor_eva acima de 10', async () => {
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/evolucoes`)
      .set(getAuthHeaders(token))
      .send({ texto: 'Teste', dor_eva: 15 })
    expect(res.status).toBe(400)
  })
})

describe('POST evolucao sem prontuario', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `evol-no-pront-${Date.now()}@test.com` })
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
      .post(`/v1/pacientes/${pacienteId}/evolucoes`)
      .set(getAuthHeaders(token))
      .send({ texto: 'Teste' })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /v1/evolucoes/:id/correcao', () => {
  let profissionalId: string
  let token: string
  let evolucaoId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `corr-${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    await request(app)
      .put(`/v1/pacientes/${pac.id}/prontuario`)
      .set(getAuthHeaders(token))
      .send({ queixa_principal: 'Teste' })
    const evolRes = await request(app)
      .post(`/v1/pacientes/${pac.id}/evolucoes`)
      .set(getAuthHeaders(token))
      .send({ texto: 'Evolução inicial' })
    evolucaoId = evolRes.body.id
  })

  afterAll(async () => {
    await prisma.evolucao.deleteMany({ where: { prontuario: { paciente: { profissional_id: profissionalId } } } })
    await prisma.prontuario.deleteMany({ where: { paciente: { profissional_id: profissionalId } } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('adiciona correção', async () => {
    const res = await request(app)
      .patch(`/v1/evolucoes/${evolucaoId}/correcao`)
      .set(getAuthHeaders(token))
      .send({ correcao_texto: 'Correção: o paciente relatou melhora parcial.' })
    expect(res.status).toBe(200)
    expect(res.body.correcao_texto).toBe('Correção: o paciente relatou melhora parcial.')
    expect(res.body).toHaveProperty('correcao_em')
  })

  it('rejeita sobrescrita de correção existente', async () => {
    const res = await request(app)
      .patch(`/v1/evolucoes/${evolucaoId}/correcao`)
      .set(getAuthHeaders(token))
      .send({ correcao_texto: 'Tentativa de sobrescrita.' })
    expect(res.status).toBe(400)
  })

  it('rejeita texto vazio', async () => {
    const res = await request(app)
      .patch(`/v1/evolucoes/${evolucaoId}/correcao`)
      .set(getAuthHeaders(token))
      .send({ correcao_texto: '' })
    expect(res.status).toBe(400)
  })
})
