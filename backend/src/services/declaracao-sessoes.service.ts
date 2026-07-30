import PDFDocument from 'pdfkit'
import type { Response } from 'express'
import * as stream from 'stream'

interface DadosDeclaracao {
    paciente_nome: string
    paciente_cpf: string
    profissional_nome: string
    profissional_crefito: string
    sessoes: {
        data: string
        horario: string
        procedimento: string
        status: string
    }[]
    total_sessoes: number
}

function gerarDoc(dados: DadosDeclaracao) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })

    doc.fillColor('#000000').fontSize(16).font('Helvetica-Bold')
        .text('DECLARAÇÃO DE SESSÕES REALIZADAS', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(10).font('Helvetica')
        .text('Para fins de reembolso junto à operadora de plano de saúde', { align: 'center' })
    doc.moveDown(1)

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(0.5)

    doc.fontSize(10).font('Helvetica')
    doc.text(`Paciente: ${dados.paciente_nome}`)
    doc.text(`CPF: ${dados.paciente_cpf}`)
    doc.text(`Profissional: ${dados.profissional_nome}`)
    doc.text(`CREFITO: ${dados.profissional_crefito}`)
    doc.moveDown(1)

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(0.5)

    if (dados.sessoes.length === 0) {
        doc.text('Nenhuma sessão registrada no período.')
    } else {
        // Tabela
        const colunas = [
            { x: 50, label: 'Data', w: 90 },
            { x: 140, label: 'Horário', w: 70 },
            { x: 210, label: 'Procedimento', w: 220 },
            { x: 430, label: 'Status', w: 115 },
        ]

        // Cabeçalho
        doc.font('Helvetica-Bold').fontSize(9)
        for (const col of colunas) {
            doc.text(col.label, col.x, doc.y, { width: col.w })
        }
        doc.moveDown(0.3)

        // Linha separadora
        const yInicio = doc.y
        doc.moveTo(50, yInicio).lineTo(545, yInicio).stroke()
        doc.y = yInicio + 4

        // Dados
        doc.font('Helvetica').fontSize(9)
        for (const sessao of dados.sessoes) {
            const yLinha = doc.y
            doc.text(sessao.data, 50, yLinha, { width: 90 })
            doc.text(sessao.horario, 140, yLinha, { width: 70 })
            doc.text(sessao.procedimento, 210, yLinha, { width: 220 })
            doc.text(sessao.status, 430, yLinha, { width: 115 })
            doc.moveDown(0.5)
        }

        doc.moveDown(0.5)
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
        doc.moveDown(0.5)

        doc.font('Helvetica-Bold').fontSize(10)
        doc.text(`Total de sessões declaradas: ${dados.total_sessoes}`)
    }

    doc.moveDown(4)

    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666666')
        .text('Declaro, para os devidos fins, que as sessões acima foram realizadas sob minha responsabilidade profissional.', { align: 'center' })

    doc.fillColor('#000000')
    doc.moveDown(4)
    doc.fontSize(10).font('Helvetica')
    doc.text('___________________________________', { align: 'center' })
    doc.moveDown(0.3)
    doc.font('Helvetica-Bold').text(dados.profissional_nome, { align: 'center' })
    doc.fontSize(9).font('Helvetica').text(`CREFITO: ${dados.profissional_crefito}`, { align: 'center' })

    return doc
}

export async function gerarDeclaracaoSessoesBuffer(dados: DadosDeclaracao): Promise<Buffer> {
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

export async function gerarDeclaracaoSessoes(dados: DadosDeclaracao, res: Response) {
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="declaracao-sessoes-${dados.paciente_nome.replace(/\s+/g, '_').toLocaleLowerCase()}.pdf"`)

    const doc = gerarDoc(dados)
    doc.pipe(res)
    doc.end()
}
