import { z } from 'zod'

const apenasNumeros = (v: string) => v.replace(/\D/g, '')

function validarCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf)) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false
  for (let t = 9; t < 11; t++) {
    let soma = 0
    for (let c = 0; c < t; c++) soma += Number(cpf[c]) * (t + 1 - c)
    const digito = ((10 * soma) % 11) % 10
    if (Number(cpf[t]) !== digito) return false
  }
  return true
}

const cpfSchema = z
  .string()
  .transform(apenasNumeros)
  .refine((v) => /^\d{11}$/.test(v), { message: 'CPF deve ter 11 dígitos.' })
  .refine((v) => !/^(\d)\1{10}$/.test(v), { message: 'CPF inválido.' })
  .refine((v) => validarCpf(v), { message: 'CPF inválido.' })

const telefoneSchema = z
  .string()
  .transform(apenasNumeros)
  .refine((v) => v.length === 0 || v.length === 10 || v.length === 11, {
    message: 'Telefone inválido. Informe DDD + número (10 ou 11 dígitos).',
  })

const dataNascimentoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')
  .refine((valor) => {
    const [ano, mes, dia] = valor.split('-').map(Number)
    const data = new Date(Date.UTC(ano, mes - 1, dia))

    return (
      data.getUTCFullYear() === ano &&
      data.getUTCMonth() === mes - 1 &&
      data.getUTCDate() === dia
    )
  }, { message: 'Data inválida.' })

export const criarPacienteSchema = z.object({
  nome: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  cpf: cpfSchema,
  data_nascimento: dataNascimentoSchema,
  rua: z.string().trim().min(3, 'Rua deve ter pelo menos 3 caracteres.'),
  numero: z.string().optional(),
  bairro: z.string().trim().min(2, 'Bairro deve ter pelo menos 2 caracteres.'),
  cidade: z.string().trim().min(2, 'Cidade deve ter pelo menos 2 caracteres.'),
  estado_civil: z.enum(['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'], {
    message: 'Selecione um estado civil.',
  }),
  nacionalidade: z.string().trim().min(2, 'Nacionalidade deve ter pelo menos 2 caracteres.'),
  telefone: telefoneSchema.optional().or(z.literal('')),
  email: z.string().email('Email inválido.').optional().or(z.literal('')),
  observacoes: z.string().optional(),
})

export type CriarPacienteForm = z.infer<typeof criarPacienteSchema>

export const atualizarPacienteSchema = z.object({
  nome: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  estado_civil: z.enum(['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'], {
    message: 'Selecione um estado civil.',
  }),
  nacionalidade: z.string().trim().min(2, 'Nacionalidade deve ter pelo menos 2 caracteres.'),
  telefone: telefoneSchema.optional().or(z.literal('')),
  email: z.string().email('Email inválido.').optional().or(z.literal('')),
  observacoes: z.string().optional(),
})

export type AtualizarPacienteForm = z.infer<typeof atualizarPacienteSchema>

export const enderecoSchema = z.object({
  rua: z.string().trim().min(3, 'Rua deve ter pelo menos 3 caracteres.'),
  numero: z.string().optional(),
  bairro: z.string().trim().min(2, 'Bairro deve ter pelo menos 2 caracteres.'),
  cidade: z.string().trim().min(2, 'Cidade deve ter pelo menos 2 caracteres.'),
})

export type EnderecoForm = z.infer<typeof enderecoSchema>
