import { z } from 'zod'

const horarioSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário deve estar no formato HH:mm.')

const horarioParaMinutos = (valor: string) => {
  const [hora, minuto] = valor.split(':').map(Number)
  return hora * 60 + minuto
}

export const profissionalSchema = z
  .object({
    nome: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
    crefito: z.string().trim().min(3, 'CREFITO inválido.'),
    cidade: z.string().trim().min(2, 'Cidade inválida.'),
    uf: z.string().length(2, 'UF deve ter 2 caracteres.').toUpperCase(),
    horario_inicio: horarioSchema,
    horario_fim: horarioSchema,
    preco_sessao_individual: z.number().min(0, 'Preço não pode ser negativo.'),
    preco_pacote_5: z.number().min(0, 'Preço não pode ser negativo.'),
    preco_pacote_10: z.number().min(0, 'Preço não pode ser negativo.'),
  })
  .refine((dados) => horarioParaMinutos(dados.horario_inicio) < horarioParaMinutos(dados.horario_fim), {
    message: 'O horário de início deve ser menor que o horário de fim.',
    path: ['horario_inicio'],
  })

export type ProfissionalForm = z.infer<typeof profissionalSchema>
