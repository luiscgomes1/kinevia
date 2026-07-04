import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string().email({ message: 'Email inválido.' }),
    senha: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
})

export const refreshSchema = z.object({
    refreshToken: z.string().min(1, { message: 'O token de atualização é obrigatório.' }),
})