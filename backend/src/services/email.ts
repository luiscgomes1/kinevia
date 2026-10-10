import nodemailer from 'nodemailer';
import logger from '../lib/logger';
import { FRONTEND_URL } from '../lib/config';

let transporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  if (!host) return null;

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

export function isEmailConfigured(): boolean {
  return !!process.env.SMTP_HOST;
}

export function montarHtmlAlteracaoEmail(nome: string, novoEmail: string, token: string): string {
  const confirmarUrl = `${FRONTEND_URL}/confirmar-email?token=${token}&email=${encodeURIComponent(novoEmail)}`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a1a2e; font-size: 24px; margin: 0;">Kinevia</h1>
    <p style="color: #666; font-size: 14px;">Sistema de gestão fisioterapêutica</p>
  </div>
  <div style="background: #f9f9fb; border-radius: 12px; padding: 30px; border: 1px solid #e5e5e5;">
    <p style="font-size: 16px;">Olá <strong>${nome}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.6;">
      Recebemos uma solicitação para alterar seu email de cadastro para <strong>${novoEmail}</strong>.
    </p>
    <p style="font-size: 14px; line-height: 1.6;">
      Clique no botão abaixo para confirmar a alteração. Este link expira em 1 hora.
    </p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="${confirmarUrl}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: bold;">Confirmar alteração</a>
    </div>
    <p style="font-size: 13px; color: #999; line-height: 1.5;">
      Se você não solicitou esta alteração, ignore este email. Nenhuma ação será tomada.
    </p>
  </div>
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 25px;">
    Kinevia — Gestão fisioterapêutica
  </p>
</body>
</html>`;
}

export function montarHtmlConvite(nome: string, email: string, senhaTemporaria: string): string {
  const loginUrl = `${FRONTEND_URL}/login`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a1a2e; font-size: 24px; margin: 0;">Kinevia</h1>
    <p style="color: #666; font-size: 14px;">Sistema de gestão fisioterapêutica</p>
  </div>
  <div style="background: #f9f9fb; border-radius: 12px; padding: 30px; border: 1px solid #e5e5e5;">
    <p style="font-size: 16px;">Olá <strong>${nome}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.6;">
      Seu acesso ao Kinevia foi criado. Utilize as credenciais abaixo para fazer login:
    </p>
    <div style="background: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e5e5;">
      <p style="margin: 0 0 8px;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 0;"><strong>Senha temporária:</strong> <span style="font-family: monospace; font-size: 16px; color: #2563eb;">${senhaTemporaria}</span></p>
    </div>
    <p style="font-size: 14px; line-height: 1.6;">
      Após o primeiro login, você precisará <strong>trocar a senha</strong> para continuar usando o sistema.
    </p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="${loginUrl}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: bold;">Ir para o login</a>
    </div>
  </div>
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 25px;">
    Kinevia — Gestão fisioterapêutica
  </p>
</body>
</html>`;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    logger.warn({ to, subject }, 'SMTP não configurado — email não enviado');
    return false;
  }

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || 'noreply@kinevia.app',
      to,
      subject,
      html,
    });
    logger.info({ to, subject }, 'Email enviado com sucesso');
    return true;
  } catch (err) {
    logger.error({ err, to, subject }, 'Falha ao enviar email');
    return false;
  }
}
