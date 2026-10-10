import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import prisma from '../src/lib/prisma'
import { criarProfissional, criarClinica, gerarToken, getAuthHeaders, managePrisma } from './helpers'

managePrisma()

describe('Dashboard — escopo do filtro de profissional', () => {
  let clinicaAId: string
  let clinicaBId: string
  let profissionalAId: string
  let profissionalBId: string
  let adminAId: string
  let atendenteAId: string

  const emails = {
    profA: `dash-a-${Date.now()}@test.com`,
    profB: `dash-b-${Date.now()}@test.com`,
    adminA: `dash-admin-a-${Date.now()}@test.com`,
    atendA: `dash-atend-a-${Date.now()}@test.com`,
  }

  beforeAll(async () => {
    clinicaAId = (await criarClinica('Dash Clinica A')).id
    clinicaBId = (await criarClinica('Dash Clinica B')).id

    profissionalAId = (await criarProfissional({ email: emails.profA, clinica_id: clinicaAId })).id
    profissionalBId = (await criarProfissional({ email: emails.profB, clinica_id: clinicaBId })).id
    adminAId = (await criarProfissional({ email: emails.adminA, role: 'ADMIN', clinica_id: clinicaAId })).id
    atendenteAId = (await criarProfissional({ email: emails.atendA, role: 'ATENDENTE', clinica_id: clinicaAId })).id
  })

  afterAll(async () => {
    await prisma.profissional.deleteMany({
      where: { id: { in: [profissionalAId, profissionalBId, adminAId, atendenteAId] } },
    })
    await prisma.clinica.deleteMany({ where: { id: { in: [clinicaAId, clinicaBId] } } })
  })

  it('ADMIN pode filtrar por profissional da própria clínica', async () => {
    const res = await request(app)
      .get(`/v1/dashboard/resumo?data=2026-08-05&profissional_id=${profissionalAId}`)
      .set(getAuthHeaders(gerarToken(adminAId)))
    expect(res.status).toBe(200)
  })

  it('ADMIN não pode consultar profissional de outra clínica', async () => {
    const res = await request(app)
      .get(`/v1/dashboard/resumo?data=2026-08-05&profissional_id=${profissionalBId}`)
      .set(getAuthHeaders(gerarToken(adminAId)))
    expect(res.status).toBe(404)
  })

  it('ATENDENTE não pode consultar profissional de outra clínica', async () => {
    const res = await request(app)
      .get(`/v1/dashboard/resumo?data=2026-08-05&profissional_id=${profissionalBId}`)
      .set(getAuthHeaders(gerarToken(atendenteAId)))
    expect(res.status).toBe(404)
  })

  it('ATENDENTE pode filtrar por profissional da própria clínica', async () => {
    const res = await request(app)
      .get(`/v1/dashboard/resumo?data=2026-08-05&profissional_id=${profissionalAId}`)
      .set(getAuthHeaders(gerarToken(atendenteAId)))
    expect(res.status).toBe(200)
  })

  it('ADMIN recebe faturamento estimado', async () => {
    const res = await request(app)
      .get(`/v1/dashboard/resumo?data=2026-08-05&profissional_id=${profissionalAId}`)
      .set(getAuthHeaders(gerarToken(adminAId)))
    expect(res.status).toBe(200)
    expect(res.body.mes.faturamentoEstimado).toBeDefined()
  })

  it('PROFISSIONAL não recebe faturamento estimado', async () => {
    const res = await request(app)
      .get(`/v1/dashboard/resumo?data=2026-08-05&profissional_id=${profissionalAId}`)
      .set(getAuthHeaders(gerarToken(profissionalAId)))
    expect(res.status).toBe(200)
    expect(res.body.mes.faturamentoEstimado).toBeUndefined()
  })
})
