import nodemailer from 'nodemailer';
import logger from '../lib/logger';

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
