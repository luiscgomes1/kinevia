import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { wherePacote, wherePaciente } from '../lib/escopo'

// GET /financeiro
export async function resumoFinanceiro(req: Request, res: Response) {
  const { mes, ano } = req.query
  // Parâmetros opcionais: ?mes=06&ano=2026
  // Se não vier, retorna o mês atual

  const agora = new Date()
  const mesFiltro = mes ? parseInt(mes as string) : agora.getMonth() + 1
  const anoFiltro = ano ? parseInt(ano as string) : agora.getFullYear()

  // Primeiro e último dia do mês filtrado
  const inicioPeriodo = new Date(Date.UTC(anoFiltro, mesFiltro - 1, 1))
  const fimPeriodo = new Date(Date.UTC(anoFiltro, mesFiltro, 0, 23, 59, 59))
  // new Date(ano, mes, 0) = último dia do mês anterior = último dia do mês filtrado
  // Truque do JavaScript: dia 0 de um mês = último dia do mês anterior

  // Todos os pacotes do profissional no período
  const pacotesNoPeriodo = await prisma.pacote.findMany({
    where: {
      ...wherePacote(req),
      criado_em: {
        gte: inicioPeriodo, // gte = greater than or equal (>=)
        lte: fimPeriodo,    // lte = less than or equal (<=)
      }
    },
    select: {
      valor_cobrado: true,
      status_pagamento: true,
      tipo: true,
    }
  })

  // Calcula os totais do período
  const recebidoNoMes = pacotesNoPeriodo
    .filter(p => p.status_pagamento === 'PAGO')
    .reduce((acc, p) => acc + Number(p.valor_cobrado), 0)

  const aReceberNoMes = pacotesNoPeriodo
    .filter(p => p.status_pagamento === 'AGUARDANDO')
    .reduce((acc, p) => acc + Number(p.valor_cobrado), 0)

  // Total acumulado (todos os pacotes pagos, independente do período)
  const todosPacotesPagos = await prisma.pacote.findMany({
    where: {
      ...wherePacote(req),
      status_pagamento: 'PAGO',
    },
    select: { valor_cobrado: true }
  })

  const totalAcumulado = todosPacotesPagos
    .reduce((acc, p) => acc + Number(p.valor_cobrado), 0)

  // Breakdown por tipo no período
  const porTipo = {
    individual: pacotesNoPeriodo.filter(p => p.tipo === 'INDIVIDUAL'),
    pacote_5: pacotesNoPeriodo.filter(p => p.tipo === 'PACOTE_5'),
    pacote_10: pacotesNoPeriodo.filter(p => p.tipo === 'PACOTE_10'),
  }

  return res.json({
    periodo: {
      mes: mesFiltro,
      ano: anoFiltro,
    },
    recebido_no_mes: recebidoNoMes,
    a_receber_no_mes: aReceberNoMes,
    total_periodo: recebidoNoMes + aReceberNoMes,
    total_acumulado: totalAcumulado,
    breakdown_por_tipo: {
      individual: {
        quantidade: porTipo.individual.length,
        valor: porTipo.individual.reduce((acc, p) => acc + Number(p.valor_cobrado), 0),
      },
      pacote_5: {
        quantidade: porTipo.pacote_5.length,
        valor: porTipo.pacote_5.reduce((acc, p) => acc + Number(p.valor_cobrado), 0),
      },
      pacote_10: {
        quantidade: porTipo.pacote_10.length,
        valor: porTipo.pacote_10.reduce((acc, p) => acc + Number(p.valor_cobrado), 0),
      },
    }
  })
}

// GET /financeiro/pacientes
export async function financeiroPorPaciente(req: Request, res: Response) {
  const { mes, ano } = req.query

  const agora = new Date()
  const mesFiltro = mes ? parseInt(mes as string) : agora.getMonth() + 1
  const anoFiltro = ano ? parseInt(ano as string) : agora.getFullYear()

  const inicioPeriodo = new Date(Date.UTC(anoFiltro, mesFiltro - 1, 1))
  const fimPeriodo = new Date(Date.UTC(anoFiltro, mesFiltro, 0, 23, 59, 59))

  const pacotes = await prisma.pacote.findMany({
    where: {
      ...wherePacote(req),
      criado_em: {
        gte: inicioPeriodo,
        lte: fimPeriodo,
      }
    },
    include: {
      paciente: {
        select: { id: true, nome: true }
      },
      sessoes: true,
    },
    orderBy: { criado_em: 'desc' }
  })

  // Agrupa por paciente
  const porPaciente = pacotes.reduce((acc, pacote) => {
    const pacienteId = pacote.paciente.id
    const pacienteNome = pacote.paciente.nome

    if (!acc[pacienteId]) {
      acc[pacienteId] = {
        paciente_id: pacienteId,
        paciente_nome: pacienteNome,
        total_cobrado: 0,
        total_recebido: 0,
        total_pendente: 0,
        pacotes: [],
      }
    }

    const valor = Number(pacote.valor_cobrado)
    acc[pacienteId].total_cobrado += valor

    if (pacote.status_pagamento === 'PAGO') {
      acc[pacienteId].total_recebido += valor
    } else {
      acc[pacienteId].total_pendente += valor
    }

    acc[pacienteId].pacotes.push({
      id: pacote.id,
      tipo: pacote.tipo,
      valor_cobrado: valor,
      status_pagamento: pacote.status_pagamento,
      pago_em: pacote.pago_em,
      sessoes_total: pacote.sessoes.length,
      criado_em: pacote.criado_em,
    })

    return acc
  }, {} as Record<string, any>)

  // Converte o objeto em array ordenado por nome
  const resultado = Object.values(porPaciente).sort((a: any, b: any) =>
    a.paciente_nome.localeCompare(b.paciente_nome)
  )

  return res.json({
    periodo: { mes: mesFiltro, ano: anoFiltro },
    pacientes: resultado,
  })
}

// GET /financeiro/pacientes/:id
export async function financeiroPacienteId(req: Request, res: Response) {
  const { id } = req.params
  const { mes, ano } = req.query

  const agora = new Date()
  const mesFiltro = mes ? parseInt(mes as string) : agora.getMonth() + 1
  const anoFiltro = ano ? parseInt(ano as string) : agora.getFullYear()

  const inicioPeriodo = new Date(Date.UTC(anoFiltro, mesFiltro - 1, 1))
  const fimPeriodo = new Date(Date.UTC(anoFiltro, mesFiltro, 0, 23, 59, 59))

  const pacotes = await prisma.pacote.findMany({
    where: {
      ...wherePacote(req),
      paciente_id: id,
      criado_em: {
        gte: inicioPeriodo,
        lte: fimPeriodo,
      }
    },
    include: {
      sessoes: true,
    },
    orderBy: { criado_em: 'desc' }
  })

  const paciente = await prisma.paciente.findFirst({
    where: { id, ...wherePaciente(req), deleted_at: null },
    select: { id: true, nome: true }
  })

  if (!paciente) {
    return res.status(404).json({ erro: 'Paciente não encontrado.' })
  }

  const total_cobrado = pacotes.reduce((acc, p) => acc + Number(p.valor_cobrado), 0)
  const total_recebido = pacotes.filter(p => p.status_pagamento === 'PAGO').reduce((acc, p) => acc + Number(p.valor_cobrado), 0)
  const total_pendente = pacotes.filter(p => p.status_pagamento === 'AGUARDANDO').reduce((acc, p) => acc + Number(p.valor_cobrado), 0)

  return res.json({
    paciente_id: paciente.id,
    paciente_nome: paciente.nome,
    total_cobrado,
    total_recebido,
    total_pendente,
    pacotes: pacotes.map(p => ({
      id: p.id,
      tipo: p.tipo,
      valor_cobrado: Number(p.valor_cobrado),
      status_pagamento: p.status_pagamento,
      pago_em: p.pago_em,
      sessoes_total: p.sessoes.length,
      criado_em: p.criado_em,
    })),
  })
}