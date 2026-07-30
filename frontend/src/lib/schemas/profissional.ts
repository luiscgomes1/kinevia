import { z } from 'zod'

export const profissionalSchema = z.object({
  nome: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  crefito: z.string().trim().min(3, 'CREFITO inválido.'),
  cidade: z.string().trim().min(2, 'Cidade inválida.'),
  uf: z.string().length(2, 'UF deve ter 2 caracteres.').toUpperCase(),
  horario_inicio: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.'),
  horario_fim: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.'),
  preco_sessao_individual: z.number().min(0, 'Preço não pode ser negativo.'),
  preco_pacote_5: z.number().min(0, 'Preço não pode ser negativo.'),
  preco_pacote_10: z.number().min(0, 'Preço não pode ser negativo.'),
})

export type ProfissionalForm = z.infer<typeof profissionalSchema>
