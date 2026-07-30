import { z } from 'zod'
import { senhaSchema, emailSchema } from './auth.schema'

export const esqueciSenhaSchema = z.object({
  email: emailSchema,
})

export const redefinirSenhaSchema = z.object({
  email: emailSchema,
  token: z.string().min(1, { message: 'Token é obrigatório.' }).max(256),
  novaSenha: senhaSchema,
})
