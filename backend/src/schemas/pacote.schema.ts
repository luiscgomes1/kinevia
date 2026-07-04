import { z } from 'zod'

const LIMITE_SESSOES_POR_TIPO = {
    INDIVIDUAL: 1,
    PACOTE_5: 5,
    PACOTE_10: 10,
} as const

const dataSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'A data é obrigatória e deve estar no formato YYYY-MM-DD.'
}).refine((valor) => {
    const [ano, mes, dia] = valor.split('-').map(Number)
    const data = new Date(Date.UTC(ano, mes - 1, dia))

    return data.getUTCFullYear() === ano
        && data.getUTCMonth() === mes - 1
        && data.getUTCDate() === dia
}, {
    message: 'Data inválida.'
})

const horarioSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'O horário é obrigatório e deve estar no formato HH:mm.'
})

const sessaoSchema = z.object({
    data: dataSchema,
    horario: horarioSchema,
    slot: z.number().int().min(1).max(3, { message: 'O slot é obrigatório e deve ser 1, 2 ou 3.' }),
    tipo: z.enum(['AVALIACAO', 'SESSAO', 'REPOSICAO']).optional(),
})

export const criarPacoteSchema = z.object({
    tipo: z.enum(['INDIVIDUAL', 'PACOTE_5', 'PACOTE_10'], {
        errorMap: () => ({ message: 'O tipo do pacote é obrigatório e deve ser INDIVIDUAL, PACOTE_5 ou PACOTE_10.' }),
    }),
    valor_cobrado: z.number().nonnegative({ message: 'O valor cobrado é obrigatório e deve ser um número não negativo.' }),
    status_pagamento: z.enum(['AGUARDANDO', 'PAGO']).optional(),
    sessoes: z.array(sessaoSchema).optional(),
}).superRefine((dados, ctx) => {
    if (!dados.sessoes?.length) {
        return
    }

    const limite = LIMITE_SESSOES_POR_TIPO[dados.tipo]

    if (dados.sessoes.length > limite) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['sessoes'],
            message: `Um pacote do tipo ${dados.tipo} aceita no máximo ${limite} sessão(ões).`,
        })
    }

    const chaves = new Set<string>()

    for (let i = 0; i < dados.sessoes.length; i++) {
        const sessao = dados.sessoes[i]
        const chave = `${sessao.data}|${sessao.horario}|${sessao.slot}`

        if (chaves.has(chave)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['sessoes', i],
                message: 'Sessão duplicada no payload (data, horário e slot).',
            })
        }

        chaves.add(chave)
    }
})

export const adicionarSessaoSchema = sessaoSchema

export const marcarPagamentoSchema = z.object({
    status_pagamento: z.enum(['AGUARDANDO', 'PAGO'], {
        errorMap: () => ({ message: 'O status do pagamento é obrigatório e deve ser AGUARDANDO ou PAGO.' })
    }),
})