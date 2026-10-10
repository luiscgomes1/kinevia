export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'PROFISSIONAL' | 'ATENDENTE'

export interface Profissional {
  id: string
  nome: string
  email: string
  role: Role
  clinica_id?: string | null
  crefito: string
  cidade: string
  uf: string
  horario_inicio: string
  horario_fim: string
  preco_sessao_individual: number
  preco_pacote_5: number
  preco_pacote_10: number
  assinatura_url?: string
}

export interface Paciente {
  id: string
  nome: string
  cpf: string
  data_nascimento: string
  endereco: string
  estado_civil: string
  nacionalidade: string
  telefone?: string
  email?: string
  observacoes?: string
  ativo: boolean
}

export type StatusAgendamento = 'AGENDADO' | 'COMPARECEU' | 'FALTOU' | 'DESMARCOU'
export type TipoSessao = 'AVALIACAO' | 'SESSAO' | 'REPOSICAO'
export type TipoPacote = 'INDIVIDUAL' | 'PACOTE_5' | 'PACOTE_10'
export type StatusPagamento = 'AGUARDANDO' | 'PAGO'
export type TipoAssinatura = 'DIGITAL' | 'MANUSCRITA'

export interface PacienteResumo {
  id: string
  nome: string
}

export interface Agendamento {
  id: string
  paciente: PacienteResumo
  status: StatusAgendamento
  tipo: TipoSessao
}

export interface SlotGrade {
  slot: number
  agendamento: Agendamento | null
}

export interface Horario {
  horario: string
  slots: SlotGrade[]
}

export interface GradeAgenda {
  data: string
  horarios: Horario[]
}

export interface PacoteResumo {
  id: string
  tipo: TipoPacote
  valor_cobrado: number
  status_pagamento: StatusPagamento
  sessoes_agendadas: number
  sessoes_limite: number
  quantidade_sessoes: number
}

export interface Precos {
  preco_sessao_individual: number
  preco_pacote_5: number
  preco_pacote_10: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  profissional: Profissional
}

export interface ConteudoLaudo {
  quadro_clinico: string
  achados_exame: string
  diagnostico_funcional: string
  conclusao: string
  diagnostico_medico: string
  medico_solicitante: string
  data_inicio: string
  frequencia_semanal: string
}

export interface LaudoResumo {
  id: string
  tipo_assinatura: TipoAssinatura
  pdf_url: string | null
  criado_em: string
}
