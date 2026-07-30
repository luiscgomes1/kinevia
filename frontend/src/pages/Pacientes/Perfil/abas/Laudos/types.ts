export interface Laudo {
    id: string
    tipo: 'CLINICO' | 'COMPLETO' | 'REEMBOLSO'
    tipo_assinatura: 'DIGITAL' | 'MANUSCRITA'
    pdf_url: string | null
    criado_em: string
}

export interface ConteudoBase {
    quadro_clinico: string
    achados_exame: string
    diagnostico_funcional: string
    conclusao: string
    diagnostico_medico: string
    medico_solicitante: string
    cid: string
    procedimentos: string
    total_sessoes: string
    eva_inicial: number | null
    eva_atual: number | null
    data_inicio: string
    frequencia_semanal: string
}

export interface ConteudoCompleto extends ConteudoBase {
    cif_funcao: string
    cif_estrutura: string
    cif_atividade: string
    cif_participacao: string
    cif_contextual: string
    metas_tratamento: string
    criterios_alta: string
    prognostico: string
    escalas_adicionais: { nome: string; resultado: string }[]
}

export interface ConteudoReembolso extends ConteudoBase {
    medico_solicitante_crm: string
    medico_solicitante_uf: string
    codigo_tuss: string
    codigos_tuss_adicionais: { codigo: string; descricao: string }[]
    sessoes_autorizadas: number | null
    sessoes_realizadas: number | null
    periodo_tratamento_inicio: string
    periodo_tratamento_fim: string
    prognostico: string
    justificativa_continuidade: string
    valor_total: number | null
}

export type ConteudoLaudo = ConteudoBase | ConteudoCompleto | ConteudoReembolso

export const TIPO_ROTULO: Record<string, string> = {
    CLINICO: 'Clínico',
    COMPLETO: 'Completo (perícia)',
    REEMBOLSO: 'Reembolso',
}

export const TIPO_COR: Record<string, string> = {
    CLINICO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    COMPLETO: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    REEMBOLSO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
}
