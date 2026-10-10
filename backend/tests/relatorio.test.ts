import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import prisma from '../src/lib/prisma'
import { criarProfissional, criarPaciente, criarClinica, gerarToken, getAuthHeaders, managePrisma } from './helpers'

managePrisma()

const DATA_DENTRO = '2030-04-10'
const DATA_FORA = '2020-01-01'

describe('GET /v1/relatorios/resumo', () => {
  let profissionalId: string
  let token: string
  let tokenProf: string
  let profPId: string
  let pacienteId: string

  beforeAll(async () => {
    const clinica = await criarClinica(`Rel Clinica ${Date.now()}`)
    const p = await criarProfissional({
      email: `rel-${Date.now()}@test.com`,
      preco_sessao_individual: 80,
      role: 'ADMIN',
      clinica_id: clinica.id,
    })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    pacienteId = pac.id
    const pp = await criarProfissional({ email: `rel-prof-${Date.now()}@test.com`, clinica_id: clinica.id })
    profPId = pp.id
    tokenProf = gerarToken(profPId)
  })

  afterAll(async () => {
    await prisma.sessaoPacote.deleteMany({ where: { pacote: { profissional_id: profissionalId } } })
    await prisma.agendamento.deleteMany({ where: { profissional_id: { in: [profissionalId, profPId] } } })
    await prisma.pacote.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.deleteMany({ where: { id: { in: [profissionalId, profPId] } } })
  })

  it('rejeita sem token', async () => {
    const res = await request(app)
      .get('/v1/relatorios/resumo')
      .query({ inicio: DATA_DENTRO, fim: DATA_DENTRO })
    expect(res.status).toBe(401)
  })

  it('rejeita sem query params', async () => {
    const res = await request(app)
      .get('/v1/relatorios/resumo')
      .set(getAuthHeaders(token))
    expect(res.status).toBe(400)
  })

  it('retorna resumo vazio quando não há agendamentos', async () => {
    const res = await request(app)
      .get('/v1/relatorios/resumo')
      .set(getAuthHeaders(token))
      .query({ inicio: DATA_DENTRO, fim: '2030-04-20' })
    expect(res.status).toBe(200)
    expect(res.body.total).toBe(0)
    expect(res.body.compareceu).toBe(0)
    expect(res.body.faturamentoEstimado).toBe(0)
  })

  it('PROFISSIONAL vê relatórios sem faturamento estimado', async () => {
    const res = await request(app)
      .get('/v1/relatorios/resumo')
      .set(getAuthHeaders(tokenProf))
      .query({ inicio: DATA_DENTRO, fim: DATA_DENTRO })
    expect(res.status).toBe(200)
    expect(res.body.faturamentoEstimado).toBeUndefined()
  })

  it('retorna dados com agendamentos', async () => {
    await prisma.agendamento.createMany({
      data: [
        { paciente_id: pacienteId, profissional_id: profissionalId, data: new Date(DATA_DENTRO), horario: '09:00', slot: 1, status: 'COMPARECEU' },
        { paciente_id: pacienteId, profissional_id: profissionalId, data: new Date(DATA_DENTRO), horario: '09:00', slot: 2, status: 'FALTOU' },
        { paciente_id: pacienteId, profissional_id: profissionalId, data: new Date(DATA_DENTRO), horario: '09:00', slot: 3, status: 'DESMARCOU' },
      ],
    })

    const res = await request(app)
      .get('/v1/relatorios/resumo')
      .set(getAuthHeaders(token))
      .query({ inicio: DATA_DENTRO, fim: '2030-04-20' })
    expect(res.status).toBe(200)
    expect(res.body.total).toBe(3)
    expect(res.body.compareceu).toBe(1)
    expect(res.body.faltou).toBe(1)
    expect(res.body.desmarcou).toBe(1)
    expect(res.body.pacientesAtivos).toBeGreaterThanOrEqual(1)
  })

  it('não retorna agendamentos fora do período', async () => {
    const res = await request(app)
      .get('/v1/relatorios/resumo')
      .set(getAuthHeaders(token))
      .query({ inicio: DATA_FORA, fim: DATA_FORA })
    expect(res.status).toBe(200)
    expect(res.body.total).toBe(0)
  })
})
