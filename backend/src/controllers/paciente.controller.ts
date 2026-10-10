import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { registrarAudit } from '../lib/audit';
import { criarNotificacao, notificarAdminsDaClinica } from '../services/notificacao.service';
import { wherePaciente, wherePacote, whereLaudo, whereAgendamento } from '../lib/escopo';

export async function listarPacientes(req: Request, res: Response) {
    const busca = req.query.busca as string | undefined;
    const incluirInativos = req.query.incluirInativos === 'true';
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;

    const pacientes = await prisma.paciente.findMany({
        where: { 
            ...wherePaciente(req),
            deleted_at: null,
            ...(!incluirInativos && { ativo: true }),
            ...(busca && {
                nome: {
                    contains: busca,
                    mode: 'insensitive',
                }
            })
        },
        orderBy: { nome: 'asc' },
        take: limit,
        skip: offset,
        select: {
            id: true,
            nome: true,
            telefone: true,
            ativo: true,
            criado_em: true,
        }
    })

    return res.json(pacientes);
}

export async function buscarPaciente(req: Request, res: Response) {
    const { id } = req.params;

    const paciente = await prisma.paciente.findFirst({
        where: {
            id,
            ...wherePaciente(req),
            deleted_at: null,
        }
    })

    if (!paciente) {
        return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    return res.json(paciente);
}

export async function criarPaciente(req: Request, res: Response) {
    const paciente = req.body;

    const cpfJaExiste = await prisma.paciente.findFirst({
        where: {
            cpf: paciente.cpf,
            profissional_id: req.profissionalId,
            deleted_at: null,
        }
    });

    if (cpfJaExiste) {
        return res.status(409).json({ erro: 'Já existe um paciente com esse CPF' });
    }

    const pacienteCriado = await prisma.paciente.create({
        data: {
            nome: paciente.nome,
            cpf: paciente.cpf,
            data_nascimento: new Date(paciente.data_nascimento),
            endereco: paciente.endereco,
            estado_civil: paciente.estado_civil,
            nacionalidade: paciente.nacionalidade,
            telefone: paciente.telefone,
            email: paciente.email,
            observacoes: paciente.observacoes,
            profissional_id: req.profissionalId!,
            clinica_id: req.clinicaId ?? null,
        }
    })

    if (pacienteCriado.clinica_id) {
        await notificarAdminsDaClinica(
            pacienteCriado.clinica_id,
            'PACIENTE_CADASTRADO',
            'Novo paciente cadastrado',
            `O paciente ${pacienteCriado.nome} foi cadastrado na clínica.`,
            [req.profissionalId!],
        );
    }

    return res.status(201).json(pacienteCriado);
}

export async function atualizarPaciente(req: Request, res: Response) {
    const { id } = req.params;
    const paciente = req.body;

    const { count } = await prisma.paciente.updateMany({
        where: { id, ...wherePaciente(req), deleted_at: null },
        data: {
            nome: paciente.nome,
            endereco: paciente.endereco,
            estado_civil: paciente.estado_civil,
            nacionalidade: paciente.nacionalidade,
            telefone: paciente.telefone,
            email: paciente.email,
            observacoes: paciente.observacoes,
        }
    })

    if (count === 0) {
        return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    const pacienteAtualizado = await prisma.paciente.findFirst({
        where: { id, ...wherePaciente(req), deleted_at: null },
    })

    return res.json(pacienteAtualizado);
}

export async function exportarPaciente(req: Request, res: Response) {
  const { id } = req.params

  const paciente = await prisma.paciente.findFirst({
    where: { id, ...wherePaciente(req), deleted_at: null },
  })

  if (!paciente) {
    return res.status(404).json({ erro: 'Paciente não encontrado' })
  }

  const [prontuario, pacotes, laudos, agendamentos] = await Promise.all([
    prisma.prontuario.findUnique({
      where: { paciente_id: id },
      include: {
        evolucoes: { orderBy: { criado_em: 'asc' } },
      },
    }),
    prisma.pacote.findMany({
      where: { paciente_id: id, ...wherePacote(req) },
      include: {
        sessoes: {
          include: {
            agendamento: {
              select: { data: true, horario: true, slot: true, status: true, tipo: true },
            },
          },
        },
      },
      orderBy: { criado_em: 'desc' },
    }),
    prisma.laudo.findMany({
      where: { paciente_id: id, ...whereLaudo(req) },
      orderBy: { criado_em: 'desc' },
    }),
    prisma.agendamento.findMany({
      where: { paciente_id: id, ...whereAgendamento(req) },
      orderBy: { data: 'desc' },
    }),
  ])

  registrarAudit(req.profissionalId!, 'PACIENTE_EXPORTADO', id)

  res.json({
    exportado_em: new Date().toISOString(),
    paciente,
    prontuario,
    pacotes,
    laudos,
    agendamentos,
  })
}

export async function anonimizarPaciente(req: Request, res: Response) {
  const { id } = req.params

  const paciente = await prisma.paciente.findFirst({
    where: { id, ...wherePaciente(req), deleted_at: null },
  })

  if (!paciente) {
    return res.status(404).json({ erro: 'Paciente não encontrado' })
  }

  if (!paciente.ativo) {
    return res.status(400).json({ erro: 'Paciente já está anonimizado ou inativo' })
  }

  await prisma.paciente.update({
    where: { id },
    data: {
      nome: '[ANONIMIZADO]',
      cpf: '[ANONIMIZADO]',
      data_nascimento: new Date('1970-01-01'),
      endereco: '[ANONIMIZADO]',
      estado_civil: '[ANONIMIZADO]',
      nacionalidade: '[ANONIMIZADO]',
      telefone: null,
      email: null,
      observacoes: null,
      ativo: false,
    },
  })

  const laudos = await prisma.laudo.findMany({
    where: { paciente_id: id },
    select: { id: true, conteudo: true },
  })

  if (laudos.length > 0) {
    await prisma.$transaction(
      laudos.map((laudo) =>
        prisma.laudo.update({
          where: { id: laudo.id },
          data: {
            conteudo: {
              ...(laudo.conteudo as Record<string, unknown>),
              cpf_paciente: '[ANONIMIZADO]',
            },
          },
        }),
      ),
    )
  }

  registrarAudit(req.profissionalId!, 'PACIENTE_ANONIMIZADO', id)

  res.json({ mensagem: 'Dados do paciente anonimizados com sucesso. Registros clínicos foram mantidos para cumprimento de obrigação legal.' })
}

export async function desativarPaciente(req: Request, res: Response) {
    const { id } = req.params;

    const { count } = await prisma.paciente.updateMany({
        where: { id, ...wherePaciente(req), deleted_at: null, ativo: true },
        data: { ativo: false },
    })

    if (count === 0) {
        const existe = await prisma.paciente.findFirst({
            where: { id, ...wherePaciente(req), deleted_at: null },
            select: { ativo: true },
        })
        if (!existe) return res.status(404).json({ erro: 'Paciente não encontrado' })
        return res.status(400).json({ erro: 'Paciente já está inativo' })
    }

    return res.status(204).send();
}

export async function reativarPaciente(req: Request, res: Response) {
    const { id } = req.params;

    const existente = await prisma.paciente.findFirst({
        where: { id, ...wherePaciente(req), deleted_at: null },
        select: { ativo: true, nome: true },
    })

    if (!existente) {
        return res.status(404).json({ erro: 'Paciente não encontrado' })
    }

    if (existente.nome === '[ANONIMIZADO]') {
        return res.status(400).json({ erro: 'Paciente anonimizado não pode ser reativado.' })
    }

    const { count } = await prisma.paciente.updateMany({
        where: { id, ...wherePaciente(req), deleted_at: null, ativo: false },
        data: { ativo: true },
    })

    if (count === 0) {
        return res.status(400).json({ erro: 'Paciente já está ativo' })
    }

    const pacienteReativado = await prisma.paciente.findFirst({
        where: { id, ...wherePaciente(req), deleted_at: null },
    })

    registrarAudit(req.profissionalId!, 'PACIENTE_REATIVADO', id);

    return res.json(pacienteReativado);
}

export async function historicoPaciente(req: Request, res: Response) {
  const { id } = req.params;

  const paciente = await prisma.paciente.findFirst({
    where: { id, ...wherePaciente(req), deleted_at: null },
    select: { id: true },
  });

  if (!paciente) {
    return res.status(404).json({ erro: 'Paciente não encontrado.' });
  }

  const logs = await prisma.auditLog.findMany({
    where: { paciente_id: id, acao: 'PACIENTE_TRANSFERIDO' },
    orderBy: { criado_em: 'desc' },
  });

  const profissionalIds = [...new Set(logs.flatMap((l) => {
    const meta = l.metadata as { de?: string; para?: string } | null;
    return meta ? [meta.de, meta.para].filter(Boolean) : [];
  }))] as string[];

  const profissionais = await prisma.profissional.findMany({
    where: { id: { in: profissionalIds } },
    select: { id: true, nome: true },
  });
  const nomeMap = new Map(profissionais.map((p) => [p.id, p.nome]));

  const historico = logs.map((l) => {
    const meta = l.metadata as { de?: string; para?: string } | null;
    return {
      criado_em: l.criado_em,
      de: meta?.de ? { id: meta.de, nome: nomeMap.get(meta.de) ?? 'Desconhecido' } : null,
      para: meta?.para ? { id: meta.para, nome: nomeMap.get(meta.para) ?? 'Desconhecido' } : null,
    };
  });

  res.json(historico);
}

export async function transferirPaciente(req: Request, res: Response) {
  const { id } = req.params;
  const { novo_profissional_id } = req.body;

  const paciente = await prisma.paciente.findFirst({
    where: { id, deleted_at: null },
    select: { id: true, cpf: true, nome: true, profissional_id: true },
  });

  if (!paciente) {
    return res.status(404).json({ erro: 'Paciente não encontrado.' });
  }

  if (req.role === 'ADMIN') {
    const profissional = await prisma.profissional.findUnique({
      where: { id: paciente.profissional_id },
      select: { clinica_id: true },
    });
    if (!profissional || profissional.clinica_id !== req.clinicaId) {
      return res.status(404).json({ erro: 'Paciente não encontrado.' });
    }
  }

  const novoProfissional = await prisma.profissional.findUnique({
    where: { id: novo_profissional_id },
    select: { id: true, clinica_id: true, role: true, nome: true },
  });

  if (!novoProfissional) {
    return res.status(404).json({ erro: 'Profissional de destino não encontrado.' });
  }

  if (novoProfissional.role === 'ATENDENTE') {
    return res.status(400).json({ erro: 'Atendentes não podem receber pacientes.' });
  }

  if (novo_profissional_id === paciente.profissional_id) {
    return res.status(400).json({ erro: 'O paciente já pertence a este profissional.' });
  }

  if (req.role !== 'SUPER_ADMIN' && novoProfissional.clinica_id !== req.clinicaId) {
    return res.status(403).json({ erro: 'Profissional de destino não pertence à sua clínica.' });
  }

  const cpfEmUso = await prisma.paciente.findFirst({
    where: { cpf: paciente.cpf, profissional_id: novo_profissional_id, id: { not: id }, deleted_at: null },
  });

  if (cpfEmUso) {
    return res.status(409).json({ erro: 'O profissional de destino já possui um paciente com este CPF.' });
  }

  const donoAnterior = paciente.profissional_id;

  const resultado = await prisma.$transaction(async (tx) => {
    const agendamentos = await tx.agendamento.updateMany({
      where: { paciente_id: id, profissional_id: donoAnterior },
      data: { profissional_id: novo_profissional_id, clinica_id: novoProfissional.clinica_id },
    });
    const pacotes = await tx.pacote.updateMany({
      where: { paciente_id: id, profissional_id: donoAnterior },
      data: { profissional_id: novo_profissional_id, clinica_id: novoProfissional.clinica_id },
    });
    const laudos = await tx.laudo.updateMany({
      where: { paciente_id: id, profissional_id: donoAnterior },
      data: { profissional_id: novo_profissional_id, clinica_id: novoProfissional.clinica_id },
    });

    await tx.paciente.update({
      where: { id },
      data: { profissional_id: novo_profissional_id, clinica_id: novoProfissional.clinica_id },
    });

    return { agendamentos, pacotes, laudos };
  });

  const donoAnteriorNome = await prisma.profissional.findUnique({
    where: { id: donoAnterior },
    select: { nome: true },
  });

  registrarAudit(req.profissionalId!, 'PACIENTE_TRANSFERIDO', id, {
    de: donoAnterior,
    de_nome: donoAnteriorNome?.nome,
    para: novo_profissional_id,
    para_nome: novoProfissional.nome,
    agendamentos: resultado.agendamentos.count,
    pacotes: resultado.pacotes.count,
    laudos: resultado.laudos.count,
  });

  const profissionalRemetente = await prisma.profissional.findUnique({
    where: { id: req.profissionalId },
    select: { nome: true },
  });

  criarNotificacao(novo_profissional_id, 'PACIENTE_TRANSFERIDO', 'Paciente recebido', `Você recebeu o paciente ${paciente.nome} transferido por ${profissionalRemetente?.nome ?? 'outro profissional'}.`);

  res.json({ mensagem: `Paciente transferido para ${novoProfissional.nome}.` });
}

export async function deletarPaciente(req: Request, res: Response) {
  const { id } = req.params;

  const { count } = await prisma.paciente.updateMany({
    where: { id, ...wherePaciente(req), deleted_at: null },
    data: { deleted_at: new Date(), ativo: false },
  });

  if (count === 0) {
    const existe = await prisma.paciente.findFirst({
      where: { id, ...wherePaciente(req) },
    });
    if (!existe) return res.status(404).json({ erro: 'Paciente não encontrado' });
    return res.status(400).json({ erro: 'Paciente já foi removido.' });
  }

  registrarAudit(req.profissionalId!, 'PACIENTE_REMOVIDO', id);

  return res.status(204).send();
}

export async function corrigirIdentidade(req: Request, res: Response) {
    const { id } = req.params;
    const { cpf, data_nascimento } = req.body;

    if (!cpf && !data_nascimento) {
        return res.status(400).json({ erro: 'É necessário fornecer CPF ou data de nascimento para correção' });
    }

    if (cpf) {
        const cpfEmUso = await prisma.paciente.findFirst({
            where: {
                cpf,
                ...wherePaciente(req),
                id: { not: id },
                deleted_at: null,
            }
        });

        if (cpfEmUso) {
            return res.status(400).json({ erro: 'CPF já está em uso' });
        }
    }

    const { count } = await prisma.paciente.updateMany({
        where: { id, ...wherePaciente(req), deleted_at: null },
        data: {
            ...(cpf && { cpf }),
            ...(data_nascimento && { data_nascimento: new Date(data_nascimento) }),
        },
    })

    if (count === 0) {
        return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    const pacienteAtualizado = await prisma.paciente.findFirst({
        where: { id, ...wherePaciente(req), deleted_at: null },
    })

    return res.json(pacienteAtualizado);
}