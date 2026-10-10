import cron from 'node-cron';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { enviarLembrete } from '../services/notificacao';
import { isEmailConfigured } from '../services/email';

export async function executarLembretes(): Promise<{ quantidade: number; enviados: number }> {
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const alvo = new Date(Date.UTC(amanha.getFullYear(), amanha.getMonth(), amanha.getDate()));

  logger.info({ dataAlvo: alvo.toISOString() }, 'Verificando agendamentos para lembrete');

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      data: alvo,
      status: 'AGENDADO',
      lembrete_email_enviado: null,
      paciente: { email: { not: null } },
    },
    include: {
      paciente: { select: { nome: true, email: true } },
      profissional: { select: { nome: true } },
    },
  });

  logger.info({ quantidade: agendamentos.length }, 'Lembretes a enviar');

  const enviados: string[] = [];

  for (const agendamento of agendamentos) {
    const email = agendamento.paciente.email!;
    const dataStr = `${alvo.getFullYear()}-${String(alvo.getMonth() + 1).padStart(2, '0')}-${String(alvo.getDate()).padStart(2, '0')}`;

    const enviado = await enviarLembrete({
      email,
      pacienteNome: agendamento.paciente.nome,
      profissionalNome: agendamento.profissional.nome,
      data: dataStr,
      horario: agendamento.horario,
      tipo: agendamento.tipo,
    });

    if (enviado) {
      enviados.push(agendamento.id);
    }
  }

  if (enviados.length > 0) {
    await prisma.agendamento.updateMany({
      where: { id: { in: enviados } },
      data: { lembrete_email_enviado: new Date() },
    });
  }

  return { quantidade: agendamentos.length, enviados: enviados.length };
}

function iniciarLembreteJob(): void {
  if (!isEmailConfigured()) {
    logger.warn('SMTP não configurado — job de lembretes não será iniciado');
    return;
  }

  cron.schedule('*/30 * * * *', () => {
    executarLembretes().catch((err) => logger.error({ err }, 'Erro no job de lembretes'));
  });

  logger.info('Job de lembretes iniciado (a cada 30 minutos)');
}

export default iniciarLembreteJob;