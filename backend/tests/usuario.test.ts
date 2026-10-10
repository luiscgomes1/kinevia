import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import prisma from '../src/lib/prisma'
import { criarProfissional, criarClinica, gerarToken, getAuthHeaders, managePrisma } from './helpers'

managePrisma()

describe('GET /v1/usuarios', () => {
  let superAdminToken: string
  let adminToken: string
  let superAdminId: string
  let clinicaId: string
  let idsParaLimpar: string[] = []

  beforeAll(async () => {
    clinicaId = (await criarClinica('Usuarios Test')).id
    const superAdmin = await criarProfissional({ email: `us-list-sa${Date.now()}@test.com`, role: 'SUPER_ADMIN' })
    superAdminId = superAdmin.id
    idsParaLimpar.push(superAdminId)
    superAdminToken = gerarToken(superAdmin.id)
    const admin = await criarProfissional({ email: `us-list-adm${Date.now()}@test.com`, role: 'ADMIN', clinica_id: clinicaId })
    idsParaLimpar.push(admin.id)
    adminToken = gerarToken(admin.id)
    const prof = await criarProfissional({ email: `us-list-prof${Date.now()}@test.com`, clinica_id: clinicaId })
    idsParaLimpar.push(prof.id)
  })

  afterAll(async () => {
    await prisma.profissional.deleteMany({ where: { id: { in: idsParaLimpar } } })
    await prisma.clinica.delete({ where: { id: clinicaId } })
  })

  it('SUPER_ADMIN lista todos os usuários', async () => {
    const res = await request(app)
      .get('/v1/usuarios')
      .set(getAuthHeaders(superAdminToken))
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(2)
  })

  it('ADMIN lista apenas usuários da própria clínica', async () => {
    const res = await request(app)
      .get('/v1/usuarios')
      .set(getAuthHeaders(adminToken))
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(2)
    expect(res.body.every((u: any) => u.role !== 'SUPER_ADMIN')).toBe(true)
  })

  it('rejeita sem token', async () => {
    const res = await request(app).get('/v1/usuarios')
    expect(res.status).toBe(401)
  })

  it('rejeita com role PROFISSIONAL', async () => {
    const prof = await criarProfissional({ email: `us-test-prof${Date.now()}@test.com` })
    const token = gerarToken(prof.id)
    const res = await request(app)
      .get('/v1/usuarios')
      .set(getAuthHeaders(token))
    expect(res.status).toBe(403)
    await prisma.profissional.delete({ where: { id: prof.id } })
  })
})

describe('POST /v1/usuarios', () => {
  let superAdminToken: string
  let adminToken: string
  let clinicaId: string
  let usuarioCriadoId: string

  beforeAll(async () => {
    clinicaId = (await criarClinica('Create User Test')).id
    const sa = await criarProfissional({ email: `us-create-sa${Date.now()}@test.com`, role: 'SUPER_ADMIN' })
    superAdminToken = gerarToken(sa.id)
    const adm = await criarProfissional({ email: `us-create-adm${Date.now()}@test.com`, role: 'ADMIN', clinica_id: clinicaId })
    adminToken = gerarToken(adm.id)
  })

  afterAll(async () => {
    if (usuarioCriadoId) await prisma.profissional.delete({ where: { id: usuarioCriadoId } })
    await prisma.profissional.deleteMany({ where: { clinica_id: clinicaId } })
    await prisma.clinica.delete({ where: { id: clinicaId } })
  })

  it('cria usuário com sucesso (SUPER_ADMIN)', async () => {
    const res = await request(app)
      .post('/v1/usuarios')
      .set(getAuthHeaders(superAdminToken))
      .send({
        nome: 'Novo Usuário',
        email: `novo-usuario${Date.now()}@test.com`,
        papel: 'PROFISSIONAL',
      })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.nome).toBe('Novo Usuário')
    usuarioCriadoId = res.body.id
  })

  it('rejeita email duplicado', async () => {
    const email = `dup-email${Date.now()}@test.com`
    await request(app)
      .post('/v1/usuarios')
      .set(getAuthHeaders(superAdminToken))
      .send({ nome: 'Primeiro', email, papel: 'PROFISSIONAL' })
    const res = await request(app)
      .post('/v1/usuarios')
      .set(getAuthHeaders(superAdminToken))
      .send({ nome: 'Segundo', email, papel: 'PROFISSIONAL' })
    expect(res.status).toBe(409)
  })

  it('ADMIN não pode criar SUPER_ADMIN', async () => {
    const res = await request(app)
      .post('/v1/usuarios')
      .set(getAuthHeaders(adminToken))
      .send({
        nome: 'Tentativa',
        email: `tentativa${Date.now()}@test.com`,
        papel: 'SUPER_ADMIN',
      })
    expect(res.status).toBe(403)
  })

  it('rejeita sem nome', async () => {
    const res = await request(app)
      .post('/v1/usuarios')
      .set(getAuthHeaders(superAdminToken))
      .send({ email: `sem-nome${Date.now()}@test.com`, papel: 'PROFISSIONAL' })
    expect(res.status).toBe(400)
  })
})

describe('PUT /v1/usuarios/:id', () => {
  let superAdminToken: string
  let usuarioId: string

  beforeAll(async () => {
    const sa = await criarProfissional({ email: `us-upd-sa${Date.now()}@test.com`, role: 'SUPER_ADMIN' })
    superAdminToken = gerarToken(sa.id)
    const alvo = await criarProfissional({ email: `us-upd-alvo${Date.now()}@test.com` })
    usuarioId = alvo.id
  })

  afterAll(async () => {
    await prisma.profissional.deleteMany({ where: { id: usuarioId } })
  })

  it('atualiza nome do usuário', async () => {
    const res = await request(app)
      .put(`/v1/usuarios/${usuarioId}`)
      .set(getAuthHeaders(superAdminToken))
      .send({ nome: 'Nome Alterado' })
    expect(res.status).toBe(200)
    expect(res.body.nome).toBe('Nome Alterado')
  })
})

describe('DELETE /v1/usuarios/:id', () => {
  let token: string
  let adminId: string
  let alvoId: string

  beforeAll(async () => {
    const sa = await criarProfissional({ email: `us-del-sa${Date.now()}@test.com`, role: 'SUPER_ADMIN' })
    token = gerarToken(sa.id)
    adminId = sa.id
    const alvo = await criarProfissional({ email: `us-del-alvo${Date.now()}@test.com` })
    alvoId = alvo.id
  })

  afterAll(async () => {
    await prisma.profissional.deleteMany({ where: { id: { in: [adminId, alvoId] } } })
  })

  it('remove usuário com sucesso', async () => {
    const res = await request(app)
      .delete(`/v1/usuarios/${alvoId}`)
      .set(getAuthHeaders(token))
    expect(res.status).toBe(200)
  })

  it('rejeita auto-remoção', async () => {
    const res = await request(app)
      .delete(`/v1/usuarios/${adminId}`)
      .set(getAuthHeaders(token))
    expect(res.status).toBe(400)
  })
})

describe('POST /v1/usuarios/:id/reenviar-convite', () => {
  let superAdminToken: string
  let usuarioId: string

  beforeAll(async () => {
    const sa = await criarProfissional({ email: `us-re-sa${Date.now()}@test.com`, role: 'SUPER_ADMIN' })
    superAdminToken = gerarToken(sa.id)
    const alvo = await criarProfissional({ email: `us-re-alvo${Date.now()}@test.com` })
    usuarioId = alvo.id
  })

  afterAll(async () => {
    const sa = await prisma.profissional.findFirst({ where: { email: { startsWith: 'us-re-sa' } } })
    if (sa) await prisma.profissional.delete({ where: { id: sa.id } })
    const alvo = await prisma.profissional.findFirst({ where: { email: { startsWith: 'us-re-alvo' } } })
    if (alvo) await prisma.profissional.delete({ where: { id: alvo.id } })
  })

  it('reenvia convite com nova senha temporária', async () => {
    const res = await request(app)
      .post(`/v1/usuarios/${usuarioId}/reenviar-convite`)
      .set(getAuthHeaders(superAdminToken))
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('senha_temporaria')
  })
})
