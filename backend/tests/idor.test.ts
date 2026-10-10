import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import prisma from '../src/lib/prisma'
import { criarProfissional, criarPaciente, criarClinica, gerarToken, getAuthHeaders, managePrisma } from './helpers'

managePrisma()

describe('IDOR / escopo por clínica', () => {
  let clinicaA: string
  let clinicaB: string
  let profA: string
  let profB: string
  let atendenteA: string
  let atendenteB: string
  let adminA: string
  let adminB: string
  let pacienteB: string
  let pacoteB: string
  let tokenAtendenteA: string
  let tokenAtendenteB: string
  let tokenAdminA: string
  let tokenAdminB: string

  beforeAll(async () => {
    const ca = await criarClinica('Clinica A')
    const cb = await criarClinica('Clinica B')
    clinicaA = ca.id
    clinicaB = cb.id

    const pa = await criarProfissional({ email: `idor-profa-${Date.now()}@test.com`, role: 'PROFISSIONAL', clinica_id: clinicaA })
    const pb = await criarProfissional({ email: `idor-profb-${Date.now()}@test.com`, role: 'PROFISSIONAL', clinica_id: clinicaB })
    profA = pa.id
    profB = pb.id

    const atA = await criarProfissional({ email: `idor-atA-${Date.now()}@test.com`, role: 'ATENDENTE', clinica_id: clinicaA })
    const atB = await criarProfissional({ email: `idor-atB-${Date.now()}@test.com`, role: 'ATENDENTE', clinica_id: clinicaB })
    atendenteA = atA.id
    atendenteB = atB.id

    const adA = await criarProfissional({ email: `idor-adA-${Date.now()}@test.com`, role: 'ADMIN', clinica_id: clinicaA })
    const adB = await criarProfissional({ email: `idor-adB-${Date.now()}@test.com`, role: 'ADMIN', clinica_id: clinicaB })
    adminA = adA.id
    adminB = adB.id

    const pac = await criarPaciente(profB, { clinica_id: clinicaB, nome: 'Paciente B' })
    pacienteB = pac.id

    const pct = await prisma.pacote.create({
      data: {
        paciente_id: pacienteB,
        profissional_id: profB,
        clinica_id: clinicaB,
        tipo: 'INDIVIDUAL',
        valor_cobrado: 100,
        quantidade_sessoes: 1,
      },
    })
    pacoteB = pct.id

    tokenAtendenteA = gerarToken(atendenteA)
    tokenAtendenteB = gerarToken(atendenteB)
    tokenAdminA = gerarToken(adminA)
    tokenAdminB = gerarToken(adminB)
  })

  afterAll(async () => {
    await prisma.sessaoPacote.deleteMany({ where: { pacote: { profissional_id: profB } } })
    await prisma.agendamento.deleteMany({ where: { profissional_id: profB } })
    await prisma.pacote.deleteMany({ where: { profissional_id: { in: [profA, profB] } } })
    await prisma.paciente.deleteMany({ where: { profissional_id: { in: [profA, profB] } } })
    await prisma.profissional.deleteMany({ where: { id: { in: [profA, profB, atendenteA, atendenteB, adminA, adminB] } } })
    await prisma.clinica.deleteMany({ where: { id: { in: [clinicaA, clinicaB] } } })
  })

  describe('Agenda (A1) — ATENDENTE não acessa agenda de outra clínica', () => {
    it('retorna 404 ao filtrar por profissional de outra clínica', async () => {
      const res = await request(app)
        .get('/v1/agenda')
        .query({ data: '2030-01-01', profissional_id: profB })
        .set(getAuthHeaders(tokenAtendenteA))
      expect(res.status).toBe(404)
    })

    it('permite agenda de profissional da própria clínica', async () => {
      const res = await request(app)
        .get('/v1/agenda')
        .query({ data: '2030-01-01', profissional_id: profB })
        .set(getAuthHeaders(tokenAtendenteB))
      expect(res.status).toBe(200)
    })
  })

  describe('Relatórios (A2) — ADMIN não consulta dados de outra clínica', () => {
    it('retorna 404 ao filtrar por profissional de outra clínica', async () => {
      const res = await request(app)
        .get('/v1/relatorios/resumo')
        .set(getAuthHeaders(tokenAdminA))
        .query({ inicio: '2030-01-01', fim: '2030-01-31', profissional_id: profB })
      expect(res.status).toBe(404)
    })

    it('permite relatório de profissional da própria clínica', async () => {
      const res = await request(app)
        .get('/v1/relatorios/resumo')
        .set(getAuthHeaders(tokenAdminB))
        .query({ inicio: '2030-01-01', fim: '2030-01-31', profissional_id: profB })
      expect(res.status).toBe(200)
    })
  })

  describe('Pacotes (A3) — outra clínica não enxerga/modifica pacotes', () => {
    it('404 ao criar pacote para paciente de outra clínica', async () => {
      const res = await request(app)
        .post(`/v1/pacientes/${pacienteB}/pacotes`)
        .set(getAuthHeaders(tokenAtendenteA))
        .send({ tipo: 'INDIVIDUAL', valor_cobrado: 100 })
      expect(res.status).toBe(404)
    })

    it('404 ao listar pacotes de paciente de outra clínica', async () => {
      const res = await request(app)
        .get(`/v1/pacientes/${pacienteB}/pacotes`)
        .set(getAuthHeaders(tokenAtendenteA))
      expect(res.status).toBe(404)
    })

    it('404 ao adicionar sessão em pacote de outra clínica', async () => {
      const res = await request(app)
        .post(`/v1/pacotes/${pacoteB}/sessoes`)
        .set(getAuthHeaders(tokenAtendenteA))
        .send({ data: '2031-01-01', horario: '09:00', slot: 1, tipo: 'SESSAO' })
      expect(res.status).toBe(404)
    })

    it('404 ao marcar pagamento de pacote de outra clínica', async () => {
      const res = await request(app)
        .patch(`/v1/pacotes/${pacoteB}/pagamento`)
        .set(getAuthHeaders(tokenAtendenteA))
        .send({ status_pagamento: 'PAGO' })
      expect(res.status).toBe(404)
    })

    it('404 ao deletar pacote de outra clínica', async () => {
      const res = await request(app)
        .delete(`/v1/pacotes/${pacoteB}`)
        .set(getAuthHeaders(tokenAtendenteA))
      expect(res.status).toBe(404)
    })

    it('permite criar pacote na própria clínica', async () => {
      const res = await request(app)
        .post(`/v1/pacientes/${pacienteB}/pacotes`)
        .set(getAuthHeaders(tokenAtendenteB))
        .send({ tipo: 'INDIVIDUAL', valor_cobrado: 120 })
      expect(res.status).toBe(201)
    })
  })
})