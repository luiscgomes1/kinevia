import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { enviarConfirmacao, enviarCancelamento } from '../services/notificacao';

function gerarHorarios(horarioInicio: string, horarioFim: string): string[] {
    const horarios: string[] = [];

    const [horaInicio, minInicio] = horarioInicio.split(':').map(Number);
    const [horaFim, minFim] = horarioFim.split(':').map(Number);

    const inicioMinutos = horaInicio * 60 + minInicio;
    const fimMinutos = horaFim * 60 + minFim;

    for (let minutos = inicioMinutos; minutos < fimMinutos; minutos += 60) {
        const h = Math.floor(minutos / 60).toString().padStart(2, '0');
        const m = (minutos % 60).toString().padStart(2, '0');
        horarios.push(`${h}:${m}`);
    }

    return horarios;
}

export async function buscarAgendaDia(req: Request, res: Response) {
    const dataQuery = req.query.data as string | undefined;

    if (!dataQuery) {
        return res.status(400).json({ erro: 'Data é obrigatória (formato: YYYY-MM-DD).' });
    }

    const profissional = await prisma.profissional.findUnique({
        where: { id: req.profissionalId },
        select: { horario_inicio: true, horario_fim: true }
    });

    if (!profissional) {
        return res.status(404).json({ erro: 'Profissional não encontrado' });
    }

    const agendamentos = await prisma.agendamento.findMany({
        where: {
            profissional_id: req.profissionalId,
            data: new Date(dataQuery),
            status: { not: 'DESMARCOU' },
        },
        include: {
            paciente: {
                select: { id: true, nome: true }
            }
        }
    });

    const horariosDoDia = gerarHorarios(profissional.horario_inicio, profissional.horario_fim);

    const grade = horariosDoDia.map((horario) => {
        const slots = [1, 2, 3].map((numeroSlot) => {
            const agendamentoDoSlot = agendamentos.find(
                (agendamento) => agendamento.horario === horario && agendamento.slot === numeroSlot
            )

            return {
                slot: numeroSlot,
                agendamento: agendamentoDoSlot ?? null,
            }
        })

        return { horario, slots };
    })

    return res.json({
        data: dataQuery,
        horarios: grade,
    })
}

export async function criarAgendamento(req: Request, res: Response)  {
    const { paciente_id, data, horario, slot, tipo } = req.body;

    const paciente = await prisma.paciente.findFirst({
        where: {
            id: paciente_id,
            profissional_id: req.profissionalId,
        }
    });

    if (!paciente) {
        return res.status(404).json({ erro: 'Paciente não encontrado.' });
    }

    const profissional = await prisma.profissional.findUnique({
        where: { id: req.profissionalId },
        select: { horario_inicio: true, horario_fim: true }
    });

    const horariosValidos = gerarHorarios(profissional!.horario_inicio, profissional!.horario_fim);

    if (!horariosValidos.includes(horario)) {
        return res.status(400).json({ erro: `Horário fora do expediente configurado (${profissional!.horario_inicio} às ${profissional!.horario_fim}).` });
    }

    const slotOcupado = await prisma.agendamento.findFirst({
        where: {
            profissional_id: req.profissionalId,
            data: new Date(data),
            horario,
            slot,
            status: { not: 'DESMARCOU' },
        }
    });

    if (slotOcupado) {
        return res.status(400).json({ erro: 'Slot já está ocupado para o horário selecionado.' });
    }

    const agendamento = await prisma.agendamento.create({
        data: {
            paciente_id,
            profissional_id: req.profissionalId!,
            data: new Date(data),
            horario,
            slot,
            tipo: tipo || 'SESSAO'
        },
        include: {
            paciente: {
                select: { id: true, nome: true, email: true, telefone: true }
            },
            profissional: {
                select: { nome: true }
            }
        }
    })

    if (agendamento.paciente.email) {
        enviarConfirmacao({
            email: agendamento.paciente.email,
            pacienteNome: agendamento.paciente.nome,
            profissionalNome: agendamento.profissional.nome,
            data,
            horario,
            tipo: tipo || 'SESSAO',
        }).catch((err) => logger.error({ err }, 'Falha ao enviar email de confirmação'));
    }

    return res.status(201).json(agendamento);
}

export async function atualizarStatusAgendamento(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    const agendamento = await prisma.agendamento.findFirst({
        where: { id, profissional_id: req.profissionalId },
        include: {
            paciente: { select: { nome: true, email: true } },
            profissional: { select: { nome: true } },
        },
    })

    if (!agendamento) {
        return res.status(404).json({ erro: 'Agendamento não encontrado.' });
    }

    const statusFinais = ['COMPARECEU', 'FALTOU', 'DESMARCOU'];

    if(statusFinais.includes(agendamento.status)) {
        return res.status(400).json({ erro: `Esse agendamento já está com status "${agendamento.status}" e não pode ser alterado por aqui.` });
    }

    // Ao desmarcar, remove o vínculo com o pacote para liberar a sessão
    if (status === 'DESMARCOU') {
        await prisma.sessaoPacote.deleteMany({
            where: { agendamento_id: id },
        })
    }

    const agendamentoAtualizado = await prisma.agendamento.update({
        where: { id },
        data: { status },
        include: {
            paciente: {
                select: { id: true, nome: true }
            }
        }
    })

    if (status === 'DESMARCOU' && agendamento.paciente.email) {
        const dataStr = `${agendamento.data.getFullYear()}-${String(agendamento.data.getMonth() + 1).padStart(2, '0')}-${String(agendamento.data.getDate()).padStart(2, '0')}`;
        enviarCancelamento({
            email: agendamento.paciente.email,
            pacienteNome: agendamento.paciente.nome,
            profissionalNome: agendamento.profissional.nome,
            data: dataStr,
            horario: agendamento.horario,
        }).catch((err) => logger.error({ err }, 'Falha ao enviar email de cancelamento'));
    }

    return res.json(agendamentoAtualizado);
}

export async function resumoMes(req: Request, res: Response) {
    const ano = parseInt(req.query.ano as string)
    const mes = parseInt(req.query.mes as string)

    if (isNaN(ano) || isNaN(mes) || mes < 1 || mes > 12) {
        return res.status(400).json({ erro: 'Parâmetros ano (YYYY) e mes (1-12) são obrigatórios.' })
    }

    const dataInicio = new Date(Date.UTC(ano, mes - 1, 1))
    const dataFim = new Date(Date.UTC(ano, mes, 0, 23, 59, 59))

    const dias = await prisma.agendamento.findMany({
        where: {
            profissional_id: req.profissionalId,
            data: { gte: dataInicio, lte: dataFim },
            status: { not: 'DESMARCOU' },
        },
        select: { data: true },
        distinct: ['data'],
    })

    const diasComAgendamento = dias.map((d) => d.data.getUTCDate())

    return res.json({ ano, mes, dias: diasComAgendamento })
}