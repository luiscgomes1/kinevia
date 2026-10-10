import { Request, Response, NextFunction } from 'express';
import { Prisma } from '../../generated/client';
import logger from '../lib/logger';

export function erroMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const campo = Array.isArray(err.meta?.target) ? err.meta?.target.join(', ') : 'registro'
      return res.status(409).json({ erro: `Já existe um ${campo} com esse valor.` })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ erro: 'Registro não encontrado.' })
    }
    logger.error({ err }, 'Erro conhecido do Prisma')
    return res.status(400).json({ erro: 'Solicitação inválida.' })
  }

  logger.error({ err }, 'Erro não tratado')
  return res.status(500).type('json').json({ erro: 'Erro interno do servidor' })
}

export default erroMiddleware
