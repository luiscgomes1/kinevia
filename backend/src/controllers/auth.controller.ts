import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

import { JWT_ISSUER, JWT_AUDIENCE } from '../lib/jwt';

const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

function parseCookieMaxAge(value: string): number {
  const match = value.match(/^(\d+)\s*(s|m|h|d)$/)
  if (!match) return 30 * 24 * 60 * 60 * 1000
  const num = parseInt(match[1])
  const unit = match[2]
  const multipliers: Record<string, number> = {
    s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000,
  }
  return num * (multipliers[unit] || multipliers.d)
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // Produção com front e API em domínios distintos (ex.: Vercel) exige
  // SameSite=None + Secure para o navegador reenviar o cookie no refresh.
  sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('strict' as const),
  path: '/v1/auth',
  maxAge: parseCookieMaxAge(REFRESH_TOKEN_EXPIRY),
};

function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, COOKIE_OPTIONS);
}

function clearRefreshCookie(res: Response) {
  res.clearCookie('refreshToken', { path: '/v1/auth' });
}

function toJwtExpiry(value: string): jwt.SignOptions['expiresIn'] {
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  return value as jwt.SignOptions['expiresIn'];
}

function generateTokens(profissionalId: string, tokenVersion: number, senhaTemporaria?: boolean) {
    const accessSecret = process.env.JWT_SECRET!;
    const refreshSecret = process.env.JWT_REFRESH_SECRET!;

    const accessToken = jwt.sign(
        { id: profissionalId, token_version: tokenVersion, senha_temporaria: senhaTemporaria ?? false },
        accessSecret,
        { expiresIn: toJwtExpiry(ACCESS_TOKEN_EXPIRY), issuer: JWT_ISSUER, audience: JWT_AUDIENCE }
    );

    const refreshToken = jwt.sign(
        { id: profissionalId, token_version: tokenVersion },
        refreshSecret,
        { expiresIn: toJwtExpiry(REFRESH_TOKEN_EXPIRY), issuer: JWT_ISSUER, audience: JWT_AUDIENCE }
    );

    return { accessToken, refreshToken };
}

export async function login(req: Request, res: Response) {
    const { email, senha } = req.body;

    const profissional = await prisma.profissional.findUnique({
        where: { email }
    });

    if (!profissional) {
        await bcrypt.compare(senha, '$2a$10$0000000000000000000000');
        res.status(401).json({ erro: 'Credenciais inválidas.' });
        return;
    }

    const correctPassword = await bcrypt.compare(senha, profissional.senha_hash);

    if (!correctPassword) {
        res.status(401).json({ erro: 'Credenciais inválidas.' });
        return;
    }

    const tokens = generateTokens(profissional.id, profissional.token_version, profissional.senha_temporaria);

    setRefreshCookie(res, tokens.refreshToken);

    res.json({
        accessToken: tokens.accessToken,
        profissional: {
            id: profissional.id,
            nome: profissional.nome,
            email: profissional.email,
        },
        senha_temporaria: profissional.senha_temporaria,
    });
}

export async function refreshToken(req: Request, res: Response) {
    const token = req.cookies?.refreshToken;

    if (!token) {
        res.status(401).json({ erro: 'Refresh token não fornecido.' });
        return;
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET
    if (!refreshSecret) {
        res.status(500).json({ erro: 'Erro interno de configuração.' });
        return;
    }

    try {
        const payload = jwt.verify(token, refreshSecret, { issuer: JWT_ISSUER, audience: JWT_AUDIENCE }) as { id: string; token_version: number };

        const profissional = await prisma.profissional.findUnique({
            where: { id: payload.id },
            select: { token_version: true, senha_temporaria: true }
        });

        if (!profissional) {
            clearRefreshCookie(res);
            res.status(401).json({ erro: 'Profissional não encontrado.' });
            return;
        }

        if (payload.token_version !== profissional.token_version) {
            clearRefreshCookie(res);
            res.status(401).json({ erro: 'Refresh token revogado. Faça login novamente.' });
            return;
        }

        // Rotaciona token_version: invalida o token antigo e impede reuse
        const { token_version: novaVersao, senha_temporaria } = await prisma.profissional.update({
            where: { id: payload.id },
            data: { token_version: { increment: 1 } },
            select: { token_version: true, senha_temporaria: true },
        })

        const tokens = generateTokens(payload.id, novaVersao, senha_temporaria);

        setRefreshCookie(res, tokens.refreshToken);

        res.json({
            accessToken: tokens.accessToken,
        });
    } catch {
        clearRefreshCookie(res);
        res.status(401).json({ erro: 'Refresh token inválido ou expirado.' });
    }
}

export async function trocarSenha(req: Request, res: Response) {
    const { novaSenha } = req.body;

    const profissional = await prisma.profissional.findUnique({
        where: { id: req.profissionalId },
    });

    if (!profissional) {
        res.status(404).json({ erro: 'Profissional não encontrado.' });
        return;
    }

    if (!profissional.senha_temporaria) {
        res.status(400).json({ erro: 'Senha temporária não está ativa.' });
        return;
    }

    const senha_hash = await bcrypt.hash(novaSenha, 10);

    const atualizado = await prisma.profissional.update({
        where: { id: req.profissionalId },
        data: {
            senha_hash,
            senha_temporaria: false,
            token_version: { increment: 1 },
        },
    });

    const tokens = generateTokens(atualizado.id, atualizado.token_version, false);

    setRefreshCookie(res, tokens.refreshToken);

    res.json({
        mensagem: 'Senha alterada com sucesso.',
        accessToken: tokens.accessToken,
    });
}

export async function logout(req: Request, res: Response) {
    await prisma.profissional.update({
        where: { id: req.profissionalId },
        data: { token_version: { increment: 1 } },
    });

    clearRefreshCookie(res);

    res.json({ mensagem: 'Logout realizado com sucesso.' });
}
