import { z } from 'zod'

const textoCurtoSchema = z.string().trim().max(255, 'Campo muito longo (máximo de 255 caracteres).')
const textoClinicoSchema = z.string().trim().max(4000, 'Campo muito longo (máximo de 4000 caracteres).')
const textoLongoSchema = z.string().trim().max(8000, 'Campo muito longo (máximo de 8000 caracteres).')
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
    tipo: z.enum(['CLINICO', 'COMPLETO', 'REEMBOLSO']).optional(),
})

// Campos compartilhados entre todos os tipos de laudo
const baseConteudoSchema = z.object({
  quadro_clinico: textoClinicoSchema.optional(),
  achados_exame: textoClinicoSchema.optional(),
  diagnostico_funcional: textoClinicoSchema.optional(),
  conclusao: textoClinicoSchema.optional(),
  diagnostico_medico: textoClinicoSchema.optional(),
  medico_solicitante: textoCurtoSchema.optional(),
  cid: textoCurtoSchema.optional(),
  procedimentos: textoClinicoSchema.optional(),
  total_sessoes: textoCurtoSchema.optional(),
  eva_inicial: z.number().int().min(0).max(10).nullable().optional(),
  eva_atual: z.number().int().min(0).max(10).nullable().optional(),
  data_inicio: dataOpcionalSchema.optional(),
  frequencia_semanal: textoCurtoSchema.optional(),
  cpf_paciente: textoCurtoSchema.optional(),
})

const completoConteudoSchema = baseConteudoSchema.extend({
  cif_funcao: textoClinicoSchema.optional(),
  cif_estrutura: textoClinicoSchema.optional(),
  cif_atividade: textoClinicoSchema.optional(),
  cif_participacao: textoClinicoSchema.optional(),
  cif_contextual: textoClinicoSchema.optional(),
  metas_tratamento: textoLongoSchema.optional(),
  criterios_alta: textoClinicoSchema.optional(),
  prognostico: textoClinicoSchema.optional(),
  escalas_adicionais: z.array(z.object({
    nome: z.string().max(100),
    valor_inicial: z.number().nullable(),
    valor_atual: z.number().nullable(),
    data: z.string().optional(),
  })).optional(),
})

const reembolsoConteudoSchema = baseConteudoSchema.extend({
  medico_solicitante_crm: textoCurtoSchema.optional(),
  medico_solicitante_uf: z.string().length(2).optional(),
  codigo_tuss: textoCurtoSchema.optional(),
  codigos_tuss_adicionais: z.array(z.object({
    codigo: z.string().max(20),
    descricao: z.string().max(255),
    quantidade: z.number().int().min(1),
    valor_unitario: z.number().min(0),
  })).optional(),
  sessoes_autorizadas: z.number().int().min(1).optional(),
  sessoes_realizadas: z.number().int().min(0).optional(),
  periodo_tratamento_inicio: dataOpcionalSchema.optional(),
  periodo_tratamento_fim: dataOpcionalSchema.optional(),
  prognostico: textoClinicoSchema.optional(),
  justificativa_continuidade: textoLongoSchema.optional(),
  valor_total: z.number().min(0).optional(),
})

export const editarLaudoSchema = z.object({
  conteudo: z.union([baseConteudoSchema, completoConteudoSchema, reembolsoConteudoSchema]).optional(),
  tipo_assinatura: z.enum(['DIGITAL', 'MANUSCRITA']).optional(),
})