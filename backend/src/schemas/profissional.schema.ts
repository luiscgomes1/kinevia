import { z } from 'zod'

const horarioSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'O horário deve estar no formato HH:mm.'
})

const horarioParaMinutos = (valor: string) => {
    const [hora, minuto] = valor.split(':').map(Number)
    return hora * 60 + minuto
}

export const atualizarPerfilSchema = z.object({
    nome: z.string().trim().min(2, { message: 'O nome é obrigatório e deve ter pelo menos 2 caracteres.' }),
    crefito: z.string().trim().min(3, { message: 'O CREFITO é obrigatório e deve ter pelo menos 3 caracteres.' }),
    cidade: z.string().trim().min(2, { message: 'A cidade é obrigatória e deve ter pelo menos 2 caracteres.' }),
    uf: z.string().trim().length(2, { message: 'O estado (UF) é obrigatório e deve ter exatamente 2 caracteres.' }),
    horario_inicio: horarioSchema,
    horario_fim: horarioSchema,
    preco_sessao_individual: z.number().nonnegative({ message: 'O preço da sessão individual deve ser um número e não pode ser negativo.' }),
    preco_pacote_5: z.number().nonnegative({ message: 'O preço do pacote com 5 sessões deve ser um número e não pode ser negativo.' }),
    preco_pacote_10: z.number().nonnegative({ message: 'O preço do pacote com 10 sessões deve ser um número e não pode ser negativo.' }),
}).refine((dados) => horarioParaMinutos(dados.horario_inicio) < horarioParaMinutos(dados.horario_fim), {
    message: 'O horário de início deve ser menor que o horário de fim.',
    path: ['horario_inicio'],
})

export const trocarSenhaSchema = z.object({
    senhaAtual: z.string().min(1, { message: 'A senha atual é obrigatória.' }),
    novaSenha: z.string().min(6, { message: 'A nova senha deve ter pelo menos 6 caracteres.' }),
})