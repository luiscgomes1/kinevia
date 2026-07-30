import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export async function resumoPeriodo(req: Request, res: Response) {
    const { inicio, fim } = req.query

    if (!inicio || !fim) {
        return res.status(400).json({ erro: 'Parâmetros inicio e fim (YYYY-MM-DD) são obrigatórios.' })
    }

    const dataInicio = new Date(inicio as string)
    const dataFim = new Date(fim as string)
    dataFim.setHours(23, 59, 59, 999)

    const profissionalId = req.profissionalId

    const agendamentos = await prisma.agendamento.findMany({
        where: {
            profissional_id: profissionalId,
            data: { gte: dataInicio, lte: dataFim },
        },
        select: {
            id: true,
            status: true,
            data: true,
            paciente_id: true,
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

    // Busca os IDs das sessões COMPARECEU que pertencem a pacotes
    // para calcular o faturamento real (considerando preços de pacote)
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

    const profissional = await prisma.profissional.findUnique({
        where: { id: profissionalId },
        select: { preco_sessao_individual: true, preco_pacote_5: true, preco_pacote_10: true },
    })

    let faturamentoEstimado = 0
    const LIMITE = { INDIVIDUAL: 1, PACOTE_5: 5, PACOTE_10: 10 } as const
    for (const id of sessionIds) {
        const vinculo = pacotePorAgendamento.get(id)
        if (vinculo) {
            const tipo = vinculo.pacote.tipo as keyof typeof LIMITE
            const precoPorSessao = Number(vinculo.pacote.valor_cobrado) / LIMITE[tipo]
            faturamentoEstimado += precoPorSessao
        } else if (profissional) {
            faturamentoEstimado += Number(profissional.preco_sessao_individual)
        }
    }

    const evolucoes = await prisma.evolucao.findMany({
        where: {
            dor_eva: { not: null },
            prontuario: {
                paciente: {
                    profissional_id: profissionalId,
                },
            },
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
        faturamentoEstimado,
        evolucaoEva: evolucoes.map((e) => ({
            data: e.criado_em.toISOString().split('T')[0],
            eva: e.dor_eva,
        })),
    })
}
