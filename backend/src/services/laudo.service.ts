import PDFDocument from 'pdfkit'
import { Response } from 'express'
import * as stream from 'stream'

interface DadosLaudo {
    cidade: string
    uf: string
    data: string
    paciente_nome: string
    paciente_nascimento: string
    paciente_cpf: string
    diagnostico_medico: string
    medico_solicitante: string
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
    // Buffers, não URLs — PDFKit não busca imagens por HTTP, só aceita
    // caminho de arquivo local, Buffer ou data URI. Antes esses campos
    // recebiam a URL pública do Supabase Storage direto, o que sempre
    // falhava silenciosamente (caía no catch, desenhava o placeholder) —
    // bug real corrigido em 07/07/2026, ver ADR-006. Agora o controller
    // baixa o conteúdo do bucket (privado) e passa o Buffer aqui.
    logo_buffer?: Buffer | null
    assinatura_buffer?: Buffer | null
    tipo_assinatura: 'DIGITAL' | 'MANUSCRITA'
}

function gerarDoc(dados: DadosLaudo) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })

    if (dados.logo_buffer) {
        try {
            doc.image(dados.logo_buffer, 50, 45, { width: 80 })
        } catch {
            desenharPlaceholderLogo(doc)
        }
    } else {
        desenharPlaceholderLogo(doc)
    }

    doc
        .fillColor('#000000')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('LAUDO FISIOTERAPÊUTICO', 140, 50, { width: 355, align: 'center' })

    doc
        .fontSize(10)
        .font('Helvetica')
        .text(`${dados.cidade}, ${dados.uf} — ${dados.data}`, 140, 70, { width: 355, align: 'center' })

    doc.undash()
    doc.moveTo(50, 105).lineTo(545, 105).stroke()
    doc.y = 115
    doc.x = 50
    doc.moveDown(0.5)

    doc.fontSize(10).font('Helvetica-Bold').text('DADOS DO PACIENTE', { underline: true })
    doc.moveDown(0.3)
    doc.font('Helvetica')
    doc.text(`Paciente: ${dados.paciente_nome}`)
    doc.text(`CPF: ${dados.paciente_cpf}`)
    doc.text(`Data de nascimento: ${dados.paciente_nascimento}`)
    doc.text(`Diagnóstico médico: ${dados.diagnostico_medico}`)
    doc.text(`Médico solicitante: ${dados.medico_solicitante}`)
    if (dados.cid) {
        doc.text(`CID: ${dados.cid}`)
    }
    doc.text(`Início do tratamento: ${dados.data_inicio}`)
    doc.text(`Frequência semanal: ${dados.frequencia_semanal}`)
    if (dados.total_sessoes) {
        doc.text(`Total de sessões: ${dados.total_sessoes}`)
    }
    if (dados.eva_inicial !== null || dados.eva_atual !== null) {
        doc.text(`EVA (escala de dor 0-10):`)
        if (dados.eva_inicial !== null) doc.text(`  Inicial: ${dados.eva_inicial}/10`)
        if (dados.eva_atual !== null) doc.text(`  Atual: ${dados.eva_atual}/10`)
    }
    doc.moveDown(1)

    secao(doc, 'QUADRO CLÍNICO', dados.quadro_clinico)
    secao(doc, 'ACHADOS AO EXAME FÍSICO', dados.achados_exame)
    secao(doc, 'DIAGNÓSTICO FUNCIONAL', dados.diagnostico_funcional)
    if (dados.procedimentos) {
        secao(doc, 'PROCEDIMENTOS REALIZADOS', dados.procedimentos)
    }
    secao(doc, 'CONCLUSÃO', dados.conclusao)

    doc.moveDown(3)

    if (dados.tipo_assinatura === 'DIGITAL' && dados.assinatura_buffer) {
        try {
            doc.image(dados.assinatura_buffer, 222, doc.y, { width: 150 })
            doc.moveDown(3)
        } catch {
            linhaAssinatura(doc)
        }
    } else {
        linhaAssinatura(doc)
    }

    doc.fontSize(10).font('Helvetica-Bold').text(dados.profissional_nome, { align: 'center' })
    doc.fontSize(9).font('Helvetica').text(`CREFITO: ${dados.profissional_crefito}`, { align: 'center' })

    return doc
}

export async function gerarPDFLaudoBuffer(dados: DadosLaudo): Promise<Buffer> {
    const doc = gerarDoc(dados)
    const chunks: Buffer[] = []
    const writable = new stream.Writable({
        write(chunk: Buffer, _enc, cb) {
            chunks.push(chunk)
            cb()
        },
    })
    doc.pipe(writable)
    doc.end()
    return new Promise((resolve, reject) => {
        writable.on('finish', () => resolve(Buffer.concat(chunks)))
        writable.on('error', reject)
    })
}

export async function gerarPDFLaudo(dados: DadosLaudo, res: Response) {
    const agora = new Date()
    const dataHoraArquivo = [
        agora.getFullYear(),
        String(agora.getMonth() + 1).padStart(2, '0'),
        String(agora.getDate()).padStart(2, '0'),
        String(agora.getHours()).padStart(2, '0'),
        String(agora.getMinutes()).padStart(2, '0'),
    ].join('-')

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
        'Content-Disposition',
        `attachment; filename="laudo-${dados.paciente_nome.replace(/\s+/g, '_').toLocaleLowerCase()}-${dataHoraArquivo}.pdf"`
    )

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
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text(titulo, { underline: true })
    doc.moveDown(0.3)
    doc.font('Helvetica').text(texto, { align: 'justify' })
    doc.moveDown(1)
}

function linhaAssinatura(doc: InstanceType<typeof PDFDocument>) {
    doc.moveTo(150, doc.y).lineTo(445, doc.y).stroke()
    doc.moveDown(0.3)
}
