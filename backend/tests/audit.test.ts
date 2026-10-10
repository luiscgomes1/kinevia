import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import prisma from '../src/lib/prisma'
import { criarProfissional, criarClinica, gerarToken, getAuthHeaders, managePrisma } from './helpers'

managePrisma()

describe('GET /v1/admin/auditoria', () => {
  let superAdminId: string
  let superAdminToken: string
  let adminId: string
  let adminToken: string
  let profissionalId: string
  let clinicaId: string
  let outroClinicaId: string

  beforeAll(async () => {
    clinicaId = (await criarClinica('Clinica A')).id
    outroClinicaId = (await criarClinica('Clinica B')).id

    superAdminId = (await criarProfissional({ email: `audit-super${Date.now()}@test.com`, role: 'SUPER_ADMIN' })).id
    superAdminToken = gerarToken(superAdminId)

    adminId = (await criarProfissional({ email: `audit-admin${Date.now()}@test.com`, role: 'ADMIN', clinica_id: clinicaId })).id
    adminToken = gerarToken(adminId)

    profissionalId = (await criarProfissional({ email: `audit-prof${Date.now()}@test.com`, clinica_id: clinicaId })).id

    // Cria alguns logs de auditoria
    await prisma.auditLog.createMany({
      data: [
        { profissional_id: profissionalId, acao: 'PRONTUARIO_VISUALIZADO', paciente_id: null },
        { profissional_id: profissionalId, acao: 'LAUDO_VISUALIZADO', paciente_id: null },
        { profissional_id: superAdminId, acao: 'PACIENTE_TRANSFERIDO', paciente_id: null },
      ],
    })
  })

  afterAll(async () => {
    await prisma.auditLog.deleteMany({
      where: { profissional_id: { in: [profissionalId, superAdminId, adminId] } },
    })
    await prisma.profissional.deleteMany({
      where: { id: { in: [superAdminId, adminId, profissionalId] } },
    })
    await prisma.clinica.deleteMany({
      where: { id: { in: [clinicaId, outroClinicaId] } },
    })
  })

  it('SUPER_ADMIN vê todos os logs', async () => {
    const res = await request(app)
      .get('/v1/admin/auditoria')
      .set(getAuthHeaders(superAdminToken))
    expect(res.status).toBe(200)
    expect(res.body.logs.length).toBeGreaterThanOrEqual(3)
    expect(res.body).toHaveProperty('total')
  })

  it('ADMIN vê apenas logs da sua clínica', async () => {
    const res = await request(app)
      .get('/v1/admin/auditoria')
      .set(getAuthHeaders(adminToken))
    expect(res.status).toBe(200)
    const idsClinica = [adminId, profissionalId]
    const todosDaClinica = res.body.logs.every((l: any) => idsClinica.includes(l.profissional_id))
    expect(todosDaClinica).toBe(true)
  })

  it('rejeita sem token', async () => {
    const res = await request(app).get('/v1/admin/auditoria')
    expect(res.status).toBe(401)
  })

  it('rejeita com role PROFISSIONAL', async () => {
    const prof = await criarProfissional({ email: `audit-prof2${Date.now()}@test.com` })
    const token = gerarToken(prof.id)
    const res = await request(app)
      .get('/v1/admin/auditoria')
      .set(getAuthHeaders(token))
    expect(res.status).toBe(403)
    await prisma.profissional.delete({ where: { id: prof.id } })
  })
})
