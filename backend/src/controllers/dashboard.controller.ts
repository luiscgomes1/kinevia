import { Request, Response } from 'express'
import prisma from '../lib/prisma'

async function validarFiltroProfissional(req: Request, profissionalFiltro?: string): Promise<string | null | undefined> {
    if (!profissionalFiltro) return undefined

    if (req.role === 'SUPER_ADMIN') {
        const alvo = await prisma.profissional.findUnique({
            where: { id: profissionalFiltro },
            select: { role: true },
        })
        return !alvo || alvo.role === 'ATENDENTE' ? null : profissionalFiltro
    }

    if (req.role === 'ADMIN' || req.role === 'ATENDENTE') {
        const alvo = await prisma.profissional.findUnique({
            where: { id: profissionalFiltro },
            select: { clinica_id: true, role: true },
        })
        if (!alvo || alvo.role === 'ATENDENTE') return null
        if (alvo.clinica_id !== req.clinicaId) return null
        return profissionalFiltro
    }

    return req.profissionalId
}

function buildWhereComum(req: Request, profissionalFiltro?: string): Record<string, unknown> {
    if (profissionalFiltro && (req.role === 'ADMIN' || req.role === 'SUPER_ADMIN' || req.role === 'ATENDENTE')) {
        return { profissional_id: profissionalFiltro }
    }
    if (req.role === 'SUPER_ADMIN') return {}
    if ((req.role === 'ADMIN' || req.role === 'ATENDENTE') && req.clinicaId) {
        return { profissional: { clinica_id: req.clinicaId } }
    }
    return { profissional_id: req.profissionalId! }
}

function buildWhereProfissional(req: Request, profissionalFiltro?: string) {
    if (profissionalFiltro && (req.role === 'ADMIN' || req.role === 'SUPER_ADMIN' || req.role === 'ATENDENTE')) {
        return { id: profissionalFiltro }
    }
    if (req.role === 'SUPER_ADMIN') return {}
    if ((req.role === 'ADMIN' || req.role === 'ATENDENTE') && req.clinicaId) return { clinica_id: req.clinicaId }
    return { id: req.profissionalId! }
}

const chaveMes = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`

const LIMITE = { INDIVIDUAL: 1, PACOTE_5: 5, PACOTE_10: 10 } as const

function calcularFaturamento(
    agendamentos: { id: string; data: Date; profissional_id: string }[],
    pacotePorAgendamento: Map<string, { pacote: { tipo: string; valor_cobrado: { toNumber(): number } | number } }>,
    precoPorProf: Map<string, number>,
    filtroMes?: (data: Date) => boolean,
): number {
    let total = 0
    for (const a of agendamentos) {
        if (filtroMes && !filtroMes(a.data)) continue
        const vinculo = pacotePorAgendamento.get(a.id)
        if (vinculo) {
            const tipo = vinculo.pacote.tipo as keyof typeof LIMITE
            total += Number(vinculo.pacote.valor_cobrado) / LIMITE[tipo]
        } else {
            total += precoPorProf.get(a.profissional_id) ?? 0
        }
    }
    return total
}

export async function resumoDashboard(req: Request, res: Response) {
    const dataQuery = req.query.data as string | undefined

    if (!dataQuery || !/^\d{4}-\d{2}-\d{2}$/.test(dataQuery)) {
        return res.status(400).json({ erro: 'Parâmetro data (YYYY-MM-DD) é obrigatório.' })
    }

    const profissionalFiltro = await validarFiltroProfissional(req, req.query.profissional_id as string | undefined)
    if (profissionalFiltro === null || (req.query.profissional_id && !profissionalFiltro)) {
        return res.status(404).json({ erro: 'Profissional não encontrado.' })
    }
    const where = buildWhereComum(req, profissionalFiltro)

    const [ano, mes] = dataQuery.split('-').map(Number)
    const inicioMes = new Date(Date.UTC(ano, mes - 1, 1))
    const inicioHoje = new Date(dataQuery)
    const inicioOntem = new Date(inicioHoje)
    inicioOntem.setUTCDate(inicioHoje.getUTCDate() - 1)
    const fimOntem = new Date(inicioHoje.valueOf() - 1)
    const dataFim = new Date(dataQuery)
    dataFim.setHours(23, 59, 59, 999)
    const fimProximos = new Date(inicioHoje)
    fimProximos.setUTCDate(inicioHoje.getUTCDate() + 3)
    const inicio30 = new Date(inicioHoje)
    inicio30.setUTCDate(inicioHoje.getUTCDate() - 29)

    const [agendamentosHoje, agendamentosOntem, agendamentosMes, agendamentos30, proximos] = await Promise.all([
        prisma.agendamento.findMany({
            where: { ...where, data: { gte: inicioHoje, lte: dataFim } },
            select: { status: true },
        }),
        prisma.agendamento.findMany({
            where: { ...where, data: { gte: inicioOntem, lte: fimOntem } },
            select: { status: true },
        }),
        prisma.agendamento.findMany({
            where: { ...where, data: { gte: inicioMes, lte: dataFim } },
            select: { id: true, status: true, paciente_id: true, profissional_id: true, data: true },
        }),
        prisma.agendamento.findMany({
            where: { ...where, status: 'COMPARECEU', data: { gte: inicio30, lte: dataFim } },
            select: { data: true },
        }),
        prisma.agendamento.findMany({
            where: { ...where, status: 'AGENDADO', data: { gte: inicioHoje, lt: fimProximos } },
            select: {
                data: true,
                horario: true,
                slot: true,
                tipo: true,
                paciente: { select: { id: true, nome: true } },
            },
            orderBy: [{ data: 'asc' }, { horario: 'asc' }, { slot: 'asc' }],
            take: 20,
        }),
    ])

    const totalHoje = agendamentosHoje.length
    const compareceuHoje = agendamentosHoje.filter((a) => a.status === 'COMPARECEU').length
    const faltouHoje = agendamentosHoje.filter((a) => a.status === 'FALTOU').length

    const totalOntem = agendamentosOntem.length
    const faltouOntem = agendamentosOntem.filter((a) => a.status === 'FALTOU').length

    const totalMes = agendamentosMes.length
    const compareceuMes = agendamentosMes.filter((a) => a.status === 'COMPARECEU').length
    const faltouMes = agendamentosMes.filter((a) => a.status === 'FALTOU').length

    const pacientesAtivos = new Set(
        agendamentosMes.filter((a) => a.status === 'COMPARECEU').map((a) => a.paciente_id)
    ).size

    const [novosPacientes, totalPacientes, laudosMes] = await Promise.all([
        prisma.paciente.count({ where: { ...where, deleted_at: null, criado_em: { gte: inicioMes, lte: dataFim } } }),
        prisma.paciente.count({ where: { ...where, deleted_at: null } }),
        prisma.laudo.count({ where: { ...where, criado_em: { gte: inicioMes, lte: dataFim } } }),
    ])

    const resposta: {
        hoje: Record<string, unknown>
        mes: Record<string, unknown>
        proximos: {
            data: string
            horario: string
            slot: number
            tipo: string
            paciente_id: string
            paciente_nome: string
        }[]
        semAvaliacao?: { total: number; lista: { id: string; nome: string }[] }
        pagamentosAguardando?: { total: number; lista: { paciente_id: string; paciente_nome: string; valor: number }[] }
        chart: Record<string, unknown>
    } = {
        hoje: {
            total: totalHoje,
            compareceu: compareceuHoje,
            faltou: faltouHoje,
            taxaFaltas: totalHoje > 0 ? Math.round((faltouHoje / totalHoje) * 100) : 0,
            ontem: {
                total: totalOntem,
                faltou: faltouOntem,
                taxaFaltas: totalOntem > 0 ? Math.round((faltouOntem / totalOntem) * 100) : 0,
            },
        },
        mes: {
            total: totalMes,
            compareceu: compareceuMes,
            faltou: faltouMes,
            pacientesAtivos,
            comparecimento: totalMes > 0 ? Math.round((compareceuMes / totalMes) * 100) : 0,
            novosPacientes,
            totalPacientes,
            laudosMes,
        },
        proximos: proximos.map((a) => ({
            data: a.data.toISOString().split('T')[0],
            horario: a.horario,
            slot: a.slot,
            tipo: a.tipo,
            paciente_id: a.paciente.id,
            paciente_nome: a.paciente.nome,
        })),
        chart: {},
    }

    // Gráfico — sessões nos últimos 30 dias.
    const porDia = new Map<string, number>()
    for (let i = 0; i < 30; i++) {
        const d = new Date(inicio30)
        d.setUTCDate(inicio30.getUTCDate() + i)
        porDia.set(d.toISOString().split('T')[0], 0)
    }
    for (const a of agendamentos30) {
        const dia = a.data.toISOString().split('T')[0]
        if (porDia.has(dia)) porDia.set(dia, (porDia.get(dia) || 0) + 1)
    }
    resposta.chart.sessoes30Dias = Array.from(porDia, ([dia, quantidade]) => ({ dia, quantidade }))

    // Pacientes sem avaliação inicial — não visível para ATENDENTE.
    if (req.role === 'ADMIN' || req.role === 'PROFISSIONAL' || req.role === 'SUPER_ADMIN') {
        const pacientes = await prisma.paciente.findMany({
            where: { ...where, deleted_at: null },
            select: { id: true, nome: true },
        })
        const prontuarios = pacientes.length > 0
            ? await prisma.prontuario.findMany({
                where: { paciente_id: { in: pacientes.map((p) => p.id) } },
                select: { paciente_id: true, queixa_principal: true, hda: true, avaliacao_fisica: true },
            })
            : []
        const prPorPaciente = new Map(prontuarios.map((p) => [p.paciente_id, p]))
        const semAv = pacientes.filter((p) => {
            const pr = prPorPaciente.get(p.id)
            if (!pr) return true
            return !(pr.queixa_principal?.trim() || pr.hda?.trim() || pr.avaliacao_fisica?.trim())
        })
        resposta.semAvaliacao = { total: semAv.length, lista: semAv.slice(0, 5) }
    }

    // Financeiro — somente ADMIN/SUPER_ADMIN.
    if (req.role === 'ADMIN' || req.role === 'SUPER_ADMIN') {
        const pacotesMes = await prisma.pacote.findMany({
            where: { ...where, criado_em: { gte: inicioMes, lte: dataFim } },
            select: { status_pagamento: true, valor_cobrado: true },
        })
        const recebidoMes = pacotesMes
            .filter((p) => p.status_pagamento === 'PAGO')
            .reduce((s, p) => s + Number(p.valor_cobrado), 0)
        const aReceberMes = pacotesMes
            .filter((p) => p.status_pagamento === 'AGUARDANDO')
            .reduce((s, p) => s + Number(p.valor_cobrado), 0)

        const aguardandoCount = await prisma.pacote.count({
            where: { ...where, status_pagamento: 'AGUARDANDO' },
        })
        const aguardandoLista = await prisma.pacote.findMany({
            where: { ...where, status_pagamento: 'AGUARDANDO' },
            select: { valor_cobrado: true, paciente: { select: { id: true, nome: true } } },
            orderBy: { valor_cobrado: 'desc' },
            take: 5,
        })
        resposta.pagamentosAguardando = {
            total: aguardandoCount,
            lista: aguardandoLista.map((p) => ({
                paciente_id: p.paciente.id,
                paciente_nome: p.paciente.nome,
                valor: Number(p.valor_cobrado),
            })),
        }

        // Faturamento estimado — somente ADMIN/SUPER_ADMIN.
        const sessionIds = agendamentosMes.filter((a) => a.status === 'COMPARECEU').map((a) => a.id)
        const sessoesPacote = sessionIds.length > 0
            ? await prisma.sessaoPacote.findMany({
                where: { agendamento_id: { in: sessionIds } },
                include: {
                    pacote: {
                        select: { tipo: true, valor_cobrado: true },
                    },
                },
            })
            : []
        const pacotePorAgendamento = new Map(sessoesPacote.map((sp) => [sp.agendamento_id, sp]))

        const profissionais = await prisma.profissional.findMany({
            where: buildWhereProfissional(req, profissionalFiltro),
            select: { id: true, preco_sessao_individual: true, preco_pacote_5: true, preco_pacote_10: true },
        })
        const precoPorProf = new Map(profissionais.map((p) => [p.id, Number(p.preco_sessao_individual)]))

        resposta.mes.faturamentoEstimado = calcularFaturamento(
            agendamentosMes.filter((a) => a.status === 'COMPARECEU'),
            pacotePorAgendamento,
            precoPorProf,
        )
        resposta.mes.recebidoMes = recebidoMes
        resposta.mes.aReceberMes = aReceberMes

        // Faturamento estimado vs recebido — últimos 6 meses.
        const meses = [] as Date[]
        for (let i = 5; i >= 0; i--) meses.push(new Date(Date.UTC(ano, mes - 1 - i, 1)))
        const inicio6 = meses[0]

        const agendamentos6 = await prisma.agendamento.findMany({
            where: { ...where, status: 'COMPARECEU', data: { gte: inicio6, lte: dataFim } },
            select: { id: true, data: true, profissional_id: true },
        })
        const sessionIds6 = agendamentos6.map((a) => a.id)
        const vinculos6 = sessionIds6.length > 0
            ? await prisma.sessaoPacote.findMany({
                where: { agendamento_id: { in: sessionIds6 } },
                include: {
                    pacote: {
                        select: { tipo: true, valor_cobrado: true },
                    },
                },
            })
            : []
        const pacotePorAgendamento6 = new Map(vinculos6.map((sp) => [sp.agendamento_id, sp]))

        const recebidos6 = await prisma.pacote.findMany({
            where: { ...where, status_pagamento: 'PAGO', pago_em: { gte: inicio6, lte: dataFim } },
            select: { valor_cobrado: true, pago_em: true },
        })

        const faturamentoMensal = meses.map((m) => {
            const chave = chaveMes(m)
            const estimado = calcularFaturamento(
                agendamentos6,
                pacotePorAgendamento6,
                precoPorProf,
                (d) => chaveMes(d) === chave,
            )
            const recebido = recebidos6
                .filter((p) => p.pago_em && chaveMes(p.pago_em) === chave)
                .reduce((s, p) => s + Number(p.valor_cobrado), 0)
            return {
                mes: chave,
                estimado: Math.round(estimado * 100) / 100,
                recebido: Math.round(recebido * 100) / 100,
            }
        })
        resposta.chart.faturamentoMensal = faturamentoMensal
    }

    res.json(resposta)
}