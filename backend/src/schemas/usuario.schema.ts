import { z } from 'zod'
import { emailSchema } from './auth.schema'

export const criarUsuarioSchema = z.object({
  nome: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres.').max(255),
  email: emailSchema,
  crefito: z.string().trim().max(50).optional().default(''),
  cidade: z.string().trim().max(255).optional().default(''),
  uf: z.string().trim().length(2, 'UF deve ter 2 caracteres.').optional().default('SP'),
  papel: z.enum(['SUPER_ADMIN', 'ADMIN', 'PROFISSIONAL', 'ATENDENTE']).optional(),
})

export const atualizarUsuarioSchema = z.object({
  nome: z.string().trim().min(2).max(255).optional(),
  email: emailSchema.optional(),
  crefito: z.string().trim().max(50).optional(),
  cidade: z.string().trim().max(255).optional(),
  uf: z.string().trim().length(2).optional(),
  papel: z.enum(['SUPER_ADMIN', 'ADMIN', 'PROFISSIONAL', 'ATENDENTE']).optional(),
})
