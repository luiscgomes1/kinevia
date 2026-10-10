import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { sendEmail, isEmailConfigured } from '../services/email';
import { FRONTEND_URL } from '../lib/config';

export async function esqueciSenha(req: Request, res: Response) {
  const { email } = req.body;

  const profissional = await prisma.profissional.findUnique({
    where: { email },
    select: { id: true, nome: true },
  });

  if (!profissional || !isEmailConfigured()) {
    logger.info({ email }, 'Pedido de redefinição de senha recebido');
    res.json({ mensagem: 'Se o email existir, você receberá um link de redefinição.' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const token_hash = await bcrypt.hash(token, 10);
  const expires_at = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { email, token_hash, expires_at },
  });

  const resetUrl = `${FRONTEND_URL}/redefinir-senha?token=${token}&email=${encodeURIComponent(email)}`;

  const html = `<p>Olá ${profissional.nome},</p>
<p>Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>Este link expira em 1 hora.</p>
<p>Se você não solicitou esta alteração, ignore este email.</p>`;

  const enviado = await sendEmail(email, 'Redefinição de senha — Kinevia', html);

  if (!enviado) {
    logger.warn({ email }, 'Falha ao enviar email de redefinição de senha');
  }

  res.json({ mensagem: 'Se o email existir, você receberá um link de redefinição.' });
}

export async function redefinirSenha(req: Request, res: Response) {
  const { email, token, novaSenha } = req.body;

  const tokens = await prisma.passwordResetToken.findMany({
    where: {
      email,
      used_at: null,
      expires_at: { gt: new Date() },
    },
    orderBy: { criado_em: 'desc' },
    take: 5,
  });

  let valido = false;

  for (const t of tokens) {
    const match = await bcrypt.compare(token, t.token_hash);
    if (match) {
      const senha_hash = await bcrypt.hash(novaSenha, 10);

      await prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.update({
          where: { id: t.id },
          data: { used_at: new Date() },
        });

        const profissional = await tx.profissional.findUnique({
          where: { email },
          select: { id: true },
        });

        if (profissional) {
          await tx.profissional.update({
            where: { id: profissional.id },
            data: {
              senha_hash,
              token_version: { increment: 1 },
            },
          });
        }
      });

      valido = true;
      break;
    }
  }

  if (!valido) {
    res.status(400).json({ erro: 'Token inválido ou expirado.' });
    return;
  }

  // Limpa tokens expirados para evitar acúmulo no BD
  await prisma.passwordResetToken.deleteMany({
    where: { expires_at: { lt: new Date() } },
  })

  logger.info({ email }, 'Senha redefinida com sucesso');

  res.json({ mensagem: 'Senha redefinida com sucesso.' });
}
