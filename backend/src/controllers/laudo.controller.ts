import { Request, Response } from 'express'
import crypto from 'crypto'
import prisma from '../lib/prisma'
import { gerarPDFLaudoBuffer } from '../services/laudo.service'
import { gerarPDFLaudoCompletoBuffer } from '../services/laudo-completo.service'
import { gerarPDFLaudoReembolsoBuffer } from '../services/laudo-reembolso.service'
import { gerarDeclaracaoSessoesBuffer } from '../services/declaracao-sessoes.service'
import { getSupabase, STORAGE_BUCKET, baixarArquivo, removerArquivo } from '../lib/supabase'
import { registrarAudit } from '../lib/audit'
import { wherePaciente, whereLaudo, whereAgendamento } from '../lib/escopo'
import logger from '../lib/logger'

function formatarData(data: Date | string): string {
    const d = new Date(data)
    return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function formatarDataISO(data: Date | string): string {
    const d = new Date(data)
    return d.toISOString().split('T')[0]
}

function formatarDataTratamento(valor: string): string {
    // Guarda em ISO (YYYY-MM-DD, origem: input date ou criado_em do prontuário);
    // exibe em formato brasileiro, como as demais datas do PDF.
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        const [ano, mes, dia] = valor.split('-')
        return `${dia}/${mes}/${ano}`
    }
    return valor
}

const CAMPOS_EDITAVEIS_CLINICO = ['quadro_clinico', 'achados_exame', 'diagnostico_funcional', 'conclusao', 'cid', 'procedimentos', 'total_sessoes', 'frequencia_semanal'] as const

const CAMPOS_EDITAVEIS_COMPLETO = [...CAMPOS_EDITAVEIS_CLINICO, 'cifs', 'metas_tratamento', 'criterios_alta', 'prognostico', 'escalas_adicionais'] as const

const CAMPOS_EDITAVEIS_REEMBOLSO = [...CAMPOS_EDITAVEIS_CLINICO, 'medico_solicitante_crm', 'medico_solicitante_uf', 'codigo_tuss', 'codigos_tuss_adicionais', 'sessoes_autorizadas', 'sessoes_realizadas', 'periodo_tratamento_inicio', 'periodo_tratamento_fim', 'prognostico', 'justificativa_continuidade', 'valor_total'] as const

export async function criarLaudo(req: Request, res: Response) {
    const { id: paciente_id } = req.params
    const tipo = (req.query.tipo as string) || req.body.tipo || 'CLINICO'

    const paciente = await prisma.paciente.findFirst({
        where: { id: paciente_id, ...wherePaciente(req), deleted_at: null }
    })

    if (!paciente) {
        return res.status(404).json({ erro: 'Paciente não encontrado' })
    }

    const prontuario = await prisma.prontuario.findUnique({
        where: { paciente_id }
    })

    if (!prontuario) {
        return res.status(400).json({
            erro: 'É necessário preencher a avaliação inicial antes de gerar um laudo.'
        })
    }

    const ultimaEvolucao = await prisma.evolucao.findFirst({
        where: { prontuario: { paciente_id } },
        orderBy: { criado_em: 'desc' },
    })

    const conteudo = {
        quadro_clinico: prontuario.hda || 'Não informado',
        achados_exame: prontuario.avaliacao_fisica || 'Não informado',
        diagnostico_funcional: prontuario.diagnostico_fisio || 'Não informado',
        conclusao: '',
        diagnostico_medico: prontuario.diagnostico_medico || 'Não informado',
        medico_solicitante: prontuario.medico_solicitante || 'Não informado',
        data_inicio: formatarDataISO(prontuario.criado_em),
        frequencia_semanal: 'Não informado',
        cid: '',
        procedimentos: '',
        total_sessoes: '',
        cpf_paciente: paciente.cpf,
        eva_inicial: prontuario.dor_eva ?? null,
        eva_atual: ultimaEvolucao?.dor_eva ?? null,
    }

    const laudo = await prisma.laudo.create({
        data: {
            paciente_id,
            profissional_id: req.profissionalId!,
            clinica_id: paciente.clinica_id,
            tipo: tipo as 'CLINICO' | 'COMPLETO' | 'REEMBOLSO',
            conteudo,
            tipo_assinatura: req.body.tipo_assinatura || 'MANUSCRITA',
        }
    })

    registrarAudit(req.profissionalId!, 'LAUDO_CRIADO', paciente_id, { tipo });

    return res.status(201).json(laudo)
}

export async function listarLaudos(req: Request, res: Response) {
    const { id: paciente_id } = req.params
    const tipo = req.query.tipo as string | undefined

    const paciente = await prisma.paciente.findFirst({
        where: { id: paciente_id, ...wherePaciente(req), deleted_at: null }
    })

    if (!paciente) {
        return res.status(404).json({ erro: 'Paciente não encontrado' })
    }

    const where: Record<string, unknown> = { paciente_id, ...whereLaudo(req) }
    if (tipo) where.tipo = tipo

    const laudos = await prisma.laudo.findMany({
        where: where as any,
        orderBy: { criado_em: 'desc' },
        select: {
            id: true,
            tipo: true,
            conteudo: true,
            tipo_assinatura: true,
            pdf_path: true,
            criado_em: true,
        }
    })

    return res.json(laudos)
}

export async function buscarLaudo(req: Request, res: Response) {
    const { id } = req.params

    const laudo = await prisma.laudo.findFirst({
        where: { id, ...whereLaudo(req) },
        include: {
            paciente: {
                select: { id: true, nome: true, data_nascimento: true }
            }
        }
    })

    if (!laudo) {
        return res.status(404).json({ erro: 'Laudo não encontrado' })
    }

    registrarAudit(req.profissionalId!, 'LAUDO_VISUALIZADO', laudo.paciente_id)

    return res.json(laudo)
}

export async function editarLaudo(req: Request, res: Response) {
    const { id } = req.params
    const { conteudo, tipo_assinatura } = req.body

    const laudo = await prisma.laudo.findFirst({
        where: { id, ...whereLaudo(req) },
        select: { tipo: true, conteudo: true, paciente_id: true }
    })

    if (!laudo) {
        return res.status(404).json({ erro: 'Laudo não encontrado' })
    }

    const camposEditaveis = laudo.tipo === 'COMPLETO' ? CAMPOS_EDITAVEIS_COMPLETO
        : laudo.tipo === 'REEMBOLSO' ? CAMPOS_EDITAVEIS_REEMBOLSO
            : CAMPOS_EDITAVEIS_CLINICO

    const conteudoEditado: Record<string, unknown> = {}
    for (const campo of camposEditaveis) {
        if (conteudo?.[campo] !== undefined) {
            conteudoEditado[campo] = conteudo[campo]
        }
    }

    const { count } = await prisma.laudo.updateMany({
        where: { id, ...whereLaudo(req) },
        data: {
            conteudo: { ...(laudo.conteudo as object), ...conteudoEditado },
            ...(tipo_assinatura && { tipo_assinatura }),
        }
    })

    if (count === 0) {
        return res.status(404).json({ erro: 'Laudo não encontrado' })
    }

    registrarAudit(req.profissionalId!, 'LAUDO_EDITADO', laudo.paciente_id, { laudo_id: id, tipo: laudo.tipo })

    const laudoAtualizado = await prisma.laudo.findFirst({
        where: { id, ...whereLaudo(req) },
    })

    return res.json(laudoAtualizado)
}

export async function excluirLaudo(req: Request, res: Response) {
    const { id } = req.params

    const laudo = await prisma.laudo.findFirst({
        where: { id, ...whereLaudo(req) },
        select: { id: true, pdf_path: true, paciente_id: true, tipo: true },
    })

    if (!laudo) {
        return res.status(404).json({ erro: 'Laudo não encontrado' })
    }

    if (laudo.pdf_path) {
        return res.status(409).json({
            erro: 'Este laudo já foi salvo como arquivo na clínica. Não é possível excluí-lo.',
        })
    }

    await prisma.laudo.delete({ where: { id } })

    registrarAudit(req.profissionalId!, 'LAUDO_EXCLUIDO', laudo.paciente_id, { laudo_id: id, tipo: laudo.tipo })

    return res.json({ mensagem: 'Laudo excluído com sucesso' })
}

async function montarDadosLaudo(laudo: any) {
    const conteudo = laudo.conteudo as Record<string, unknown>

    const [logoBuffer, assinaturaBuffer] = await Promise.all([
        laudo.profissional.logo_path ? baixarArquivo(laudo.profissional.logo_path) : null,
        laudo.profissional.assinatura_path ? baixarArquivo(laudo.profissional.assinatura_path) : null,
    ])

    return {
        cidade: laudo.profissional.cidade,
        uf: laudo.profissional.uf,
        data: formatarData(new Date()),
        paciente_nome: laudo.paciente.nome,
        paciente_nascimento: formatarData(laudo.paciente.data_nascimento),
        paciente_cpf: (conteudo.cpf_paciente as string) || 'Não informado',
        diagnostico_medico: (conteudo.diagnostico_medico as string) || 'Não informado',
        medico_solicitante: (conteudo.medico_solicitante as string) || 'Não informado',
        cid: (conteudo.cid as string) || '',
        data_inicio: formatarDataTratamento((conteudo.data_inicio as string) || 'Não informado'),
        data_fim: formatarDataTratamento((conteudo.data_fim as string) || ''),
        frequencia_semanal: (conteudo.frequencia_semanal as string) || 'Não informado',
        total_sessoes: (conteudo.total_sessoes as string) || '',
        quadro_clinico: (conteudo.quadro_clinico as string) || 'Não informado',
        achados_exame: (conteudo.achados_exame as string) || 'Não informado',
        diagnostico_funcional: (conteudo.diagnostico_funcional as string) || 'Não informado',
        procedimentos: (conteudo.procedimentos as string) || '',
        eva_inicial: (conteudo.eva_inicial as number | null) ?? null,
        eva_atual: (conteudo.eva_atual as number | null) ?? null,
        conclusao: (conteudo.conclusao as string) || 'Não informado',
        profissional_nome: laudo.profissional.nome,
        profissional_crefito: laudo.profissional.crefito,
        assinatura_buffer: assinaturaBuffer,
        tipo_assinatura: laudo.tipo_assinatura,
        logo_buffer: logoBuffer,
    }
}

function converterCifsLegado(c: Record<string, unknown>) {
    const grupos: [string, string][] = [
        ['cif_funcao', 'FUNCOES'],
        ['cif_estrutura', 'ESTRUTURAS'],
        ['cif_atividade', 'ATIVIDADES'],
        ['cif_participacao', 'ATIVIDADES'],
        ['cif_contextual', 'AMBIENTAIS'],
    ]
    const itens: { codigo: string; descricao: string; componente: string }[] = []
    for (const [campo, componente] of grupos) {
        const texto = typeof c[campo] === 'string' ? (c[campo] as string) : ''
        const codigos = texto.match(/[bsde]\d{2,3}(?:\.\d+)?/gi) ?? []
        for (const codigo of codigos) {
            const cd = codigo.toLowerCase()
            if (itens.some((i) => i.codigo === cd)) continue
            itens.push({ codigo: cd, descricao: '', componente })
        }
    }
    return itens
}

async function montarDadosLaudoCompleto(laudo: any) {
    const base = await montarDadosLaudo(laudo)
    const conteudo = laudo.conteudo as Record<string, unknown>

    const cifs = Array.isArray(conteudo.cifs)
        ? (conteudo.cifs as { codigo: string; descricao?: string; componente?: string }[]).map((i) => ({
            codigo: i.codigo,
            descricao: i.descricao ?? '',
            componente: i.componente ?? 'ATIVIDADES',
        }))
        : converterCifsLegado(conteudo)

    return {
        ...base,
        cifs,
        metas_tratamento: (conteudo.metas_tratamento as string) || '',
        criterios_alta: (conteudo.criterios_alta as string) || '',
        prognostico: (conteudo.prognostico as string) || '',
        escalas_adicionais: (conteudo.escalas_adicionais as any[]) || [],
    }
}

async function montarDadosLaudoReembolso(laudo: any) {
    const base = await montarDadosLaudo(laudo)
    const conteudo = laudo.conteudo as Record<string, unknown>

    return {
        ...base,
        medico_solicitante_crm: (conteudo.medico_solicitante_crm as string) || '',
        medico_solicitante_uf: (conteudo.medico_solicitante_uf as string) || '',
        codigo_tuss: (conteudo.codigo_tuss as string) || '',
        codigos_tuss_adicionais: (conteudo.codigos_tuss_adicionais as any[]) || [],
        sessoes_autorizadas: (conteudo.sessoes_autorizadas as number | null) ?? null,
        sessoes_realizadas: (conteudo.sessoes_realizadas as number | null) ?? null,
        periodo_tratamento_inicio: formatarDataTratamento((conteudo.periodo_tratamento_inicio as string) || ''),
        periodo_tratamento_fim: formatarDataTratamento((conteudo.periodo_tratamento_fim as string) || ''),
        prognostico: (conteudo.prognostico as string) || '',
        justificativa_continuidade: (conteudo.justificativa_continuidade as string) || '',
        valor_total: (conteudo.valor_total as number | null) ?? null,
        escalas_adicionais: [],
    }
}

async function salvarPDFStorage(laudo: any, pdfBuffer: Buffer): Promise<string | null> {
    const fileName = `laudos/${laudo.paciente.id}_${laudo.id}_${crypto.randomBytes(4).toString('hex')}.pdf`

    try {
        const supabase = getSupabase()
        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true,
            })

        if (error) {
            logger.error({ error }, 'Erro ao fazer upload do PDF para Supabase Storage')
            return null
        }

        await prisma.laudo.update({
            where: { id: laudo.id },
            data: { pdf_path: fileName },
        })

        if (laudo.pdf_path) {
            await removerArquivo(laudo.pdf_path)
        }

        return fileName
    } catch (err) {
        logger.error({ err }, 'Erro ao salvar PDF no storage')
        return null
    }
}

async function servirPDF(req: Request, res: Response, pdfBuffer: Buffer, nomeBase: string) {
    const nomeArquivo = `${nomeBase}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`)
    res.send(pdfBuffer)
}

export async function gerarPDF(req: Request, res: Response) {
    const { id } = req.params

    const laudo = await prisma.laudo.findFirst({
        where: { id, ...whereLaudo(req) },
        include: {
            paciente: { select: { nome: true, data_nascimento: true, id: true } },
            profissional: {
                select: {
                    nome: true, crefito: true, cidade: true, uf: true,
                    assinatura_path: true, logo_path: true,
                }
            }
        }
    })

    if (!laudo) {
        return res.status(404).json({ erro: 'Laudo não encontrado' })
    }

    registrarAudit(req.profissionalId!, 'LAUDO_PDF_GERADO', laudo.paciente_id, { laudo_id: id, tipo: laudo.tipo })

    if (laudo.pdf_path) {
        const bufferExistente = await baixarArquivo(laudo.pdf_path)
        if (bufferExistente) {
            const nomeArquivo = `laudo-${laudo.paciente.nome.replace(/\s+/g, '_').toLocaleLowerCase()}.pdf`
            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`)
            res.send(bufferExistente)
            return
        }
    }

    let pdfBuffer: Buffer
    const nomeBase = `laudo-${laudo.paciente.nome.replace(/\s+/g, '_').toLocaleLowerCase()}`

    switch (laudo.tipo) {
        case 'COMPLETO': {
            const dados = await montarDadosLaudoCompleto(laudo)
            pdfBuffer = await gerarPDFLaudoCompletoBuffer(dados)
            break
        }
        case 'REEMBOLSO': {
            const dados = await montarDadosLaudoReembolso(laudo)
            pdfBuffer = await gerarPDFLaudoReembolsoBuffer(dados)
            break
        }
        default: {
            const dados = await montarDadosLaudo(laudo)
            pdfBuffer = await gerarPDFLaudoBuffer(dados)
        }
    }

    salvarPDFStorage(laudo, pdfBuffer)
    await servirPDF(req, res, pdfBuffer, nomeBase)
}

export async function gerarDeclaracaoSessoes(req: Request, res: Response) {
    const { id } = req.params

    const laudo = await prisma.laudo.findFirst({
        where: { id, ...whereLaudo(req), tipo: 'REEMBOLSO' },
        include: {
            paciente: { select: { nome: true, cpf: true } },
            profissional: { select: { nome: true, crefito: true } },
        }
    })

    if (!laudo) {
        return res.status(404).json({ erro: 'Laudo de reembolso não encontrado' })
    }

    const sessoes = await prisma.agendamento.findMany({
        where: {
            paciente_id: laudo.paciente_id,
            ...whereAgendamento(req),
            status: 'COMPARECEU',
        },
        orderBy: { data: 'desc' },
        take: 100,
        select: {
            data: true,
            horario: true,
            status: true,
        }
    })

    const dados = {
        paciente_nome: laudo.paciente.nome,
        paciente_cpf: laudo.paciente.cpf,
        profissional_nome: laudo.profissional.nome,
        profissional_crefito: laudo.profissional.crefito,
        sessoes: sessoes.map((s) => ({
            data: formatarData(s.data),
            horario: s.horario,
            procedimento: 'Sessão de fisioterapia',
            status: s.status === 'COMPARECEU' ? 'Compareceu' : s.status,
        })),
        total_sessoes: sessoes.length,
    }

    const pdfBuffer = await gerarDeclaracaoSessoesBuffer(dados)
    const nomeArquivo = `declaracao-sessoes-${laudo.paciente.nome.replace(/\s+/g, '_').toLocaleLowerCase()}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`)
    res.send(pdfBuffer)
}
