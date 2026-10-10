import { Request, Response } from 'express';
import prisma from '../lib/prisma';

const rotulosAcao: Record<string, string> = {
  PRONTUARIO_VISUALIZADO: 'Visualizou prontuário',
  PRONTUARIO_ATUALIZADO: 'Atualizou avaliação inicial',
  EVOLUCAO_VISUALIZADA: 'Visualizou evolução',
  EVOLUCAO_CRIADA: 'Criou evolução',
  EVOLUCAO_CORRIGIDA: 'Corrigiu evolução',
  LAUDO_VISUALIZADO: 'Visualizou laudo',
  LAUDO_PDF_GERADO: 'Gerou PDF do laudo',
  LAUDO_CRIADO: 'Criou laudo',
  LAUDO_EDITADO: 'Editou laudo',
  LAUDO_EXCLUIDO: 'Excluiu laudo',
  PACOTE_CRIADO: 'Criou pacote',
  PACOTE_PAGAMENTO_ALTERADO: 'Alterou pagamento do pacote',
  SESSAO_AGENDADA: 'Agendou sessão',
  AGENDAMENTO_STATUS_ALTERADO: 'Alterou status do agendamento',
  PACIENTE_EXPORTADO: 'Exportou paciente',
  PACIENTE_ANONIMIZADO: 'Anonimizou paciente',
  PACIENTE_TRANSFERIDO: 'Transferiu paciente',
  PACIENTE_REMOVIDO: 'Removeu paciente',
  PACIENTE_REATIVADO: 'Reativou paciente',
};

const LABELS_TIPO_PACOTE: Record<string, string> = {
  INDIVIDUAL: 'Sessão individual',
  PACOTE_5: 'Pacote 5',
  PACOTE_10: 'Pacote 10',
};

const LABELS_PAGAMENTO: Record<string, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
};

const LABELS_STATUS_AGENDAMENTO: Record<string, string> = {
  AGENDADO: 'Agendado',
  COMPARECEU: 'Compareceu',
  FALTOU: 'Faltou',
  DESMARCOU: 'Desmarcou',
};

const TIPO_LAUDO_LABEL: Record<string, string> = {
  CLINICO: 'clínico',
  COMPLETO: 'completo (perícia)',
  REEMBOLSO: 'reembolso',
};

function formatarDetalhes(acao: string, metadata: unknown): string {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return '';
    const m = metadata as Record<string, unknown>;
    if (acao === 'PACIENTE_TRANSFERIDO' && typeof m.de === 'string') {
        const partes = [
            `De: ${(m.de_nome as string) ?? m.de}`,
            `Para: ${(m.para_nome as string) ?? m.para}`,
        ];
        for (const chave of ['agendamentos', 'pacotes', 'laudos'] as const) {
            if (typeof m[chave] === 'number') partes.push(`${m[chave]} ${chave}`);
        }
        return partes.join(' | ');
    }
    if (acao === 'PACOTE_CRIADO') {
        const tipo = LABELS_TIPO_PACOTE[String(m.tipo)] ?? String(m.tipo);
        const valor = typeof m.valor_cobrado === 'number'
            ? `R$ ${m.valor_cobrado.toFixed(2).replace('.', ',')}`
            : '';
        return `Pacote ${tipo}${valor ? ` · ${valor}` : ''}`;
    }
    if (acao === 'PACOTE_PAGAMENTO_ALTERADO') {
        return `Pagamento: ${LABELS_PAGAMENTO[String(m.status_pagamento)] ?? String(m.status_pagamento)}`;
    }
    if (acao === 'SESSAO_AGENDADA' && typeof m.data === 'string') {
        const data = m.data.split('-');
        const dataFmt = data.length === 3 ? `${data[2]}/${data[1]}/${data[0]}` : m.data;
        return `Sessão em ${dataFmt}${m.horario ? ` às ${m.horario}` : ''}`;
    }
    if (acao === 'AGENDAMENTO_STATUS_ALTERADO') {
        return `Status: ${LABELS_STATUS_AGENDAMENTO[String(m.status)] ?? String(m.status)}`;
    }
    if (acao === 'EVOLUCAO_CRIADA' || acao === 'EVOLUCAO_CORRIGIDA' || acao === 'LAUDO_PDF_GERADO') return '';
    if (acao === 'LAUDO_CRIADO' || acao === 'LAUDO_EDITADO' || acao === 'LAUDO_EXCLUIDO' || acao === 'LAUDO_PDF_GERADO') {
        const tipo = TIPO_LAUDO_LABEL[String(m.tipo)] ?? '';
        return tipo ? `Laudo ${tipo}` : '';
    }
    return JSON.stringify(metadata);
}

export async function listarAuditoria(req: Request, res: Response) {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const profissionalId = req.query.profissional_id as string | undefined;
    const acao = req.query.acao as string | undefined;
    const pacienteId = req.query.paciente_id as string | undefined;
    const dataInicio = req.query.data_inicio as string | undefined;
    const dataFim = req.query.data_fim as string | undefined;

    const where: Record<string, unknown> = {};
    if (acao) where.acao = acao;

    if (pacienteId) {
        if (req.role === 'SUPER_ADMIN') {
            where.paciente_id = pacienteId;
        } else if (req.clinicaId) {
            const paciente = await prisma.paciente.findFirst({
                where: { id: pacienteId, clinica_id: req.clinicaId },
                select: { id: true },
            });
            where.paciente_id = paciente ? pacienteId : '__nao_existe__';
        } else {
            where.paciente_id = '__nao_existe__';
        }
    }

    if (dataInicio || dataFim) {
      const filtroData: Record<string, Date> = {};
      if (dataInicio) filtroData.gte = new Date(dataInicio);
      if (dataFim) filtroData.lt = new Date(dataFim);
      where.criado_em = filtroData;
    }

    if (req.role !== 'SUPER_ADMIN' && req.clinicaId) {
        const profissionaisDaClinica = await prisma.profissional.findMany({
            where: { clinica_id: req.clinicaId },
            select: { id: true },
        });
        const ids = profissionaisDaClinica.map((p) => p.id);
        where.profissional_id = profissionalId
            ? { in: ids.filter((id) => id === profissionalId) }
            : { in: ids };
    } else if (req.role !== 'SUPER_ADMIN') {
        where.profissional_id = '__sem_clinica__';
    } else if (profissionalId) {
        where.profissional_id = profissionalId;
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { criado_em: 'desc' },
            take: limit,
            skip: offset,
        }),
        prisma.auditLog.count({ where }),
    ]);

    const profissionalIds = [...new Set(logs.map((l) => l.profissional_id))];
    const profissionais = await prisma.profissional.findMany({
        where: { id: { in: profissionalIds } },
        select: { id: true, nome: true },
    });
    const profissionalMap = new Map(profissionais.map((p) => [p.id, p.nome]));

    const pacienteIds = [...new Set(logs.map((l) => l.paciente_id).filter((id): id is string => !!id))];
    const pacientes = await prisma.paciente.findMany({
        where: { id: { in: pacienteIds } },
        select: { id: true, nome: true },
    });
    const pacienteMap = new Map(pacientes.map((p) => [p.id, p.nome]));

    const logsComNome = logs.map((l) => ({
        ...l,
        profissional_nome: profissionalMap.get(l.profissional_id) ?? 'Desconhecido',
        paciente_nome: l.paciente_id ? (pacienteMap.get(l.paciente_id) ?? null) : null,
    }));

    res.json({ logs: logsComNome, total, limit, offset });
}

export async function exportarAuditoria(req: Request, res: Response) {
    const profissionalId = req.query.profissional_id as string | undefined;
    const acao = req.query.acao as string | undefined;
    const pacienteId = req.query.paciente_id as string | undefined;
    const dataInicio = req.query.data_inicio as string | undefined;
    const dataFim = req.query.data_fim as string | undefined;

    const where: Record<string, unknown> = {};
    if (acao) where.acao = acao;

    if (pacienteId) {
        if (req.role === 'SUPER_ADMIN') {
            where.paciente_id = pacienteId;
        } else if (req.clinicaId) {
            const paciente = await prisma.paciente.findFirst({
                where: { id: pacienteId, clinica_id: req.clinicaId },
                select: { id: true },
            });
            where.paciente_id = paciente ? pacienteId : '__nao_existe__';
        } else {
            where.paciente_id = '__nao_existe__';
        }
    }

    if (dataInicio || dataFim) {
      const filtroData: Record<string, Date> = {};
      if (dataInicio) filtroData.gte = new Date(dataInicio);
      if (dataFim) filtroData.lt = new Date(dataFim);
      where.criado_em = filtroData;
    }

    if (req.role !== 'SUPER_ADMIN' && req.clinicaId) {
        const profissionaisDaClinica = await prisma.profissional.findMany({
            where: { clinica_id: req.clinicaId },
            select: { id: true },
        });
        const ids = profissionaisDaClinica.map((p) => p.id);
        where.profissional_id = profissionalId
            ? { in: ids.filter((id) => id === profissionalId) }
            : { in: ids };
    } else if (req.role !== 'SUPER_ADMIN') {
        where.profissional_id = '__sem_clinica__';
    } else if (profissionalId) {
        where.profissional_id = profissionalId;
    }

    const logs = await prisma.auditLog.findMany({ where, orderBy: { criado_em: 'desc' } });

    const profissionalIds = [...new Set(logs.map((l) => l.profissional_id))];
    const profissionais = await prisma.profissional.findMany({
        where: { id: { in: profissionalIds } },
        select: { id: true, nome: true },
    });
    const profissionalMap = new Map(profissionais.map((p) => [p.id, p.nome]));

    const pacienteIds = [...new Set(logs.map((l) => l.paciente_id).filter((id): id is string => !!id))];
    const pacientes = await prisma.paciente.findMany({
        where: { id: { in: pacienteIds } },
        select: { id: true, nome: true },
    });
    const pacienteMap = new Map(pacientes.map((p) => [p.id, p.nome]));

    const csvLinhas = [
        'Data;Profissional;Ação;Paciente;Detalhes',
        ...logs.map((l) =>
            [
                l.criado_em.toISOString(),
                profissionalMap.get(l.profissional_id) ?? 'Desconhecido',
                rotulosAcao[l.acao] || l.acao,
                l.paciente_id ? (pacienteMap.get(l.paciente_id) ?? l.paciente_id) : '',
                formatarDetalhes(l.acao, l.metadata),
            ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(';')
        ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="auditoria-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('\uFEFF' + csvLinhas);
}
