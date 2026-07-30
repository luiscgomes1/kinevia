import { z } from 'zod'

const dataSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'A data deve estar no formato YYYY-MM-DD.'
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
    message: 'O horário deve estar no formato HH:mm.'
})

export const criarAgendamentoSchema = z.object({
    paciente_id: z.string().uuid({ message: 'O ID do paciente deve ser um UUID válido.' }),
    data: dataSchema,
    horario: horarioSchema,
    slot: z.number().int().min(1).max(3, 'O slot deve ser 1, 2 ou 3.'),
    tipo: z.enum(['AVALIACAO', 'SESSAO', 'REPOSICAO']).optional(),
})

export const buscarAgendaDiaSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato deve ser YYYY-MM-DD.'),
})

export const resumoMesSchema = z.object({
  ano: z.string().regex(/^\d{4}$/, 'Ano deve ter 4 dígitos.'),
  mes: z.string().regex(/^(1[0-2]|[1-9])$/, 'Mês deve ser 1-12.'),
})

export const atualizarStatusSchema = z.object({
    status: z.enum(['AGENDADO', 'COMPARECEU', 'FALTOU', 'DESMARCOU'], {
        errorMap: () => ({ message: 'Status inválido. Use: AGENDADO, COMPARECEU, FALTOU ou DESMARCOU.' }),
    })
})