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

export const trocarSenhaSchema = z.object({
    novaSenha: senhaSchema,
})