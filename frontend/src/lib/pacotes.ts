import api from '@/services/api'
import type { TipoPacote, StatusPagamento, Precos, PacoteResumo } from '@/types/api'

export const LIMITE_SESSOES_POR_TIPO: Record<TipoPacote, number> = {
  INDIVIDUAL: 1,
  PACOTE_5: 5,
  PACOTE_10: 10,
}

export function labelTipoPacote(tipo: TipoPacote): string {
  const map: Record<TipoPacote, string> = {
    INDIVIDUAL: 'Individual',
    PACOTE_5: 'Pacote 5',
    PACOTE_10: 'Pacote 10',
  }
  return map[tipo]
}

/** Preço padrão configurado pelo profissional para um tipo de pacote (string vazia se não configurado/zero). */
export function precoPadraoParaTipo(tipo: TipoPacote, precos: Precos | null): string {
  if (!precos) return ''
  const map: Record<TipoPacote, number> = {
    INDIVIDUAL: precos.preco_sessao_individual,
    PACOTE_5: precos.preco_pacote_5,
    PACOTE_10: precos.preco_pacote_10,
  }
  return map[tipo] > 0 ? String(map[tipo]) : ''
}

/**
 * Busca os pacotes de um paciente que ainda têm vaga (sessoes_agendadas < sessoes_limite).
 * Antes duplicado em handleSelecionarPaciente e handleAbrirMarcarSessao (Agenda/index.tsx).
 */
export async function buscarPacotesDisponiveis(pacienteId: string): Promise<PacoteResumo[]> {
  const response = await api.get(`/pacientes/${pacienteId}/pacotes`)
  const todos: PacoteResumo[] = response.data
  return todos.filter((p) => p.sessoes_agendadas < p.sessoes_limite)
}
