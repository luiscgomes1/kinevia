import { Request, Response } from "express";
import { Prisma } from "../../generated/client";
import prisma from "../lib/prisma";
import {
  criarPacoteComSessoes,
  adicionarSessaoAoPacote,
} from "../services/pacote.service";
import { registrarAudit } from "../lib/audit";

type WherePaciente = Prisma.PacienteWhereInput;
type WherePacote = Prisma.PacoteWhereInput;

function clinicaIdSeguro(req: Request): string | null {
  if (req.role === 'SUPER_ADMIN') return null;
  return req.clinicaId || '__sem_clinica__';
}

function wherePacienteEscopado(req: Request, paciente_id: string): WherePaciente {
  const clinicaId = clinicaIdSeguro(req);
  if (req.role === 'SUPER_ADMIN') return { id: paciente_id, deleted_at: null };
  if (req.role === 'ADMIN' || req.role === 'ATENDENTE') {
    return { id: paciente_id, deleted_at: null, clinica_id: clinicaId! };
  }
  return { id: paciente_id, deleted_at: null, profissional_id: req.profissionalId! };
}

function wherePacoteEscopado(req: Request, id: string): WherePacote {
  const clinicaId = clinicaIdSeguro(req);
  if (req.role === 'SUPER_ADMIN') return { id };
  if (req.role === 'ADMIN' || req.role === 'ATENDENTE') {
    return { id, clinica_id: clinicaId! };
  }
  return { id, profissional_id: req.profissionalId! };
}

function profissionalDonoPaciente(req: Request, paciente: { profissional_id: string }): string {
  return req.role === 'PROFISSIONAL' ? req.profissionalId! : paciente.profissional_id;
}

export async function criarPacote(req: Request, res: Response) {
  const { id: paciente_id } = req.params;
  const { tipo, valor_cobrado, status_pagamento, sessoes } = req.body;

  const paciente = await prisma.paciente.findFirst({ where: wherePacienteEscopado(req, paciente_id) });

  if (!paciente) {
    return res.status(404).json({ erro: "Paciente não encontrado." });
  }

  const profissionalId = profissionalDonoPaciente(req, paciente);

  let valorFinal = valor_cobrado;
  if (valorFinal === undefined) {
    const profissional = await prisma.profissional.findUnique({
      where: { id: profissionalId },
      select: { preco_sessao_individual: true, preco_pacote_5: true, preco_pacote_10: true },
    });

    const precoPorTipo: Record<string, number> = {
      INDIVIDUAL: Number(profissional?.preco_sessao_individual ?? 0),
      PACOTE_5: Number(profissional?.preco_pacote_5 ?? 0),
      PACOTE_10: Number(profissional?.preco_pacote_10 ?? 0),
    };

    valorFinal = precoPorTipo[tipo] ?? 0;
  }

  try {
    const resultado = await criarPacoteComSessoes({
      paciente_id,
      profissional_id: profissionalId,
      clinica_id: paciente.clinica_id,
      tipo,
      valor_cobrado: valorFinal,
      status_pagamento,
      sessoes: sessoes || [],
    });

    registrarAudit(req.profissionalId!, 'PACOTE_CRIADO', paciente_id, {
      tipo,
      valor_cobrado: Number(valorFinal) || 0,
    });

    return res.status(201).json(resultado);
  } catch (erro: unknown) {
    const mensagem = erro instanceof Error ? erro.message : 'Erro ao criar pacote.';
    return res.status(400).json({ erro: mensagem });
  }
}

export async function listarPacotes(req: Request, res: Response) {
  const { id: paciente_id } = req.params;

  const paciente = await prisma.paciente.findFirst({ where: wherePacienteEscopado(req, paciente_id) });

  if (!paciente) {
    return res.status(404).json({ erro: "Paciente não encontrado." });
  }

  const profissionalId = profissionalDonoPaciente(req, paciente);

  const pacotes = await prisma.pacote.findMany({
    where: { paciente_id, profissional_id: profissionalId },
    include: {
      sessoes: {
        include: {
          agendamento: {
            select: {
              id: true,
              data: true,
              horario: true,
              slot: true,
              status: true,
              tipo: true,
            },
          },
        },
      },
    },
    orderBy: { criado_em: "desc" },
  });

  const pacotesComContador = pacotes.map((pacote) => {
    const sessoesRealizadas = pacote.sessoes.filter(
      (s) => s.agendamento.status === "COMPARECEU",
    ).length;

    return {
      ...pacote,
      sessoes_realizadas: sessoesRealizadas,
      sessoes_agendadas: pacote.sessoes.length,
      sessoes_limite: pacote.quantidade_sessoes,
    };
  });

  return res.json(pacotesComContador);
}

export async function adicionarSessao(req: Request, res: Response) {
  const { id: pacote_id } = req.params;
  const { data, horario, slot, tipo } = req.body;

  const pacote = await prisma.pacote.findFirst({ where: wherePacoteEscopado(req, pacote_id) });

  if (!pacote) {
    return res.status(404).json({ erro: "Pacote não encontrado." });
  }

  try {
    const resultado = await adicionarSessaoAoPacote({
      pacote_id,
      profissional_id: pacote.profissional_id,
      paciente_id: pacote.paciente_id,
      clinica_id: pacote.clinica_id,
      sessao: { data, horario, slot, tipo },
    });

    registrarAudit(req.profissionalId!, 'SESSAO_AGENDADA', pacote.paciente_id, {
      data,
      horario,
    });

    return res.status(201).json(resultado);
  } catch (erro: unknown) {
    const mensagem = erro instanceof Error ? erro.message : 'Erro ao adicionar sessão.';
    return res.status(400).json({ erro: mensagem });
  }
}

export async function marcarPagamento(req: Request, res: Response) {
  const { id } = req.params;
  const { status_pagamento } = req.body;

  const pacote = await prisma.pacote.findFirst({ where: wherePacoteEscopado(req, id) });

  if (!pacote) {
    return res.status(404).json({ erro: "Pacote não encontrado." });
  }

  await prisma.pacote.update({
    where: { id },
    data: {
      status_pagamento,
      pago_em: status_pagamento === "PAGO" ? new Date() : null,
    },
  });

  registrarAudit(req.profissionalId!, 'PACOTE_PAGAMENTO_ALTERADO', pacote.paciente_id, {
    status_pagamento,
  });

  const pacoteAtualizado = await prisma.pacote.findUnique({ where: { id } });

  return res.json(pacoteAtualizado);
}

export async function deletarPacote(req: Request, res: Response) {
  const { id } = req.params;

  const pacote = await prisma.pacote.findFirst({ where: wherePacoteEscopado(req, id) });

  if (!pacote) {
    return res.status(404).json({ erro: "Pacote não encontrado." });
  }

  await prisma.pacote.delete({ where: { id } });

  return res.status(204).send();
}