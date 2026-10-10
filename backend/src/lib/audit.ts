import prisma from './prisma'

const ACOES_AUDIT = [
  'PRONTUARIO_VISUALIZADO',
  'PRONTUARIO_ATUALIZADO',
  'EVOLUCAO_VISUALIZADA',
  'EVOLUCAO_CRIADA',
  'EVOLUCAO_CORRIGIDA',
  'LAUDO_VISUALIZADO',
  'LAUDO_PDF_GERADO',
  'LAUDO_CRIADO',
  'LAUDO_EDITADO',
  'LAUDO_EXCLUIDO',
  'PACOTE_CRIADO',
  'PACOTE_PAGAMENTO_ALTERADO',
  'SESSAO_AGENDADA',
  'AGENDAMENTO_STATUS_ALTERADO',
  'PACIENTE_EXPORTADO',
  'PACIENTE_ANONIMIZADO',
  'PACIENTE_TRANSFERIDO',
  'PACIENTE_REMOVIDO',
  'PACIENTE_REATIVADO',
] as const

type AcaoAudit = typeof ACOES_AUDIT[number]

export async function registrarAudit(
  profissionalId: string,
  acao: AcaoAudit,
  pacienteId?: string,
  metadata?: Record<string, unknown>,
) {
  await prisma.auditLog.create({
    data: {
      profissional_id: profissionalId,
      paciente_id: pacienteId,
      acao,
      metadata: (metadata ?? undefined) as any,
    },
  })
}
