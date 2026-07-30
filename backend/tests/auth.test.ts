import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import prisma from '../src/lib/prisma'
import { criarProfissional, gerarToken, managePrisma } from './helpers'

managePrisma()

describe('POST /v1/auth/login', () => {
  it('rejeita body vazio com 400', async () => {
    const res = await request(app).post('/v1/auth/login').send({})
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('erro', 'Dados inválidos.')
  })

  it('rejeita email inválido', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'invalido', senha: '123456' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('erro', 'Dados inválidos.')
  })

  it('rejeita senha em branco', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'teste@email.com', senha: '' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('erro', 'Dados inválidos.')
  })

  it('rejeita email não cadastrado', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'naoexiste@email.com', senha: 'Teste1234' })
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('erro', 'Credenciais inválidas.')
  })
})

describe('POST /v1/auth/register', () => {
  const emailUnico = `registro${Date.now()}@test.com`

  afterAll(async () => {
    await prisma.profissional.deleteMany({ where: { email: emailUnico } })
  })

  it('registra novo profissional', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({
        nome: 'Novo Profissional',
        email: emailUnico,
        senha: 'Teste@1234',
        crefito: 'CREFITO-2/99999-F',
        cidade: 'São Paulo',
        uf: 'SP',
      })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('accessToken')
    expect(res.body).toHaveProperty('profissional')
    expect(res.body.profissional.nome).toBe('Novo Profissional')
  })

  it('rejeita email duplicado', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({
        nome: 'Outro',
        email: emailUnico,
        senha: 'Teste@1234',
        crefito: 'CREFITO-2/99998-F',
        cidade: 'São Paulo',
        uf: 'SP',
      })
    expect(res.status).toBe(409)
    expect(res.body).toHaveProperty('erro')
  })

  it('rejeita senha fraca', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({
        nome: 'Teste',
        email: `fraca${Date.now()}@test.com`,
        senha: '123',
        crefito: 'CREFITO-2/99997-F',
        cidade: 'São Paulo',
        uf: 'SP',
      })
    expect(res.status).toBe(400)
  })
})

describe('POST /v1/auth/refresh', () => {
  it('rejeita requisição sem cookie', async () => {
    const res = await request(app).post('/v1/auth/refresh').send({})
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('erro', 'Refresh token não fornecido.')
  })
})

describe('Rotas protegidas', () => {
  it('rejeita GET /v1/profissional/me sem token', async () => {
    const res = await request(app).get('/v1/profissional/me')
    expect(res.status).toBe(401)
  })

  it('rejeita GET /v1/pacientes sem token', async () => {
    const res = await request(app).get('/v1/pacientes')
    expect(res.status).toBe(401)
  })

  it('rejeita POST /v1/pacientes sem token', async () => {
    const res = await request(app).post('/v1/pacientes').send({})
    expect(res.status).toBe(401)
  })
})

describe('POST /v1/auth/login + fluxo autenticado', () => {
  let profissional: Awaited<ReturnType<typeof criarProfissional>>
  let accessToken: string
  let refreshTokenValue: string
  let cookies: string[]

  beforeAll(async () => {
    profissional = await criarProfissional()
  })

  afterAll(async () => {
    await prisma.profissional.delete({ where: { id: profissional.id } })
  })

  it('faz login com credenciais corretas', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: profissional.email, senha: 'Teste1234' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('accessToken')
    expect(res.body).toHaveProperty('profissional')
    expect(res.body.profissional.nome).toBe(profissional.nome)

    accessToken = res.body.accessToken
    const setCookie = res.headers['set-cookie'] || []
    refreshTokenValue = setCookie
      .find((c: string) => c.startsWith('refreshToken='))
      ?.split(';')[0]
      ?.replace('refreshToken=', '') || ''
    cookies = setCookie
  })

  it('acessa rota protegida com o token', async () => {
    const res = await request(app)
      .get('/v1/profissional/me')
      .set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('nome', profissional.nome)
  })

  it('rejeita token inválido', async () => {
    const res = await request(app)
      .get('/v1/profissional/me')
      .set('Authorization', 'Bearer token-invalido')
    expect(res.status).toBe(401)
  })
})

describe('POST /v1/auth/esqueci-senha', () => {
  it('aceita email válido (não revela se existe)', async () => {
    const res = await request(app)
      .post('/v1/auth/esqueci-senha')
      .send({ email: 'qualquer@email.com' })
    // Por segurança, não revela se o email existe
    expect([200, 401, 429]).toContain(res.status)
  })

  it('rejeita email inválido', async () => {
    const res = await request(app)
      .post('/v1/auth/esqueci-senha')
      .send({ email: 'invalido' })
    expect(res.status).toBe(400)
  })
})

describe('POST /v1/auth/logout', () => {
  let token: string
  let profissionalId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `logout${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
  })

  afterAll(async () => {
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('limpa cookie e retorna sucesso', async () => {
    const res = await request(app)
      .post('/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('mensagem', 'Logout realizado com sucesso.')
  })
})
