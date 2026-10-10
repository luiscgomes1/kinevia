import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function listarNotificacoes(req: Request, res: Response) {
  const notificacoes = await prisma.notificacao.findMany({
    where: { profissional_id: req.profissionalId },
    orderBy: { criado_em: 'desc' },
    take: 50,
  });

  res.json(notificacoes);
}

export async function notificacoesNaoLidas(req: Request, res: Response) {
  const total = await prisma.notificacao.count({
    where: { profissional_id: req.profissionalId, lida: false },
  });

  res.json({ total });
}

export async function marcarLida(req: Request, res: Response) {
  const { id } = req.params;

  const { count } = await prisma.notificacao.updateMany({
    where: { id, profissional_id: req.profissionalId },
    data: { lida: true },
  });

  if (count === 0) {
    return res.status(404).json({ erro: 'Notificação não encontrada.' });
  }

  res.status(204).send();
}

export async function marcarTodasLidas(req: Request, res: Response) {
  await prisma.notificacao.updateMany({
    where: { profissional_id: req.profissionalId, lida: false },
    data: { lida: true },
  });

  res.status(204).send();
}
