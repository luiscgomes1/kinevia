import { describe, it, expect, vi } from 'vitest';
import { Prisma } from '../../../generated/client';
import type { Request, Response } from 'express';
import erroMiddleware from '../error.middleware';

function criarResposta() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    type: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('erroMiddleware', () => {
  it('mapeia P2002 (unique) para 409', () => {
    const res = criarResposta();
    const err = new Prisma.PrismaClientKnownRequestError('dup', {
      code: 'P2002',
      clientVersion: '5',
      meta: { target: ['email'] },
    });
    erroMiddleware(err, {} as Request, res, () => {});
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Já existe um email com esse valor.' });
  });

  it('mapeia P2025 (não encontrado) para 404', () => {
    const res = criarResposta();
    const err = new Prisma.PrismaClientKnownRequestError('nf', {
      code: 'P2025',
      clientVersion: '5',
    });
    erroMiddleware(err, {} as Request, res, () => {});
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Registro não encontrado.' });
  });

  it('retorna 400 para outros erros conhecidos do Prisma', () => {
    const res = criarResposta();
    const err = new Prisma.PrismaClientKnownRequestError('fk', {
      code: 'P2003',
      clientVersion: '5',
    });
    erroMiddleware(err, {} as Request, res, () => {});
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('retorna 500 para erros genéricos', () => {
    const res = criarResposta();
    erroMiddleware(new Error('boom'), {} as Request, res, () => {});
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro interno do servidor' });
  });
});
