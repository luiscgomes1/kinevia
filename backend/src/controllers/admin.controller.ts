import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function resumo(req: Request, res: Response) {
  const [totalClinicas, totalUsuarios, totalPacientes] = await Promise.all([
    prisma.clinica.count(),
    prisma.profissional.count(),
    prisma.paciente.count({ where: { deleted_at: null } }),
  ]);

  const usuariosPorPapel = await prisma.profissional.groupBy({
    by: ['role'],
    _count: true,
  });

  res.json({
    totalClinicas,
    totalUsuarios,
    totalPacientes,
    usuariosPorPapel: usuariosPorPapel.map((u) => ({
      papel: u.role,
      quantidade: u._count,
    })),
  });
}

export async function dashboardClinica(req: Request, res: Response) {
  const clinicaId = req.clinicaId;
  if (!clinicaId) {
    return res.status(400).json({ erro: 'Profissional sem clínica vinculada.' });
  }

  const profissionais = await prisma.profissional.findMany({
    where: { clinica_id: clinicaId },
    select: { id: true },
  });
  const profissionalIds = profissionais.map((p) => p.id);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const fimMes = new Date(inicioMes);
  fimMes.setMonth(fimMes.getMonth() + 1);

  const [totalPacientes, totalProfissionais, agendamentosMes] = await Promise.all([
    prisma.paciente.count({ where: { profissional_id: { in: profissionalIds }, deleted_at: null } }),
    Promise.resolve(profissionais.length),
    prisma.agendamento.count({
      where: {
        profissional_id: { in: profissionalIds },
        data: { gte: inicioMes, lt: fimMes },
      },
    }),
  ]);

  const usuariosPorPapel = await prisma.profissional.groupBy({
    by: ['role'],
    where: { clinica_id: clinicaId },
    _count: true,
  });

  res.json({
    totalPacientes,
    totalProfissionais,
    agendamentosMes,
    usuariosPorPapel: usuariosPorPapel.map((u) => ({
      papel: u.role,
      quantidade: u._count,
    })),
  });
}

export async function listarClinicas(req: Request, res: Response) {
  const clinicas = await prisma.clinica.findMany({
    select: {
      id: true,
      nome: true,
      criado_em: true,
      _count: { select: { profissionais: true } },
    },
    orderBy: { criado_em: 'desc' },
  });

  res.json(clinicas);
}

export async function criarClinica(req: Request, res: Response) {
  const { nome } = req.body;

  const existente = await prisma.clinica.findFirst({ where: { nome } });
  if (existente) {
    return res.status(409).json({ erro: 'Já existe uma clínica com este nome.' });
  }

  const clinica = await prisma.clinica.create({ data: { nome } });
  res.status(201).json(clinica);
}

export async function atualizarClinica(req: Request, res: Response) {
  const { id } = req.params;
  const { nome } = req.body;

  const existente = await prisma.clinica.findFirst({
    where: { nome, id: { not: id } },
  });
  if (existente) {
    return res.status(409).json({ erro: 'Já existe uma clínica com este nome.' });
  }

  const clinica = await prisma.clinica.update({
    where: { id },
    data: { nome },
  });

  res.json(clinica);
}

export async function excluirClinica(req: Request, res: Response) {
  const { id } = req.params;

  const clinica = await prisma.clinica.findUnique({
    where: { id },
    include: { _count: { select: { profissionais: true } } },
  });

  if (!clinica) {
    return res.status(404).json({ erro: 'Clínica não encontrada.' });
  }

  if (clinica._count.profissionais > 0) {
    return res.status(400).json({
      erro: 'Não é possível excluir uma clínica com profissionais vinculados. Transfira ou remova os profissionais primeiro.',
    });
  }

  await prisma.clinica.delete({ where: { id } });
  res.status(204).send();
}

export async function buscarClinica(req: Request, res: Response) {
  const { id } = req.params;

  const clinica = await prisma.clinica.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      criado_em: true,
      profissionais: {
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          senha_temporaria: true,
          criado_em: true,
        },
        orderBy: { criado_em: 'asc' },
      },
    },
  });

  if (!clinica) {
    res.status(404).json({ erro: 'Clínica não encontrada.' });
    return;
  }

  res.json(clinica);
}
