import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import prisma from '../src/lib/prisma'
import { criarProfissional, criarClinica, gerarToken, getAuthHeaders, managePrisma } from './helpers'

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

  it('rejeita horário fora de HH:mm válido (99:99)', async () => {
    const res = await request(app)
      .put('/v1/profissional/me')
      .set(getAuthHeaders(token))
      .send({
        nome: 'Teste',
        crefito: 'CREFITO-2/99999-F',
        cidade: 'Cidade',
        uf: 'RJ',
        horario_inicio: '99:99',
        horario_fim: '17:00',
        preco_sessao_individual: 120,
        preco_pacote_5: 500,
        preco_pacote_10: 900,
      })
    expect(res.status).toBe(400)
  })

  it('rejeita horário_fim antes do horário_inicio', async () => {
    const res = await request(app)
      .put('/v1/profissional/me')
      .set(getAuthHeaders(token))
      .send({
        nome: 'Teste',
        crefito: 'CREFITO-2/99999-F',
        cidade: 'Cidade',
        uf: 'RJ',
        horario_inicio: '18:00',
        horario_fim: '08:00',
        preco_sessao_individual: 120,
        preco_pacote_5: 500,
        preco_pacote_10: 900,
      })
    expect(res.status).toBe(400)
  })
})

describe('POST /v1/profissional/me/verificar-senha', () => {
  it('valida senha correta e rejeita incorreta', async () => {
    const p = await criarProfissional({ email: `verif${Date.now()}@test.com`, senha: 'Senha1234!' })
    const token = gerarToken(p.id)

    const ok = await request(app)
      .post('/v1/profissional/me/verificar-senha')
      .set(getAuthHeaders(token))
      .send({ senha: 'Senha1234!' })
    expect(ok.status).toBe(200)
    expect(ok.body.valida).toBe(true)

    const ruim = await request(app)
      .post('/v1/profissional/me/verificar-senha')
      .set(getAuthHeaders(token))
      .send({ senha: 'SenhaErrada1!' })
    expect(ruim.status).toBe(200)
    expect(ruim.body.valida).toBe(false)

    await prisma.profissional.delete({ where: { id: p.id } })
  })
})

describe('GET /v1/profissional', () => {
  let adminId: string
  let adminToken: string
  let outroAdminToken: string
  let clinicaAId: string
  let clinicaBId: string
  const ids: string[] = []

  beforeAll(async () => {
    clinicaAId = (await criarClinica('Prof List A')).id
    clinicaBId = (await criarClinica('Prof List B')).id
    const adminA = await criarProfissional({ email: `prof-list-a${Date.now()}@test.com`, role: 'ADMIN', clinica_id: clinicaAId })
    adminId = adminA.id
    ids.push(adminA.id)
    adminToken = gerarToken(adminA.id)
    const adminB = await criarProfissional({ email: `prof-list-b${Date.now()}@test.com`, role: 'ADMIN', clinica_id: clinicaBId })
    ids.push(adminB.id)
    outroAdminToken = gerarToken(adminB.id)
    const profA = await criarProfissional({ email: `prof-list-prof${Date.now()}@test.com`, clinica_id: clinicaAId })
    ids.push(profA.id)
  })

  afterAll(async () => {
    await prisma.profissional.deleteMany({ where: { id: { in: ids } } })
    await prisma.clinica.deleteMany({ where: { id: { in: [clinicaAId, clinicaBId] } } })
  })

  it('ADMIN lista apenas profissionais da própria clínica', async () => {
    const res = await request(app)
      .get('/v1/profissional')
      .set(getAuthHeaders(adminToken))
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(1)
    expect(res.body.some((p: any) => p.id === adminId)).toBe(true)
  })

  it('ADMIN de outra clínica não vê os profissionais da clínica A', async () => {
    const res = await request(app)
      .get('/v1/profissional')
      .set(getAuthHeaders(outroAdminToken))
    expect(res.status).toBe(200)
    expect(res.body.some((p: any) => p.id === adminId)).toBe(false)
  })

  it('PROFISSIONAL não consegue listar profissionais', async () => {
    const p = await criarProfissional({ email: `prof-list-noperm${Date.now()}@test.com`, clinica_id: clinicaAId })
    const res = await request(app)
      .get('/v1/profissional')
      .set(getAuthHeaders(gerarToken(p.id)))
    expect(res.status).toBe(403)
    await prisma.profissional.delete({ where: { id: p.id } })
  })
})
