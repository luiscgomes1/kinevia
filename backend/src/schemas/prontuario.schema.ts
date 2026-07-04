import { z } from "zod"

const textoCurtoSchema = z.string().trim().max(255, 'Campo muito longo (máximo de 255 caracteres).')
const textoClinicoSchema = z.string().trim().max(4000, 'Campo muito longo (máximo de 4000 caracteres).')
const sinalVitalSchema = z.string().trim().max(20, 'Campo muito longo (máximo de 20 caracteres).')

export const salvarProntuarioSchema = z.object({
  medico_solicitante: textoCurtoSchema.optional(),
  diagnostico_medico: textoCurtoSchema.optional(),
  hda: textoClinicoSchema.optional(),
  hpp_has: z.boolean().optional(),
  hpp_dm: z.boolean().optional(),
  hpp_ca: z.boolean().optional(),
  hpp_cardiopatia: z.boolean().optional(),
  medicacoes: textoClinicoSchema.optional(),
  habitos_vida: textoClinicoSchema.optional(),
  exames_medicos: textoClinicoSchema.optional(),
  avaliacao_fisica: textoClinicoSchema.optional(),
  diagnostico_fisio: textoClinicoSchema.optional(),
  pa: sinalVitalSchema.optional(),
  fr: sinalVitalSchema.optional(),
  fc: sinalVitalSchema.optional(),
  ap: sinalVitalSchema.optional(),
})

export const adicionarEvolucaoSchema = z.object({
    texto: z.string().trim().min(1, 'O texto da evolução é obrigatório e não pode estar vazio.').max(4000, 'O texto da evolução deve ter no máximo 4000 caracteres.'),
})

export const adicionarCorrecaoSchema = z.object({
    correcao_texto: z.string().trim().min(1, 'O texto da correção é obrigatório e não pode estar vazio.').max(4000, 'O texto da correção deve ter no máximo 4000 caracteres.'),
})
