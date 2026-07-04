import { z } from 'zod'

const textoCurtoSchema = z.string().trim().max(255, 'Campo muito longo (máximo de 255 caracteres).')
const textoClinicoSchema = z.string().trim().max(4000, 'Campo muito longo (máximo de 4000 caracteres).')
const dataOpcionalSchema = z.union([
  z.literal(''),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'A data deve estar no formato YYYY-MM-DD.' }).refine((valor) => {
    const [ano, mes, dia] = valor.split('-').map(Number)
    const data = new Date(Date.UTC(ano, mes - 1, dia))

    return data.getUTCFullYear() === ano
      && data.getUTCMonth() === mes - 1
      && data.getUTCDate() === dia
  }, { message: 'Data inválida.' }),
])

export const criarLaudoSchema = z.object({
    tipo_assinatura: z.enum(['DIGITAL', 'MANUSCRITA']).optional(),
})

const conteudoLaudoSchema = z.object({
  quadro_clinico: textoClinicoSchema.optional(),
  achados_exame: textoClinicoSchema.optional(),
  diagnostico_funcional: textoClinicoSchema.optional(),
  conclusao: textoClinicoSchema.optional(),
  diagnostico_medico: textoClinicoSchema.optional(),
  medico_solicitante: textoCurtoSchema.optional(),
  data_inicio: dataOpcionalSchema.optional(),
  frequencia_semanal: textoCurtoSchema.optional(),
}).partial()

export const editarLaudoSchema = z.object({
  conteudo: conteudoLaudoSchema.optional(),
  tipo_assinatura: z.enum(['DIGITAL', 'MANUSCRITA']).optional(),
})