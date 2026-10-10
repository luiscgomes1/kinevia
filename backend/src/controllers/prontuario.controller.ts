import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { registrarAudit } from "../lib/audit";
import { wherePaciente } from "../lib/escopo";

export async function buscarProntuario(req: Request, res: Response) {
  const { id } = req.params;

  const paciente = await prisma.paciente.findFirst({
    where: { id, ...wherePaciente(req), deleted_at: null },
  });

  if (!paciente) {
    return res.status(404).json({ erro: "Paciente não encontrado." });
  }

  const prontuario = await prisma.prontuario.findUnique({
    where: { paciente_id: id },
    include: {
      evolucoes: {
        orderBy: { criado_em: "asc" },
      },
    },
  });

  registrarAudit(req.profissionalId!, 'PRONTUARIO_VISUALIZADO', id)

  if (!prontuario) {
    return res.json({ paciente_id: id, preenchido: false, evolucoes: [] });
  }

  return res.json({ ...prontuario, preenchido: true });
}

export async function salvarProntuario(req: Request, res: Response) {
  const { id } = req.params;

  const {
    medico_solicitante,
    diagnostico_medico,
    queixa_principal,
    hda,
    hpp_has,
    hpp_dm,
    hpp_ca,
    hpp_cardiopatia,
    antecedentes_familiares,
    medicacoes,
    habitos_vida,
    exames_medicos,
    avaliacao_fisica,
    diagnostico_fisio,
      prognostico_fisio,
      plano_terapeutico,
      dor_eva,
      pa,
    fr,
    fc,
    ap,
  } = req.body;

  const paciente = await prisma.paciente.findFirst({
    where: { id, ...wherePaciente(req), deleted_at: null },
  });

  if (!paciente) {
    return res.status(404).json({ erro: "Paciente não encontrado." });
  }

  const prontuario = await prisma.prontuario.upsert({
    where: { paciente_id: id },
    update: {
      medico_solicitante,
      diagnostico_medico,
      queixa_principal,
      hda,
      hpp_has,
      hpp_dm,
      hpp_ca,
      hpp_cardiopatia,
      antecedentes_familiares,
      medicacoes,
      habitos_vida,
      exames_medicos,
      avaliacao_fisica,
      diagnostico_fisio,
      prognostico_fisio,
      plano_terapeutico,
      dor_eva,
      pa,
      fr,
      fc,
      ap,
    },
    create: {
      paciente_id: id,
      medico_solicitante,
      diagnostico_medico,
      queixa_principal,
      hda,
      hpp_has,
      hpp_dm,
      hpp_ca,
      hpp_cardiopatia,
      antecedentes_familiares,
      medicacoes,
      habitos_vida,
      exames_medicos,
      avaliacao_fisica,
      diagnostico_fisio,
      prognostico_fisio,
      plano_terapeutico,
      dor_eva,
      pa,
      fr,
      fc,
      ap,
    },
  });

    registrarAudit(req.profissionalId!, 'PRONTUARIO_ATUALIZADO', id);

    return res.json(prontuario);
}

export async function adicionarEvolucao(req: Request, res: Response) {
    const { id } = req.params;
    const { texto, dor_eva } = req.body;

    const paciente = await prisma.paciente.findFirst({
        where: { id, ...wherePaciente(req), deleted_at: null },
    });

    if (!paciente) {
        return res.status(404).json({ erro: 'Paciente não encontrado.' });
    }

    const prontuario = await prisma.prontuario.findUnique({
        where: { paciente_id: id },
    });

    if (!prontuario) {
        return res.status(404).json({ erro: 'É necessário preencher a avaliação inicial antes de adicionar evoluções.' });
    }

    const evolucao = await prisma.evolucao.create({
        data: {
            prontuario_id: prontuario.id,
            texto: texto.trim(),
            ...(dor_eva !== undefined && { dor_eva }),
        }
    })

    registrarAudit(req.profissionalId!, 'EVOLUCAO_CRIADA', id, { evolucao_id: evolucao.id })

    return res.status(201).json(evolucao);
}

export async function adicionarCorrecao(req: Request, res: Response) {
    const { id } = req.params;
    const { correcao_texto } = req.body;

    const { count } = await prisma.evolucao.updateMany({
        where: {
            id,
            correcao_texto: null,
            prontuario: {
                paciente: {
                    ...wherePaciente(req)
                }
            }
        },
        data: {
            correcao_texto: correcao_texto.trim(),
            correcao_em: new Date(),
        }
    });

    if (count === 0) {
        const existe = await prisma.evolucao.findFirst({
            where: {
                id,
                prontuario: {
                    paciente: {
                        ...wherePaciente(req)
                    }
                }
            },
            select: { correcao_texto: true }
        });
        if (!existe) return res.status(404).json({ erro: 'Evolução não encontrada.' });
        return res.status(400).json({ erro: 'Esta evolução já possui uma correção. Não é possível sobrescrever uma correção existente.' });
    }

    const evolucaoAtualizada = await prisma.evolucao.findFirst({
        where: { id },
        include: { prontuario: { select: { paciente_id: true } } },
    });

    if (evolucaoAtualizada) {
        registrarAudit(req.profissionalId!, 'EVOLUCAO_CORRIGIDA', evolucaoAtualizada.prontuario.paciente_id, { evolucao_id: id });
    }

    const { prontuario: _prontuario, ...evolucao } = evolucaoAtualizada!;

    return res.json(evolucao);
}