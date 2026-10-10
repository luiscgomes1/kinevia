import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import type { Role } from '../../generated/client';
import { sendEmail, isEmailConfigured, montarHtmlConvite } from '../services/email';
import { notificarAdminsDaClinica } from '../services/notificacao.service';

function roleHierarchy(role: Role): number {
  const map: Record<Role, number> = { SUPER_ADMIN: 3, ADMIN: 2, PROFISSIONAL: 1, ATENDENTE: 0 }
  return map[role] ?? 0
}

export async function listarUsuarios(req: Request, res: Response) {
  const { papel } = req.query;

  const where: any = {};

  if (req.role !== 'SUPER_ADMIN') {
    where.clinica_id = req.clinicaId;
  }

  if (papel && ['SUPER_ADMIN', 'ADMIN', 'PROFISSIONAL', 'ATENDENTE'].includes(papel as string)) {
    where.role = papel;
  }

  const usuarios = await prisma.profissional.findMany({
    where,
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      crefito: true,
      cidade: true,
      uf: true,
      senha_temporaria: true,
      criado_em: true,
    },
    orderBy: { criado_em: 'desc' },
  });

  res.json(usuarios);
}

export async function buscarUsuario(req: Request, res: Response) {
  const { id } = req.params;

  const usuario = await prisma.profissional.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      crefito: true,
      cidade: true,
      uf: true,
      clinica_id: true,
      senha_temporaria: true,
      criado_em: true,
    },
  });

  if (!usuario) {
    res.status(404).json({ erro: 'Usuário não encontrado.' });
    return;
  }

  if (req.role !== 'SUPER_ADMIN' && usuario.clinica_id !== req.clinicaId) {
    res.status(403).json({ erro: 'Acesso negado.' });
    return;
  }

  res.json(usuario);
}

export async function criarUsuario(req: Request, res: Response) {
  const { nome, email, crefito, cidade, uf, papel } = req.body;

  if (req.role !== 'SUPER_ADMIN') {
    if (papel === 'SUPER_ADMIN' || papel === 'ADMIN') {
      res.status(403).json({ erro: 'Você não pode criar usuários com este papel.' });
      return;
    }
  }

  if (req.role !== 'SUPER_ADMIN' && !req.clinicaId) {
    res.status(400).json({ erro: 'Usuário sem clínica. Contate o suporte.' });
    return;
  }

  const existente = await prisma.profissional.findUnique({
    where: { email },
  });

  if (existente) {
    res.status(409).json({ erro: 'Já existe um usuário com este email.' });
    return;
  }

  const senhaTemporaria = crypto.randomUUID().slice(0, 12) + 'Ab1!';
  const senha_hash = await bcrypt.hash(senhaTemporaria, 10);

  const clinicaId = req.role === 'SUPER_ADMIN' ? req.body.clinica_id ?? req.clinicaId : req.clinicaId;

  const usuario = await prisma.profissional.create({
    data: {
      nome,
      email,
      senha_hash,
      role: papel ?? 'PROFISSIONAL',
      clinica_id: clinicaId,
      crefito: crefito ?? '',
      cidade: cidade ?? '',
      uf: uf ?? 'SP',
      senha_temporaria: true,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      senha_temporaria: true,
    },
  });

  if (usuario.role !== 'SUPER_ADMIN' && clinicaId) {
    await notificarAdminsDaClinica(
      clinicaId,
      'NOVO_PROFISSIONAL',
      'Novo membro na equipe',
      `${usuario.nome} foi adicionado como ${usuario.role === 'ATENDENTE' ? 'atendente' : 'profissional'}.`,
      [req.profissionalId!, usuario.id],
    );
  }

  if (isEmailConfigured()) {
    const html = montarHtmlConvite(usuario.nome, usuario.email, senhaTemporaria);
    const enviado = await sendEmail(usuario.email, 'Seu acesso ao Kinevia', html);
    if (enviado) {
      logger.info({ email: usuario.email }, 'Email de convite enviado');
      res.status(201).json({
        ...usuario,
        email_enviado: true,
      });
      return;
    }
  }

  logger.warn(
    { email: usuario.email },
    'Email não configurado — senha temporária exposta na resposta como última alternativa',
  );

  res.status(201).json({
    ...usuario,
    email_enviado: false,
    senha_temporaria: senhaTemporaria,
  });
}

export async function atualizarUsuario(req: Request, res: Response) {
  const { id } = req.params;
  const { nome, email, crefito, cidade, uf, papel } = req.body;

  const usuario = await prisma.profissional.findUnique({
    where: { id },
    select: { id: true, clinica_id: true, role: true },
  });

  if (!usuario) {
    res.status(404).json({ erro: 'Usuário não encontrado.' });
    return;
  }

  if (req.role !== 'SUPER_ADMIN' && usuario.clinica_id !== req.clinicaId) {
    res.status(403).json({ erro: 'Acesso negado.' });
    return;
  }

  if (papel && req.role !== 'SUPER_ADMIN') {
    if (papel === 'SUPER_ADMIN' || papel === 'ADMIN') {
      res.status(403).json({ erro: 'Você não pode alterar o papel para este nível.' });
      return;
    }
    if (roleHierarchy(papel as Role) > roleHierarchy(req.role as Role)) {
      res.status(403).json({ erro: 'Você não pode atribuir um papel superior ao seu.' });
      return;
    }
  }

  if (email && email !== (await prisma.profissional.findUnique({ where: { id }, select: { email: true } }))?.email) {
    const existente = await prisma.profissional.findUnique({ where: { email } });
    if (existente) {
      res.status(409).json({ erro: 'Email já está em uso.' });
      return;
    }
  }

  const atualizado = await prisma.profissional.update({
    where: { id },
    data: {
      ...(nome !== undefined && { nome }),
      ...(email !== undefined && { email }),
      ...(crefito !== undefined && { crefito }),
      ...(cidade !== undefined && { cidade }),
      ...(uf !== undefined && { uf }),
      ...(papel !== undefined && { role: papel }),
    },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      crefito: true,
      cidade: true,
      uf: true,
      senha_temporaria: true,
    },
  });

  res.json(atualizado);
}

export async function removerUsuario(req: Request, res: Response) {
  const { id } = req.params;

  if (id === req.profissionalId) {
    res.status(400).json({ erro: 'Você não pode remover a si mesmo.' });
    return;
  }

  const usuario = await prisma.profissional.findUnique({
    where: { id },
    select: { id: true, clinica_id: true, role: true },
  });

  if (!usuario) {
    res.status(404).json({ erro: 'Usuário não encontrado.' });
    return;
  }

  if (req.role !== 'SUPER_ADMIN' && usuario.clinica_id !== req.clinicaId) {
    res.status(403).json({ erro: 'Acesso negado.' });
    return;
  }

  if (req.role !== 'SUPER_ADMIN' && usuario.role === 'ADMIN') {
    res.status(403).json({ erro: 'Você não pode remover um administrador.' });
    return;
  }

  await prisma.profissional.delete({ where: { id } });

  res.json({ mensagem: 'Usuário removido com sucesso.' });
}

export async function reenviarConvite(req: Request, res: Response) {
  const { id } = req.params;

  const usuario = await prisma.profissional.findUnique({
    where: { id },
    select: { id: true, clinica_id: true, role: true, email: true, nome: true },
  });

  if (!usuario) {
    res.status(404).json({ erro: 'Usuário não encontrado.' });
    return;
  }

  if (req.role !== 'SUPER_ADMIN' && usuario.clinica_id !== req.clinicaId) {
    res.status(403).json({ erro: 'Acesso negado.' });
    return;
  }

  const novaSenha = crypto.randomUUID().slice(0, 12) + 'Ab1!';
  const senha_hash = await bcrypt.hash(novaSenha, 10);

  await prisma.profissional.update({
    where: { id },
    data: {
      senha_hash,
      senha_temporaria: true,
      token_version: { increment: 1 },
    },
  });

  if (isEmailConfigured()) {
    const html = montarHtmlConvite(usuario.nome, usuario.email, novaSenha);
    const enviado = await sendEmail(usuario.email, 'Seu acesso ao Kinevia', html);
    if (enviado) {
      logger.info({ email: usuario.email }, 'Email de convite reenviado');
      res.json({
        mensagem: 'Senha temporária gerada e enviada por email.',
        email: usuario.email,
        email_enviado: true,
      });
      return;
    }
  }

  logger.warn(
    { email: usuario.email },
    'Email não configurado — senha temporária exposta na resposta como última alternativa',
  );

  res.json({
    mensagem: 'Senha temporária gerada.',
    email: usuario.email,
    email_enviado: false,
    senha_temporaria: novaSenha,
  });
}
