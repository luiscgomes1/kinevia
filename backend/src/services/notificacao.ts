import logger from '../lib/logger';
import { sendEmail } from './email';

const meses = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const tipoLabels: Record<string, string> = {
  AVALIACAO: 'Avaliação',
  SESSAO: 'Sessão',
  REPOSICAO: 'Reposição',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatarData(dataStr: string): string {
  const [ano, mes, dia] = dataStr.split('-');
  return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]} de ${ano}`;
}

function formatarDataISO(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

function layoutHtml(titulo: string, corpo: string, profissionalNome: string): string {
  const nomeSeguro = escapeHtml(profissionalNome)
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" style="width:100%;max-width:560px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden">
    <tr>
      <td style="padding:32px 32px 0">
        <h2 style="color:#0d9488;margin:0 0 16px;font-size:18px">${escapeHtml(titulo)}</h2>
        ${corpo}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px 24px;border-top:1px solid #eee;font-size:12px;color:#999">
        ${nomeSeguro}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function tabelaAgendamento(dataFormatada: string, horario: string, tipoFormatado: string): string {
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
    <tr><td style="padding:8px 0;color:#888">Data</td><td style="padding:8px 0"><strong>${dataFormatada}</strong></td></tr>
    <tr><td style="padding:8px 0;border-top:1px solid #eee;color:#888">Horário</td><td style="padding:8px 0;border-top:1px solid #eee"><strong>${horario}</strong></td></tr>
    <tr><td style="padding:8px 0;border-top:1px solid #eee;color:#888">Tipo</td><td style="padding:8px 0;border-top:1px solid #eee"><strong>${tipoFormatado}</strong></td></tr>
  </table>`;
}

export async function enviarConfirmacao(params: {
  email: string;
  pacienteNome: string;
  profissionalNome: string;
  data: string;
  horario: string;
  tipo: string;
}): Promise<boolean> {
  const { email, pacienteNome, profissionalNome, data, horario, tipo } = params;
  const titulo = 'Agendamento Confirmado';
  const nomePacienteSeguro = escapeHtml(pacienteNome)
  const corpo = `
    <p style="color:#555;font-size:14px;margin:0 0 4px">Ol&aacute; <strong>${nomePacienteSeguro}</strong>,</p>
    <p style="color:#555;font-size:14px;margin:0 0 8px">Seu agendamento foi confirmado:</p>
    ${tabelaAgendamento(formatarData(data), horario, tipoLabels[tipo] || tipo)}
    <p style="color:#888;font-size:13px">Se precisar remarcar, entre em contato.</p>`;

  logger.info({ email, data, horario }, 'Enviando confirmação de agendamento');
  return sendEmail(email, `${titulo} — ${escapeHtml(profissionalNome)}`, layoutHtml(titulo, corpo, profissionalNome));
}

export async function enviarLembrete(params: {
  email: string;
  pacienteNome: string;
  profissionalNome: string;
  data: string;
  horario: string;
  tipo: string;
}): Promise<boolean> {
  const { email, pacienteNome, profissionalNome, data, horario, tipo } = params;
  const titulo = 'Lembrete de Agendamento';
  const nomePacienteSeguro = escapeHtml(pacienteNome)
  const corpo = `
    <p style="color:#555;font-size:14px;margin:0 0 4px">Ol&aacute; <strong>${nomePacienteSeguro}</strong>,</p>
    <p style="color:#555;font-size:14px;margin:0 0 8px">Passando para lembrar da sua sess&atilde;o amanh&atilde;:</p>
    ${tabelaAgendamento(formatarData(data), horario, tipoLabels[tipo] || tipo)}
    <p style="color:#888;font-size:13px">Se n&atilde;o puder comparecer, avise com anteced&ecirc;ncia.</p>`;

  logger.info({ email, data, horario }, 'Enviando lembrete de agendamento');
  return sendEmail(email, `${titulo} — ${escapeHtml(profissionalNome)}`, layoutHtml(titulo, corpo, profissionalNome));
}

export async function enviarCancelamento(params: {
  email: string;
  pacienteNome: string;
  profissionalNome: string;
  data: string;
  horario: string;
}): Promise<boolean> {
  const { email, pacienteNome, profissionalNome, data, horario } = params;
  const titulo = 'Agendamento Cancelado';
  const nomePacienteSeguro = escapeHtml(pacienteNome)
  const corpo = `
    <p style="color:#555;font-size:14px;margin:0 0 4px">Ol&aacute; <strong>${nomePacienteSeguro}</strong>,</p>
    <p style="color:#555;font-size:14px;margin:0">Seu agendamento do dia <strong>${escapeHtml(formatarData(data))}</strong> &agrave;s <strong>${escapeHtml(horario)}</strong> foi cancelado.</p>
    <p style="color:#888;font-size:13px;margin-top:12px">Se desejar, fa&ccedil;a um novo agendamento quando preferir.</p>`;

  logger.info({ email, data, horario }, 'Enviando cancelamento de agendamento');
  return sendEmail(email, `${titulo} — ${escapeHtml(profissionalNome)}`, layoutHtml(titulo, corpo, profissionalNome));
}


