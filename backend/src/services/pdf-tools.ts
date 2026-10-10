import type PDFDocument from 'pdfkit'

type Doc = InstanceType<typeof PDFDocument>

export function qualificarDor(valor: number): string {
    if (valor <= 0) return 'sem dor'
    if (valor <= 3) return 'leve'
    if (valor <= 6) return 'moderada'
    return 'intensa'
}

export function desenharTabelaEVA(doc: Doc, inicial: number | null, atual: number | null) {
    const linhas: [string, string][] = []
    if (inicial !== null) {
        linhas.push(['Inicial', `${inicial}/10 (${qualificarDor(inicial)})`])
    }
    if (atual !== null) {
        linhas.push(['Atual', `${atual}/10 (${qualificarDor(atual)})`])
    }
    if (linhas.length === 0) return

    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold')
        .text('ESCALA DE DOR — EVA (0-10)', { underline: true })
    doc.moveDown(0.3)

    const largColuna1 = 80
    const larguraTotal = 265
    const x = 60
    const alturaLinha = 18
    let y = doc.y

    for (const [rotulo, valor] of linhas) {
        doc.rect(x, y, larguraTotal, alturaLinha).stroke()
        doc.moveTo(x + largColuna1, y).lineTo(x + largColuna1, y + alturaLinha).stroke()
        doc.font('Helvetica-Bold').fontSize(9).text(rotulo, x + 6, y + 4)
        doc.font('Helvetica').fontSize(9).text(valor, x + largColuna1 + 6, y + 4, {
            width: larguraTotal - largColuna1 - 12,
        })
        y += alturaLinha
    }

    doc.y = y
    doc.moveDown(1)
}