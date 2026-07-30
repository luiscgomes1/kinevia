import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function listarPacientes(req: Request, res: Response) {
    const busca = req.query.busca as string | undefined;
    const incluirInativos = req.query.incluirInativos === 'true';
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;

    const pacientes = await prisma.paciente.findMany({
        where: { 
            profissional_id: req.profissionalId,
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
            profissional_id: req.profissionalId,
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
        }
    })

    return res.status(201).json(pacienteCriado);
}

export async function atualizarPaciente(req: Request, res: Response) {
    const { id } = req.params;
    const paciente = req.body;

    const { count } = await prisma.paciente.updateMany({
        where: { id, profissional_id: req.profissionalId },
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
        where: { id, profissional_id: req.profissionalId },
    })

    return res.json(pacienteAtualizado);
}

export async function desativarPaciente(req: Request, res: Response) {
    const { id } = req.params;

    const { count } = await prisma.paciente.updateMany({
        where: { id, profissional_id: req.profissionalId, ativo: true },
        data: { ativo: false },
    })

    if (count === 0) {
        const existe = await prisma.paciente.findFirst({
            where: { id, profissional_id: req.profissionalId },
            select: { ativo: true },
        })
        if (!existe) return res.status(404).json({ erro: 'Paciente não encontrado' })
        return res.status(400).json({ erro: 'Paciente já está inativo' })
    }

    return res.status(204).send();
}

export async function reativarPaciente(req: Request, res: Response) {
    const { id } = req.params;

    const { count } = await prisma.paciente.updateMany({
        where: { id, profissional_id: req.profissionalId, ativo: false },
        data: { ativo: true },
    })

    if (count === 0) {
        const existe = await prisma.paciente.findFirst({
            where: { id, profissional_id: req.profissionalId },
            select: { ativo: true },
        })
        if (!existe) return res.status(404).json({ erro: 'Paciente não encontrado' })
        return res.status(400).json({ erro: 'Paciente já está ativo' })
    }

    const pacienteReativado = await prisma.paciente.findFirst({
        where: { id, profissional_id: req.profissionalId },
    })

    return res.json(pacienteReativado);
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
                profissional_id: req.profissionalId,
                id: { not: id },
            }
        });

        if (cpfEmUso) {
            return res.status(400).json({ erro: 'CPF já está em uso' });
        }
    }

    const { count } = await prisma.paciente.updateMany({
        where: { id, profissional_id: req.profissionalId },
        data: {
            ...(cpf && { cpf }),
            ...(data_nascimento && { data_nascimento: new Date(data_nascimento) }),
        },
    })

    if (count === 0) {
        return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    const pacienteAtualizado = await prisma.paciente.findFirst({
        where: { id, profissional_id: req.profissionalId },
    })

    return res.json(pacienteAtualizado);
}