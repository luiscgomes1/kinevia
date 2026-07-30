import { z } from 'zod'

export const senhaSchema = z
  .string()
  .min(8, { message: 'A senha deve ter pelo menos 8 caracteres.' })
  .max(128, { message: 'A senha deve ter no máximo 128 caracteres.' })
  .regex(/[A-Z]/, { message: 'A senha deve conter pelo menos uma letra maiúscula.' })
  .regex(/[a-z]/, { message: 'A senha deve conter pelo menos uma letra minúscula.' })
  .regex(/[0-9]/, { message: 'A senha deve conter pelo menos um número.' })
  .regex(/[^a-zA-Z0-9]/, { message: 'A senha deve conter pelo menos um caractere especial.' })

export const emailSchema = z.string().email({ message: 'Email inválido.' }).max(255).trim()

export const loginSchema = z.object({
    email: emailSchema,
    senha: z.string().min(1, { message: 'Senha é obrigatória.' }).max(128),
})

export const refreshSchema = z.object({})

export const registerSchema = z.object({
    nome: z.string().trim().min(2, { message: 'Nome deve ter pelo menos 2 caracteres.' }).max(255),
    email: emailSchema,
    senha: senhaSchema,
    crefito: z.string().trim().min(3, { message: 'CREFITO inválido.' }).max(50),
    cidade: z.string().trim().min(2, { message: 'Cidade inválida.' }).max(255),
    uf: z.string().trim().length(2, { message: 'UF deve ter 2 caracteres.' }),
})