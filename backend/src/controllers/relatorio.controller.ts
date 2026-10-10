import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { resolverProfissionalAlvo } from '../lib/escopo'

function buildWhereAgendamento(req: Request, profissionalFiltro?: string) {
    if (profissionalFiltro && (req.role === 'ADMIN' || req.role === 'SUPER_ADMIN')) {
        return { profissional_id: profissionalFiltro }
    }
    if (req.role === 'SUPER_ADMIN') return {}
    if (req.role === 'ADMIN' && req.clinicaId) {
        return { profissional: { clinica_id: req.clinicaId } }
    }
    return { profissional_id: req.profissionalId! }
}

function buildWhereEvolucao(req: Request, profissionalFiltro?: string) {
    if (profissionalFiltro && (req.role === 'ADMIN' || req.role === 'SUPER_ADMIN')) {
        return { prontuario: { paciente: { profissional_id: profissionalFiltro } } }
    }
    if (req.role === 'SUPER_ADMIN') return {}
    if (req.role === 'ADMIN' && req.clinicaId) {
        return { prontuario: { paciente: { profissional: { clinica_id: req.clinicaId } } } }
    }
    return { prontuario: { paciente: { profissional_id: req.profissionalId! } } }
}

function buildWhereProfissional(req: Request, profissionalFiltro?: string) {
    if (profissionalFiltro && (req.role === 'ADMIN' || req.role === 'SUPER_ADMIN')) {
        return { id: profissionalFiltro }
    }
    if (req.role === 'SUPER_ADMIN') return {}
    if (req.role === 'ADMIN' && req.clinicaId) return { clinica_id: req.clinicaId }
    return { id: req.profissionalId! }
}

export async function resumoPeriodo(req: Request, res: Response) {
    const { inicio, fim } = req.query

    if (!inicio || !fim) {
        return res.status(400).json({ erro: 'Parâmetros inicio e fim (YYYY-MM-DD) são obrigatórios.' })
    }

    const dataInicio = new Date(inicio as string)
    const dataFim = new Date(fim as string)
    dataFim.setHours(23, 59, 59, 999)

    const profissionalFiltro = req.query.profissional_id as string | undefined
    const profissionalAlvo = profissionalFiltro
        ? await resolverProfissionalAlvo(req, profissionalFiltro)
        : undefined
    if (profissionalAlvo === null) {
        return res.status(404).json({ erro: 'Profissional não encontrado.' })
    }
    const whereAgendamento = buildWhereAgendamento(req, profissionalAlvo)

    const agendamentos = await prisma.agendamento.findMany({
        where: {
            ...whereAgendamento,
            data: { gte: dataInicio, lte: dataFim },
        },
        select: {
            id: true,
            status: true,
            data: true,
            paciente_id: true,
            profissional_id: true,
        },
    })

    const total = agendamentos.length
    const compareceu = agendamentos.filter((a) => a.status === 'COMPARECEU').length
    const faltou = agendamentos.filter((a) => a.status === 'FALTOU').length
    const desmarcou = agendamentos.filter((a) => a.status === 'DESMARCOU').length

    const pacientesAtivos = new Set(
        agendamentos.filter((a) => a.status === 'COMPARECEU').map((a) => a.paciente_id)
    ).size

    const taxaFaltas = total > 0 ? Math.round((faltou / total) * 100) : 0

    const sessoesPorMes: { mes: string; quantidade: number }[] = []
    const agrupado = new Map<string, number>()
    for (const a of agendamentos) {
        if (a.status !== 'COMPARECEU') continue
        const chave = `${a.data.getFullYear()}-${String(a.data.getMonth() + 1).padStart(2, '0')}`
        agrupado.set(chave, (agrupado.get(chave) || 0) + 1)
    }
    for (const [mes, quantidade] of agrupado) {
        sessoesPorMes.push({ mes, quantidade })
    }
    sessoesPorMes.sort((a, b) => a.mes.localeCompare(b.mes))

    let faturamentoEstimado: number | undefined

    if (req.role === 'ADMIN' || req.role === 'SUPER_ADMIN') {
        const sessionIds = agendamentos.filter(a => a.status === 'COMPARECEU').map(a => a.id)

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

        const pacotePorAgendamento = new Map(sessoesPacote.map(sp => [sp.agendamento_id, sp]))

        const profissionais = await prisma.profissional.findMany({
            where: buildWhereProfissional(req, profissionalAlvo),
            select: { id: true, preco_sessao_individual: true, preco_pacote_5: true, preco_pacote_10: true },
        })
        const precoPorProf = new Map(profissionais.map(p => [p.id, Number(p.preco_sessao_individual)]))

        faturamentoEstimado = 0
        const LIMITE = { INDIVIDUAL: 1, PACOTE_5: 5, PACOTE_10: 10 } as const
        for (const a of agendamentos) {
            if (a.status !== 'COMPARECEU') continue
            const vinculo = pacotePorAgendamento.get(a.id)
            if (vinculo) {
                const tipo = vinculo.pacote.tipo as keyof typeof LIMITE
                faturamentoEstimado += Number(vinculo.pacote.valor_cobrado) / LIMITE[tipo]
            } else {
                faturamentoEstimado += precoPorProf.get(a.profissional_id) ?? 0
            }
        }
    }

    const evolucoes = await prisma.evolucao.findMany({
        where: {
            ...buildWhereEvolucao(req, profissionalAlvo),
            dor_eva: { not: null },
            criado_em: { gte: dataInicio, lte: dataFim },
        },
        select: { dor_eva: true, criado_em: true },
        orderBy: { criado_em: 'asc' },
    })

    return res.json({
        periodo: { inicio, fim },
        total,
        compareceu,
        faltou,
        desmarcou,
        taxaFaltas,
        pacientesAtivos,
        sessoesPorMes,
        ...(req.role === 'ADMIN' || req.role === 'SUPER_ADMIN' ? { faturamentoEstimado } : {}),
        evolucaoEva: evolucoes.map((e) => ({
            data: e.criado_em.toISOString().split('T')[0],
            eva: e.dor_eva,
        })),
    })
}

function buildWhereCount(req: Request, profissionalFiltro?: string) {
    if (profissionalFiltro && (req.role === 'ADMIN' || req.role === 'SUPER_ADMIN')) {
        return { profissional_id: profissionalFiltro }
    }
    if (req.role === 'SUPER_ADMIN') return {}
    if (req.role === 'ADMIN' && req.clinicaId) {
        return { profissional: { clinica_id: req.clinicaId } }
    }
    return { profissional_id: req.profissionalId! }
}

export async function comparativoPeriodo(req: Request, res: Response) {
    const { inicio, fim } = req.query

    if (!inicio || !fim) {
        return res.status(400).json({ erro: 'Parâmetros inicio e fim (YYYY-MM-DD) são obrigatórios.' })
    }

    const dataInicio = new Date(inicio as string)
    const dataFim = new Date(fim as string)
    const diffMs = dataFim.getTime() - dataInicio.getTime()
    const dataInicioAnterior = new Date(dataInicio.getTime() - diffMs - 1)
    const dataFimAnterior = new Date(dataInicio.getTime() - 1)
    dataFim.setHours(23, 59, 59, 999)
    dataFimAnterior.setHours(23, 59, 59, 999)

    const profissionalFiltro = req.query.profissional_id as string | undefined
    const profissionalAlvo = profissionalFiltro
        ? await resolverProfissionalAlvo(req, profissionalFiltro)
        : undefined
    if (profissionalAlvo === null) {
        return res.status(404).json({ erro: 'Profissional não encontrado.' })
    }
    const where = buildWhereCount(req, profissionalAlvo)

    function makeWhere(dataGte: Date, dataLte: Date, status: string) {
        return { ...where, data: { gte: dataGte, lte: dataLte }, status: status as any }
    }

    const [atualCompareceu, atualFaltou, atualDesmarcou, antCompareceu, antFaltou, antDesmarcou] = await Promise.all([
        prisma.agendamento.count({ where: makeWhere(dataInicio, dataFim, 'COMPARECEU') }),
        prisma.agendamento.count({ where: makeWhere(dataInicio, dataFim, 'FALTOU') }),
        prisma.agendamento.count({ where: makeWhere(dataInicio, dataFim, 'DESMARCOU') }),
        prisma.agendamento.count({ where: makeWhere(dataInicioAnterior, dataFimAnterior, 'COMPARECEU') }),
        prisma.agendamento.count({ where: makeWhere(dataInicioAnterior, dataFimAnterior, 'FALTOU') }),
        prisma.agendamento.count({ where: makeWhere(dataInicioAnterior, dataFimAnterior, 'DESMARCOU') }),
    ])

    const totalAtual = atualCompareceu + atualFaltou + atualDesmarcou
    const totalAnterior = antCompareceu + antFaltou + antDesmarcou

    function pct(v: number, base: number) {
        return base > 0 ? Math.round(((v - base) / base) * 100) : 0
    }

    res.json({
        periodo: { inicio, fim },
        periodoAnterior: {
            inicio: dataInicioAnterior.toISOString().split('T')[0],
            fim: dataFimAnterior.toISOString().split('T')[0],
        },
        atual: {
            total: totalAtual,
            compareceu: atualCompareceu,
            faltou: atualFaltou,
            desmarcou: atualDesmarcou,
        },
        anterior: {
            total: totalAnterior,
            compareceu: antCompareceu,
            faltou: antFaltou,
            desmarcou: antDesmarcou,
        },
        variacao: {
            total: pct(totalAtual, totalAnterior),
            compareceu: pct(atualCompareceu, antCompareceu),
            faltou: pct(atualFaltou, antFaltou),
            desmarcou: pct(atualDesmarcou, antDesmarcou),
        },
    })
}
