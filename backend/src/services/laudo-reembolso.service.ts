import PDFDocument from 'pdfkit'
import type { Response } from 'express'
import * as stream from 'stream'

interface EscalaAdicional {
    nome: string
    valor_inicial: number | null
    valor_atual: number | null
    data?: string
}

interface DadosLaudoReembolso {
    cidade: string
    uf: string
    data: string
    paciente_nome: string
    paciente_nascimento: string
    paciente_cpf: string
    diagnostico_medico: string
    medico_solicitante: string
    medico_solicitante_crm: string
    medico_solicitante_uf: string
    cid: string
    procedimentos: string
    total_sessoes: string
    eva_inicial: number | null
    eva_atual: number | null
    data_inicio: string
    frequencia_semanal: string
    quadro_clinico: string
    achados_exame: string
    diagnostico_funcional: string
    conclusao: string
    profissional_nome: string
    profissional_crefito: string
    codigo_tuss: string
    codigos_tuss_adicionais: { codigo: string; descricao: string; quantidade: number; valor_unitario: number }[]
    sessoes_autorizadas: number | null
    sessoes_realizadas: number | null
    periodo_tratamento_inicio: string
    periodo_tratamento_fim: string
    prognostico: string
    justificativa_continuidade: string
    valor_total: number | null
    escalas_adicionais: EscalaAdicional[]
    logo_buffer?: Buffer | null
    assinatura_buffer?: Buffer | null
    tipo_assinatura: 'DIGITAL' | 'MANUSCRITA'
}

function gerarDoc(dados: DadosLaudoReembolso) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })

    if (dados.logo_buffer) {
        try { doc.image(dados.logo_buffer, 50, 45, { width: 80 }) } catch { desenharPlaceholderLogo(doc) }
    } else { desenharPlaceholderLogo(doc) }

    doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold')
        .text('LAUDO DE REEMBOLSO — FISIOTERAPIA', 140, 50, { width: 355, align: 'center' })
    doc.fontSize(10).font('Helvetica')
        .text(`${dados.cidade}, ${dados.uf} — ${dados.data}`, 140, 70, { width: 355, align: 'center' })

    doc.undash()
    doc.moveTo(50, 105).lineTo(545, 105).stroke()
    doc.y = 115
    doc.x = 50
    doc.moveDown(0.5)

    docente(doc, 'DADOS DO PACIENTE', [
        `Paciente: ${dados.paciente_nome}`,
        `CPF: ${dados.paciente_cpf}`,
        `Data de nascimento: ${dados.paciente_nascimento}`,
        `Diagnóstico médico: ${dados.diagnostico_medico}`,
        dados.cid ? `CID: ${dados.cid}` : null,
    ])

    docente(doc, 'SOLICITAÇÃO MÉDICA', [
        `Médico solicitante: ${dados.medico_solicitante}`,
        `CRM: ${dados.medico_solicitante_crm}${dados.medico_solicitante_uf ? ` / ${dados.medico_solicitante_uf}` : ''}`,
    ])

    docente(doc, 'DADOS DO TRATAMENTO', [
        `Início: ${dados.data_inicio}`,
        dados.periodo_tratamento_fim ? `Término: ${dados.periodo_tratamento_fim}` : null,
        `Frequência: ${dados.frequencia_semanal}`,
        dados.sessoes_autorizadas !== null ? `Sessões autorizadas: ${dados.sessoes_autorizadas}` : null,
        dados.sessoes_realizadas !== null ? `Sessões realizadas: ${dados.sessoes_realizadas}` : null,
    ])

    docente(doc, 'CÓDIGOS DE PROCEDIMENTO (TUSS)', [
        dados.codigo_tuss ? `Principal: ${dados.codigo_tuss}` : null,
        ...(dados.codigos_tuss_adicionais || []).map(
            (t) => `  ${t.codigo} — ${t.descricao} (${t.quantidade}x R$ ${t.valor_unitario.toFixed(2)})`
        ),
        dados.valor_total !== null ? `Valor total: R$ ${dados.valor_total.toFixed(2)}` : null,
    ])

    if (dados.eva_inicial !== null || dados.eva_atual !== null) {
        const linhasEva = ['EVA (escala de dor 0-10):']
        if (dados.eva_inicial !== null) linhasEva.push(`  Inicial: ${dados.eva_inicial}/10`)
        if (dados.eva_atual !== null) linhasEva.push(`  Atual: ${dados.eva_atual}/10`)
        docente(doc, 'ESCALA DE DOR', linhasEva)
    }

    secao(doc, 'QUADRO CLÍNICO', dados.quadro_clinico)
    secao(doc, 'ACHADOS AO EXAME FÍSICO', dados.achados_exame)
    secao(doc, 'DIAGNÓSTICO FUNCIONAL', dados.diagnostico_funcional)
    if (dados.procedimentos) secao(doc, 'PROCEDIMENTOS REALIZADOS', dados.procedimentos)
    if (dados.prognostico) secao(doc, 'PROGNÓSTICO', dados.prognostico)
    if (dados.justificativa_continuidade) secao(doc, 'JUSTIFICATIVA PARA CONTINUIDADE', dados.justificativa_continuidade)

    secao(doc, 'CONCLUSÃO', dados.conclusao)

    doc.moveDown(2)

    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666666')
        .text('Documento emitido para fins de reembolso junto à operadora de plano de saúde.', { align: 'center' })
    doc.fillColor('#000000')

    doc.moveDown(3)

    if (dados.tipo_assinatura === 'DIGITAL' && dados.assinatura_buffer) {
        try { doc.image(dados.assinatura_buffer, 222, doc.y, { width: 150 }); doc.moveDown(3) } catch { linhaAssinatura(doc) }
    } else { linhaAssinatura(doc) }

    doc.fontSize(10).font('Helvetica-Bold').text(dados.profissional_nome, { align: 'center' })
    doc.fontSize(9).font('Helvetica').text(`CREFITO: ${dados.profissional_crefito}`, { align: 'center' })

    return doc
}

export async function gerarPDFLaudoReembolsoBuffer(dados: DadosLaudoReembolso): Promise<Buffer> {
    const doc = gerarDoc(dados)
    const chunks: Buffer[] = []
    const writable = new stream.Writable({
        write(chunk: Buffer, _enc, cb) { chunks.push(chunk); cb() },
    })
    doc.pipe(writable)
    doc.end()
    return new Promise((resolve, reject) => {
        writable.on('finish', () => resolve(Buffer.concat(chunks)))
        writable.on('error', reject)
    })
}

export async function gerarPDFLaudoReembolso(dados: DadosLaudoReembolso, res: Response) {
    const agora = new Date()
    const dataHora = [
        agora.getFullYear(),
        String(agora.getMonth() + 1).padStart(2, '0'),
        String(agora.getDate()).padStart(2, '0'),
        String(agora.getHours()).padStart(2, '0'),
        String(agora.getMinutes()).padStart(2, '0'),
    ].join('-')

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="laudo-reembolso-${dados.paciente_nome.replace(/\s+/g, '_').toLocaleLowerCase()}-${dataHora}.pdf"`)

    const doc = gerarDoc(dados)
    doc.pipe(res)
    doc.end()
}

function desenharPlaceholderLogo(doc: InstanceType<typeof PDFDocument>) {
    doc.rect(50, 45, 80, 50).dash(3, { space: 3 }).stroke('#AAAAAA')
    doc.undash()
    doc.fontSize(8).font('Helvetica').fillColor('#AAAAAA').text('LOGO', 50, 63, { width: 80, align: 'center' })
}

function secao(doc: InstanceType<typeof PDFDocument>, titulo: string, texto: string) {
    if (!texto) return
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text(titulo, { underline: true })
    doc.moveDown(0.3)
    doc.font('Helvetica').text(texto, { align: 'justify' })
    doc.moveDown(1)
}

function docente(doc: InstanceType<typeof PDFDocument>, titulo: string, linhas: (string | null)[]) {
    const filtradas = linhas.filter((l): l is string => l !== null)
    if (filtradas.length === 0) return
    doc.fontSize(10).font('Helvetica-Bold').text(titulo, { underline: true })
    doc.moveDown(0.3)
    doc.font('Helvetica')
    for (const linha of filtradas) {
        doc.text(linha)
    }
    doc.moveDown(1)
}

function linhaAssinatura(doc: InstanceType<typeof PDFDocument>) {
    doc.moveTo(150, doc.y).lineTo(445, doc.y).stroke()
    doc.moveDown(0.3)
}
