import { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { getSupabase, STORAGE_BUCKET, gerarUrlAssinada, removerArquivo } from '../lib/supabase';
import { validarImagemBuffer } from '../middlewares/upload.middleware';

// Ver ADR-006: bucket privado desde 07/07/2026. O banco guarda só o
// *caminho* do arquivo (assinatura_path/logo_path), nunca uma URL — a URL
// assinada é gerada sob demanda, a cada requisição, e expira.

const CONTENT_TYPE_POR_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}

export async function uploadAssinatura(req: Request, res: Response) {
  // Suporta remoção (o frontend já chama isso, mas o backend nunca tratou — bug real corrigido junto)
  if (req.body?.remover === true || req.body?.remover === 'true') {
    return removerImagem(req, res, 'assinatura_path')
  }

  if (!req.file) {
    res.status(400).json({ erro: 'Nenhuma imagem enviada.' });
    return;
  }

  if (!validarImagemBuffer(req.file.buffer, req.file.originalname)) {
    res.status(400).json({ erro: 'Arquivo inválido. Envie uma imagem PNG, JPG, GIF ou WebP válida.' });
    return;
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const fileName = `assinaturas/${req.profissionalId}_${crypto.randomBytes(8).toString('hex')}${ext}`;

  const supabase = getSupabase()
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, req.file.buffer, {
      contentType: CONTENT_TYPE_POR_EXT[ext] ?? req.file.mimetype,
      upsert: true,
    });

  if (error) {
    logger.error({ error }, 'Erro ao fazer upload da assinatura para Supabase Storage');
    res.status(500).json({ erro: 'Erro ao salvar imagem.' });
    return;
  }

  try {
    await prisma.profissional.update({
      where: { id: req.profissionalId },
      data: { assinatura_path: fileName },
    });
  } catch (dbError) {
    await removerArquivo(fileName).catch(() => undefined);
    logger.error({ error: dbError }, 'Erro ao atualizar assinatura no banco — blob removido');
    res.status(500).json({ erro: 'Erro ao salvar imagem.' });
    return;
  }

  const url = await gerarUrlAssinada(fileName)

  logger.info({ profissionalId: req.profissionalId }, 'Assinatura atualizada no Supabase Storage');

  res.json({ url, mensagem: 'Assinatura salva com sucesso.' });
}

export async function uploadLogo(req: Request, res: Response) {
  if (req.body?.remover === true || req.body?.remover === 'true') {
    return removerImagem(req, res, 'logo_path')
  }

  if (!req.file) {
    res.status(400).json({ erro: 'Nenhuma imagem enviada.' });
    return;
  }

  if (!validarImagemBuffer(req.file.buffer, req.file.originalname)) {
    res.status(400).json({ erro: 'Arquivo inválido. Envie uma imagem PNG, JPG, GIF ou WebP válida.' });
    return;
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const fileName = `logos/${req.profissionalId}_${crypto.randomBytes(8).toString('hex')}${ext}`;

  const supabase = getSupabase()
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, req.file.buffer, {
      contentType: CONTENT_TYPE_POR_EXT[ext] ?? req.file.mimetype,
      upsert: true,
    });

  if (error) {
    logger.error({ error }, 'Erro ao fazer upload da logo para Supabase Storage');
    res.status(500).json({ erro: 'Erro ao salvar imagem.' });
    return;
  }

  try {
    await prisma.profissional.update({
      where: { id: req.profissionalId },
      data: { logo_path: fileName },
    });
  } catch (dbError) {
    await removerArquivo(fileName).catch(() => undefined);
    logger.error({ error: dbError }, 'Erro ao atualizar a logo no banco — blob removido');
    res.status(500).json({ erro: 'Erro ao salvar imagem.' });
    return;
  }

  const url = await gerarUrlAssinada(fileName)

  logger.info({ profissionalId: req.profissionalId }, 'Logo atualizada no Supabase Storage');

  res.json({ url, mensagem: 'Logo salva com sucesso.' });
}

async function removerImagem(req: Request, res: Response, campo: 'assinatura_path' | 'logo_path') {
  const profissional = await prisma.profissional.findUnique({
    where: { id: req.profissionalId },
    select: { [campo]: true },
  }) as Record<string, string | null> | null

  const caminhoAtual = profissional?.[campo]

  if (caminhoAtual) {
    const removido = await removerArquivo(caminhoAtual)
    if (!removido) {
      logger.warn({ path: caminhoAtual }, 'Falha ao remover arquivo do storage — prosseguindo com atualização do BD')
    }
  }

  await prisma.profissional.update({
    where: { id: req.profissionalId },
    data: { [campo]: null },
  })

  res.json({ mensagem: 'Imagem removida com sucesso.' })
}
