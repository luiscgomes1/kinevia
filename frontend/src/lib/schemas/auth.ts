import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido.'),
  senha: z.string().min(1, 'Senha é obrigatória.'),
})

export type LoginForm = z.infer<typeof loginSchema>

export const esqueciSenhaSchema = z.object({
  email: z.string().email('Email inválido.'),
})

export type EsqueciSenhaForm = z.infer<typeof esqueciSenhaSchema>
