import { Request } from 'express'
import { Prisma } from '../../generated/client'
import prisma from './prisma'

function escopoPorProfissionalOuClinica(req: Request): {
  profissional_id?: string
  clinica_id?: string
} {
  if (req.role === 'SUPER_ADMIN') return {}
  if (req.role === 'ADMIN' || req.role === 'ATENDENTE') {
    return req.clinicaId ? { clinica_id: req.clinicaId } : { clinica_id: '__sem_clinica__' }
  }
  return { profissional_id: req.profissionalId! }
}

export function exigirClinicaDoEscopo(req: Request): boolean {
  if (req.role === 'SUPER_ADMIN') return true
  if (req.role === 'ADMIN' || req.role === 'ATENDENTE') {
    return Boolean(req.clinicaId)
  }
  return true
}

export function wherePaciente(req: Request): Prisma.PacienteWhereInput {
  return escopoPorProfissionalOuClinica(req)
}

export function wherePacote(req: Request): Prisma.PacoteWhereInput {
  return escopoPorProfissionalOuClinica(req)
}

export function whereLaudo(req: Request): Prisma.LaudoWhereInput {
  return escopoPorProfissionalOuClinica(req)
}

export function whereAgendamento(req: Request): Prisma.AgendamentoWhereInput {
  return escopoPorProfissionalOuClinica(req)
}

export function whereProfissional(req: Request): Prisma.ProfissionalWhereInput {
  if (req.role === 'SUPER_ADMIN') return {}
  if (req.role === 'ADMIN' || req.role === 'ATENDENTE') {
    return req.clinicaId ? { clinica_id: req.clinicaId } : { clinica_id: '__sem_clinica__' }
  }
  return { id: req.profissionalId! }
}

/**
 * Valida o profissional alvo de um filtro opcional (?profissional_id=).
 * - SUPER_ADMIN: aceita qualquer id.
 * - ADMIN/ATENDENTE: aceita apenas membros da própria clínica (senão null).
 * - PROFISSIONAL: ignora o filtro e retorna o próprio id.
 * Retorna undefined quando não há filtro.
 */
export async function resolverProfissionalAlvo(
  req: Request,
  profissionalFiltro?: string,
): Promise<string | null | undefined> {
  if (!profissionalFiltro) return undefined
  if (req.role === 'SUPER_ADMIN') return profissionalFiltro
  if (req.role === 'ADMIN' || req.role === 'ATENDENTE') {
    if (!req.clinicaId) return null
    const alvo = await prisma.profissional.findUnique({
      where: { id: profissionalFiltro },
      select: { clinica_id: true },
    })
    if (!alvo || alvo.clinica_id !== req.clinicaId) return null
    return profissionalFiltro
  }
  return req.profissionalId!
}
