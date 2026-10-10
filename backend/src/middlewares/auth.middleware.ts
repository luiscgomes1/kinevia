import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { JWT_ISSUER, JWT_AUDIENCE } from '../lib/jwt';
import type { Role } from '../../generated/client';

declare global {
    namespace Express {
        interface Request {
            profissionalId?: string;
            role?: Role;
            clinicaId?: string;
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
        const payload = jwt.verify(token, process.env.JWT_SECRET!, { issuer: JWT_ISSUER, audience: JWT_AUDIENCE }) as TokenPayload;

        const profissional = await prisma.profissional.findUnique({
            where: { id: payload.id },
            select: {
                token_version: true,
                role: true,
                clinica_id: true,
                senha_temporaria: true,
            },
        });

        if (!profissional) {
            res.status(401).json({ erro: 'Profissional não encontrado.' });
            return;
        }

        if (payload.token_version !== profissional.token_version) {
            res.status(401).json({ erro: 'Token revogado. Faça login novamente.' });
            return;
        }

        if (profissional.senha_temporaria) {
            const trocarSenhaPath = '/v1/auth/trocar-senha';
            if (req.path !== trocarSenhaPath && !req.originalUrl?.includes(trocarSenhaPath)) {
                res.status(403).json({
                    erro: 'Senha temporária. Você precisa trocar sua senha antes de acessar o sistema.',
                    precisaTrocarSenha: true,
                });
                return;
            }
        }

        req.profissionalId = payload.id;
        req.role = profissional.role;
        req.clinicaId = profissional.clinica_id ?? undefined;
        next();
    } catch {
        res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }
}

export function authorize(...roles: Role[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.role) {
            res.status(403).json({ erro: 'Acesso negado.' });
            return;
        }

        if (!roles.includes(req.role)) {
            res.status(403).json({ erro: 'Permissão insuficiente.' });
            return;
        }

        next();
    };
}