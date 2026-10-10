import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import prisma from '../src/lib/prisma'
import { criarProfissional, criarPaciente, criarClinica, gerarToken, getAuthHeaders, managePrisma } from './helpers'

managePrisma()

describe('Escopo de dados por papel', () => {
  let clinicaAId: string
  let clinicaBId: string
  let profissionalId: string
  let adminAId: string
  let adminBId: string
  let superAdminId: string
  let pacienteId: string

  const emails = {
    prof: `esc-prof-${Date.now()}@test.com`,
    adminA: `esc-admin-a-${Date.now()}@test.com`,
    adminB: `esc-admin-b-${Date.now()}@test.com`,
    super: `esc-super-${Date.now()}@test.com`,
  }

  beforeAll(async () => {
    clinicaAId = (await criarClinica('Escopo Clinica A')).id
    clinicaBId = (await criarClinica('Escopo Clinica B')).id

    profissionalId = (await criarProfissional({ email: emails.prof, clinica_id: clinicaAId })).id
    adminAId = (await criarProfissional({ email: emails.adminA, role: 'ADMIN', clinica_id: clinicaAId })).id
    adminBId = (await criarProfissional({ email: emails.adminB, role: 'ADMIN', clinica_id: clinicaBId })).id
    superAdminId = (await criarProfissional({ email: emails.super, role: 'SUPER_ADMIN' })).id

    pacienteId = (await criarPaciente(profissionalId)).id
  })

  afterAll(async () => {
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.deleteMany({ where: { id: { in: [profissionalId, adminAId, adminBId, superAdminId] } } })
    await prisma.clinica.deleteMany({ where: { id: { in: [clinicaAId, clinicaBId] } } })
  })

  it('PROFISSIONAL vê paciente próprio', async () => {
    const res = await request(app)
      .get(`/v1/pacientes/${pacienteId}`)
      .set(getAuthHeaders(gerarToken(profissionalId)))
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(pacienteId)
  })

  it('PROFISSIONAL não vê paciente de outro da mesma clínica', async () => {
    const outroProf = await criarProfissional({ email: `esc-outro-${Date.now()}@test.com`, clinica_id: clinicaAId })
    const res = await request(app)
      .get(`/v1/pacientes/${pacienteId}`)
      .set(getAuthHeaders(gerarToken(outroProf.id)))
    expect(res.status).toBe(404)
    await prisma.profissional.delete({ where: { id: outroProf.id } })
  })

  it('ADMIN vê paciente de qualquer profissional da sua clínica', async () => {
    const res = await request(app)
      .get(`/v1/pacientes/${pacienteId}`)
      .set(getAuthHeaders(gerarToken(adminAId)))
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(pacienteId)
  })

  it('ADMIN não vê paciente de outra clínica', async () => {
    const res = await request(app)
      .get(`/v1/pacientes/${pacienteId}`)
      .set(getAuthHeaders(gerarToken(adminBId)))
    expect(res.status).toBe(404)
  })

  it('SUPER_ADMIN vê paciente de qualquer clínica', async () => {
    const res = await request(app)
      .get(`/v1/pacientes/${pacienteId}`)
      .set(getAuthHeaders(gerarToken(superAdminId)))
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(pacienteId)
  })

  it('ADMIN da mesma clínica consegue ver prontuário', async () => {
    const res = await request(app)
      .get(`/v1/pacientes/${pacienteId}/prontuario`)
      .set(getAuthHeaders(gerarToken(adminAId)))
    expect(res.status).toBe(200)
  })

  it('PROFISSIONAL não vê prontuário de paciente de outro da clínica', async () => {
    const outroProf = await criarProfissional({ email: `esc-pront-${Date.now()}@test.com`, clinica_id: clinicaAId })
    const res = await request(app)
      .get(`/v1/pacientes/${pacienteId}/prontuario`)
      .set(getAuthHeaders(gerarToken(outroProf.id)))
    expect(res.status).toBe(404)
    await prisma.profissional.delete({ where: { id: outroProf.id } })
  })
})

describe('Reativação de paciente anonimizado', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string

  beforeAll(async () => {
    const p = await criarProfissional({ email: `anon-react-${Date.now()}@test.com` })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    pacienteId = (await criarPaciente(profissionalId)).id
  })

  afterAll(async () => {
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('bloqueia reativação após anonimização', async () => {
    const anon = await request(app)
      .post(`/v1/pacientes/${pacienteId}/anonimizar`)
      .set(getAuthHeaders(token))
    expect(anon.status).toBe(200)

    const reativar = await request(app)
      .patch(`/v1/pacientes/${pacienteId}/reativar`)
      .set(getAuthHeaders(token))
    expect(reativar.status).toBe(400)
    expect(reativar.body.erro).toContain('anonimizado')
  })
})
