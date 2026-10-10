import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/server'
import prisma from '../src/lib/prisma'
import { criarProfissional, criarPaciente, gerarToken, getAuthHeaders, managePrisma } from './helpers'

managePrisma()

describe('GET /v1/agenda', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string

  beforeAll(async () => {
    const p = await criarProfissional({
      email: `agenda${Date.now()}@test.com`,
      horario_inicio: '08:00',
      horario_fim: '18:00',
    })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    pacienteId = pac.id
  })

  afterAll(async () => {
    await prisma.agendamento.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('retorna grade vazia para data sem agendamentos', async () => {
    const res = await request(app)
      .get('/v1/agenda')
      .query({ data: '2030-01-01' })
      .set(getAuthHeaders(token))
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(res.body).toHaveProperty('horarios')
  })

  it('rejeita requisição sem data', async () => {
    const res = await request(app)
      .get('/v1/agenda')
      .set(getAuthHeaders(token))
    expect(res.status).toBe(400)
  })
})

describe('Ciclo de vida do agendamento', () => {
  let profissionalId: string
  let token: string
  let pacienteId: string
  let pacoteId: string

  const data = '2031-06-15'

  beforeAll(async () => {
    const p = await criarProfissional({
      email: `agenda-fluxo${Date.now()}@test.com`,
      horario_inicio: '08:00',
      horario_fim: '18:00',
    })
    profissionalId = p.id
    token = gerarToken(profissionalId)
    const pac = await criarPaciente(profissionalId)
    pacienteId = pac.id
  })

  afterAll(async () => {
    await prisma.sessaoPacote.deleteMany({ where: { pacote_id: pacoteId } })
    await prisma.agendamento.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.pacote.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.paciente.deleteMany({ where: { profissional_id: profissionalId } })
    await prisma.profissional.delete({ where: { id: profissionalId } })
  })

  it('cria agendamento via pacote e o expõe na grade do dia', async () => {
    const res = await request(app)
      .post(`/v1/pacientes/${pacienteId}/pacotes`)
      .set(getAuthHeaders(token))
      .send({
        tipo: 'PACOTE_5',
        sessoes: [{ data, horario: '09:00', slot: 1, tipo: 'AVALIACAO' }],
      })
    expect(res.status).toBe(201)
    pacoteId = res.body.pacote.id

    const grade = await request(app)
      .get('/v1/agenda')
      .query({ data })
      .set(getAuthHeaders(token))
    expect(grade.status).toBe(200)
    const horario = grade.body.horarios.find((h: any) => h.horario === '09:00')
    expect(horario).toBeDefined()
    const slot = horario.slots.find((s: any) => s.slot === 1)
    expect(slot.agendamento).not.toBeNull()
    expect(slot.agendamento.paciente.nome).toBe('Paciente Teste')
  })

  it('rejeita sessão no mesmo slot já ocupado', async () => {
    const res = await request(app)
      .post(`/v1/pacotes/${pacoteId}/sessoes`)
      .set(getAuthHeaders(token))
      .send({ data, horario: '09:00', slot: 1, tipo: 'SESSAO' })
    expect(res.status).toBe(400)
  })

  it('altera status do agendamento e reflete na grade', async () => {
    const grade = await request(app)
      .get('/v1/agenda')
      .query({ data })
      .set(getAuthHeaders(token))
    const horario = grade.body.horarios.find((h: any) => h.horario === '09:00')
    const agendamentoId = horario.slots[0].agendamento.id

    const res = await request(app)
      .patch(`/v1/agenda/agendamentos/${agendamentoId}/status`)
      .set(getAuthHeaders(token))
      .send({ status: 'COMPARECEU' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('COMPARECEU')

    const grade2 = await request(app)
      .get('/v1/agenda')
      .query({ data })
      .set(getAuthHeaders(token))
    const horario2 = grade2.body.horarios.find((h: any) => h.horario === '09:00')
    expect(horario2.slots[0].agendamento.status).toBe('COMPARECEU')
  })

  it('DESMARCOU remove a sessão do pacote e oculta da grade', async () => {
    const novaSessao = await request(app)
      .post(`/v1/pacotes/${pacoteId}/sessoes`)
      .set(getAuthHeaders(token))
      .send({ data, horario: '10:00', slot: 1, tipo: 'SESSAO' })
    expect(novaSessao.status).toBe(201)
    const novoAgendamentoId = novaSessao.body.agendamento.id

    const desmarcado = await request(app)
      .patch(`/v1/agenda/agendamentos/${novoAgendamentoId}/status`)
      .set(getAuthHeaders(token))
      .send({ status: 'DESMARCOU' })
    expect(desmarcado.status).toBe(200)

    // A grade não exibe mais o horário DESMARCOU
    const grade = await request(app)
      .get('/v1/agenda')
      .query({ data })
      .set(getAuthHeaders(token))
    const horario = grade.body.horarios.find((h: any) => h.horario === '10:00')
    expect(horario.slots[0].agendamento).toBeNull()

    // A sessão foi desvinculada do pacote (libera a cota)
    const pacotes = await request(app)
      .get(`/v1/pacientes/${pacienteId}/pacotes`)
      .set(getAuthHeaders(token))
    expect(pacotes.status).toBe(200)
    const pacote = pacotes.body.find((p: any) => p.id === pacoteId)
    expect(pacote.sessoes.some((s: any) => s.agendamento.id === novoAgendamentoId)).toBe(false)
  })
})
