import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import prisma from '../src/lib/prisma'
import { criarProfissional, criarClinica, gerarToken, getAuthHeaders, managePrisma } from './helpers'

managePrisma()

describe('GET /v1/admin/resumo', () => {
  let superAdminId: string
  let superAdminToken: string

  beforeAll(async () => {
    superAdminId = (await criarProfissional({ email: `resumo${Date.now()}@test.com`, role: 'SUPER_ADMIN' })).id
    superAdminToken = gerarToken(superAdminId)
  })

  afterAll(async () => {
    await prisma.profissional.delete({ where: { id: superAdminId } })
  })

  it('retorna resumo do sistema', async () => {
    const res = await request(app)
      .get('/v1/admin/resumo')
      .set(getAuthHeaders(superAdminToken))
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('totalClinicas')
    expect(res.body).toHaveProperty('totalUsuarios')
    expect(res.body).toHaveProperty('totalPacientes')
    expect(res.body).toHaveProperty('usuariosPorPapel')
  })
})

describe('GET /v1/admin/clinicas', () => {
  let superAdminToken: string
  let superAdminId: string
  let clinicaId: string

  beforeAll(async () => {
    superAdminId = (await criarProfissional({ email: `list-clin${Date.now()}@test.com`, role: 'SUPER_ADMIN' })).id
    superAdminToken = gerarToken(superAdminId)
    clinicaId = (await criarClinica('Listagem Teste')).id
  })

  afterAll(async () => {
    await prisma.clinica.delete({ where: { id: clinicaId } })
    await prisma.profissional.delete({ where: { id: superAdminId } })
  })

  it('lista clínicas', async () => {
    const res = await request(app)
      .get('/v1/admin/clinicas')
      .set(getAuthHeaders(superAdminToken))
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.some((c: any) => c.id === clinicaId)).toBe(true)
  })
})

describe('POST /v1/admin/clinicas', () => {
  let superAdminId: string
  let superAdminToken: string
  let clinicaCriadaId: string

  beforeAll(async () => {
    superAdminId = (await criarProfissional({ email: `create-clin${Date.now()}@test.com`, role: 'SUPER_ADMIN' })).id
    superAdminToken = gerarToken(superAdminId)
  })

  afterAll(async () => {
    if (clinicaCriadaId) await prisma.clinica.delete({ where: { id: clinicaCriadaId } })
    await prisma.profissional.delete({ where: { id: superAdminId } })
  })

  it('cria clínica com sucesso', async () => {
    const res = await request(app)
      .post('/v1/admin/clinicas')
      .set(getAuthHeaders(superAdminToken))
      .send({ nome: `Nova Clinica ${Date.now()}` })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body).toHaveProperty('nome')
    clinicaCriadaId = res.body.id
  })

  it('rejeita nome duplicado', async () => {
    const nome = `Unico ${Date.now()}`
    await request(app)
      .post('/v1/admin/clinicas')
      .set(getAuthHeaders(superAdminToken))
      .send({ nome })
    const res = await request(app)
      .post('/v1/admin/clinicas')
      .set(getAuthHeaders(superAdminToken))
      .send({ nome })
    expect(res.status).toBe(409)
  })
})

describe('PUT /v1/admin/clinicas/:id', () => {
  let superAdminId: string
  let superAdminToken: string
  let clinicaId: string

  beforeAll(async () => {
    superAdminId = (await criarProfissional({ email: `upd-clin${Date.now()}@test.com`, role: 'SUPER_ADMIN' })).id
    superAdminToken = gerarToken(superAdminId)
    clinicaId = (await criarClinica('Antes Editar')).id
  })

  afterAll(async () => {
    await prisma.clinica.delete({ where: { id: clinicaId } })
    await prisma.profissional.delete({ where: { id: superAdminId } })
  })

  it('atualiza nome da clínica', async () => {
    const res = await request(app)
      .put(`/v1/admin/clinicas/${clinicaId}`)
      .set(getAuthHeaders(superAdminToken))
      .send({ nome: 'Depois Editar' })
    expect(res.status).toBe(200)
    expect(res.body.nome).toBe('Depois Editar')
  })
})

describe('DELETE /v1/admin/clinicas/:id', () => {
  let superAdminId: string
  let superAdminToken: string
  let clinicaVaziaId: string
  let clinicaComProfId: string

  beforeAll(async () => {
    superAdminId = (await criarProfissional({ email: `del-clin${Date.now()}@test.com`, role: 'SUPER_ADMIN' })).id
    superAdminToken = gerarToken(superAdminId)
    clinicaVaziaId = (await criarClinica('Vazia')).id
    clinicaComProfId = (await criarClinica('Com Prof')).id
    await criarProfissional({ email: `prof-clin${Date.now()}@test.com`, clinica_id: clinicaComProfId })
  })

  afterAll(async () => {
    await prisma.profissional.deleteMany({ where: { clinica_id: clinicaComProfId } })
    await prisma.clinica.deleteMany({ where: { id: { in: [clinicaVaziaId, clinicaComProfId] } } })
    await prisma.profissional.delete({ where: { id: superAdminId } })
  })

  it('exclui clínica vazia', async () => {
    const res = await request(app)
      .delete(`/v1/admin/clinicas/${clinicaVaziaId}`)
      .set(getAuthHeaders(superAdminToken))
    expect(res.status).toBe(204)
  })

  it('bloqueia exclusão de clínica com profissionais', async () => {
    const res = await request(app)
      .delete(`/v1/admin/clinicas/${clinicaComProfId}`)
      .set(getAuthHeaders(superAdminToken))
    expect(res.status).toBe(400)
  })
})

describe('GET /v1/admin/clinicas/:id', () => {
  let superAdminId: string
  let superAdminToken: string
  let clinicaId: string

  beforeAll(async () => {
    superAdminId = (await criarProfissional({ email: `get-clin${Date.now()}@test.com`, role: 'SUPER_ADMIN' })).id
    superAdminToken = gerarToken(superAdminId)
    clinicaId = (await criarClinica('Detalhe Teste')).id
  })

  afterAll(async () => {
    await prisma.clinica.delete({ where: { id: clinicaId } })
    await prisma.profissional.delete({ where: { id: superAdminId } })
  })

  it('retorna clínica com profissionais', async () => {
    const res = await request(app)
      .get(`/v1/admin/clinicas/${clinicaId}`)
      .set(getAuthHeaders(superAdminToken))
    expect(res.status).toBe(200)
    expect(res.body.nome).toBe('Detalhe Teste')
    expect(res.body).toHaveProperty('profissionais')
  })
})
