import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

declare global {
    namespace Express {
        interface Request {
            profissionalId?: string;
        }
    }
}

interface TokenPayload {
    id: string;
    token_version: number;
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ erro: 'Token não fornecido.' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

        const profissional = await prisma.profissional.findUnique({
            where: { id: payload.id },
            select: { token_version: true },
        });

        if (!profissional) {
            res.status(401).json({ erro: 'Profissional não encontrado.' });
            return;
        }

        if (payload.token_version !== profissional.token_version) {
            res.status(401).json({ erro: 'Token revogado. Faça login novamente.' });
            return;
        }

        req.profissionalId = payload.id;
        next();
    } catch {
        res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }
}