import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import prisma from '../src/lib/prisma'
import { criarProfissional, criarPaciente, criarClinica, gerarToken, getAuthHeaders, managePrisma } from './helpers'

managePrisma()

describe('GET /v1/pacientes', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string
  let inativoId: string

  beforeAll(async () => {
    const p = await criarProfissional()
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId, { nome: 'Paciente Lista' })
    pacienteId = pac.id
    const inativo = await criarPaciente(profissionalId, { nome: 'Paciente Inativo', cpf: '11144477735' })
    inativoId = inativo.id
    await prisma.paciente.update({ where: { id: inativoId }, data: { ativo: false } })
  })

  afterAll(async () => {
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('lista pacientes do profissional', async () => {
    const res = await request(app)
      .get('/v1/pacientes')
      .set(getAuthHeaders(token))
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.some((p: any) => p.id === pacienteId)).toBe(true)
  })

  it('oculta pacientes inativos por padrão', async () => {
    const res = await request(app)
      .get('/v1/pacientes')
      .set(getAuthHeaders(token))
    expect(res.status).toBe(200)
    expect(res.body.some((p: any) => p.id === inativoId)).toBe(false)
  })

  it('inclui pacientes inativos com incluirInativos=true', async () => {
    const res = await request(app)
      .get('/v1/pacientes?incluirInativos=true')
      .set(getAuthHeaders(token))
    expect(res.status).toBe(200)
    expect(res.body.some((p: any) => p.id === inativoId)).toBe(true)
  })

  it('retorna array vazio para profissional sem pacientes', async () => {
    const p2 = await criarProfissional({ email: `sem-pacientes${Date.now()}@test.com` })
    const token2 = gerarToken(p2.id)
    const res = await request(app)
      .get('/v1/pacientes')
      .set(getAuthHeaders(token2))
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
    await prisma.profissional.delete({ where: { id: p2.id } })
  })
})

describe('POST /v1/pacientes', () => {
  let profissionalId: string
  let token: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `criar-pac${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
  })

  afterAll(async () => {
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('cria paciente com dados válidos', async () => {
    const res = await request(app)
      .post('/v1/pacientes')
      .set(getAuthHeaders(token))
      .send({
        nome: 'Novo Paciente',
        cpf: '529.982.247-25',
        data_nascimento: '1990-05-20',
        endereco: 'Rua ABC, 100, Centro, Cidade',
        estado_civil: 'Solteiro(a)',
        nacionalidade: 'Brasileira',
        telefone: '21988887777',
        email: 'paciente@email.com',
      })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.nome).toBe('Novo Paciente')
  })

  it('rejeita CPF inválido', async () => {
    const res = await request(app)
      .post('/v1/pacientes')
      .set(getAuthHeaders(token))
      .send({
        nome: 'Teste',
        cpf: '111.111.111-11',
        data_nascimento: '1990-01-01',
        endereco: 'Rua X, Centro',
        estado_civil: 'Solteiro(a)',
        nacionalidade: 'Brasileira',
      })
    expect(res.status).toBe(400)
  })

  it('rejeita nome muito curto', async () => {
    const res = await request(app)
      .post('/v1/pacientes')
      .set(getAuthHeaders(token))
      .send({
        nome: 'A',
        cpf: '529.982.247-25',
        data_nascimento: '1990-01-01',
        endereco: 'Rua X, Centro',
        estado_civil: 'Solteiro(a)',
        nacionalidade: 'Brasileira',
      })
    expect(res.status).toBe(400)
  })
})

describe('GET /v1/pacientes/:id', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `get-pac${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    pacienteId = pac.id
  })

  afterAll(async () => {
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('retorna paciente pelo id', async () => {
    const res = await request(app)
      .get(`/v1/pacientes/${pacienteId}`)
      .set(getAuthHeaders(token))
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(pacienteId)
  })

  it('retorna 404 para paciente de outro profissional', async () => {
    const p2 = await criarProfissional({ email: `outro${Date.now()}@test.com` })
    const token2 = gerarToken(p2.id)
    const res = await request(app)
      .get(`/v1/pacientes/${pacienteId}`)
      .set(getAuthHeaders(token2))
    expect(res.status).toBe(404)
    await prisma.profissional.delete({ where: { id: p2.id } })
  })
})

describe('PUT /v1/pacientes/:id', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `upd-pac${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    pacienteId = pac.id
  })

  afterAll(async () => {
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('atualiza dados do paciente', async () => {
    const res = await request(app)
      .put(`/v1/pacientes/${pacienteId}`)
      .set(getAuthHeaders(token))
      .send({
        nome: 'Nome Atualizado',
        endereco: 'Rua Nova, 456',
        estado_civil: 'Casado(a)',
        nacionalidade: 'Brasileira',
      })
    expect(res.status).toBe(200)
    expect(res.body.nome).toBe('Nome Atualizado')
  })
})

describe('POST /v1/pacientes/:id/transferir', () => {
  let superAdminId: string
  let superAdminToken: string
  let profissionalOrigemId: string
  let profissionalDestinoId: string
  let pacienteId: string

  beforeAll(async () => {
    superAdminId = (await criarProfissional({ email: `super${Date.now()}@test.com`, role: 'SUPER_ADMIN' })).id
    superAdminToken = gerarToken(superAdminId)
    profissionalOrigemId = (await criarProfissional({ email: `origem${Date.now()}@test.com` })).id
    profissionalDestinoId = (await criarProfissional({ email: `destino${Date.now()}@test.com` })).id
    const pac = await criarPaciente(profissionalOrigemId)
    pacienteId = pac.id
  })

  afterAll(async () => {
    await prisma.paciente.deleteMany({ where: { id: pacienteId } })
    await prisma.profissional.deleteMany({ where: { id: { in: [superAdminId, profissionalOrigemId, profissionalDestinoId] } } })
  })

  it('transfere paciente entre profissionais', async () => {
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/transferir`)
      .set(getAuthHeaders(superAdminToken))
      .send({ novo_profissional_id: profissionalDestinoId })
    expect(res.status).toBe(200)
    expect(res.body.mensagem).toContain('Paciente transferido')

    const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId } })
    expect(paciente?.profissional_id).toBe(profissionalDestinoId)
  })

  it('rejeita ADMIN de outra clínica', async () => {
    const outraClinica = await criarClinica('Outra')
    const adminOutraClinica = await criarProfissional({ email: `admin-outra${Date.now()}@test.com`, role: 'ADMIN', clinica_id: outraClinica.id })
    const tokenOutra = gerarToken(adminOutraClinica.id)
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/transferir`)
      .set(getAuthHeaders(tokenOutra))
      .send({ novo_profissional_id: profissionalDestinoId })
    expect(res.status).toBe(404)
    await prisma.profissional.delete({ where: { id: adminOutraClinica.id } })
    await prisma.clinica.delete({ where: { id: outraClinica.id } })
  })

  it('rejeita sem token', async () => {
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/transferir`)
      .send({ novo_profissional_id: profissionalDestinoId })
    expect(res.status).toBe(401)
  })

  it('rejeita transferência para ATENDENTE', async () => {
    const atendente = await criarProfissional({ email: `atendente-transf${Date.now()}@test.com`, role: 'ATENDENTE' })
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/transferir`)
      .set(getAuthHeaders(superAdminToken))
      .send({ novo_profissional_id: atendente.id })
    expect(res.status).toBe(400)
    await prisma.profissional.delete({ where: { id: atendente.id } })
  })

  it('rejeita com role PROFISSIONAL', async () => {
    const prof = await criarProfissional({ email: `prof-transf${Date.now()}@test.com` })
    const tokenProf = gerarToken(prof.id)
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/transferir`)
      .set(getAuthHeaders(tokenProf))
      .send({ novo_profissional_id: profissionalDestinoId })
    expect(res.status).toBe(403)
    await prisma.profissional.delete({ where: { id: prof.id } })
  })
})
