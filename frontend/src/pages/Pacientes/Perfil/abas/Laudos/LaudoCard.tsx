import { memo } from 'react'
import { FileText, Download, Pencil, Trash2 } from 'lucide-react'
import type { Laudo } from './types'
import { TIPO_ROTULO, TIPO_COR } from './types'

function formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

interface Props {
    laudo: Laudo
    onEditar: (id: string) => void
    onBaixarPDF: (laudo: Laudo) => void
    onBaixarDeclaracao: (id: string) => void
    onExcluir: (laudo: Laudo) => void
}

const LaudoCard = memo(function LaudoCard({ laudo, onEditar, onBaixarPDF, onBaixarDeclaracao, onExcluir }: Props) {
    return (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <div>
                    <p className="text-sm font-medium text-foreground">
                        Laudo fisioterapêutico — {TIPO_ROTULO[laudo.tipo] ?? laudo.tipo}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span>{formatarData(laudo.criado_em)}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${TIPO_COR[laudo.tipo] ?? ''}`}>
                            {laudo.tipo}
                        </span>
                        <span>· {laudo.tipo_assinatura === 'DIGITAL' ? 'Assinatura digital' : 'Assinatura manuscrita'}</span>
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1">
                {laudo.tipo === 'REEMBOLSO' && (
                    <button
                        onClick={() => onBaixarDeclaracao(laudo.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-emerald-600 transition-colors"
                        title="Declaração de sessões"
                    >
                        <FileText className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={() => onEditar(laudo.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    title="Editar laudo"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onBaixarPDF(laudo)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
                    title="Baixar PDF"
                >
                    <Download className="w-4 h-4" />
                </button>
                {!laudo.pdf_path && (
                    <button
                        onClick={() => onExcluir(laudo)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-destructive transition-colors"
                        title="Excluir laudo (ainda não virou arquivo)"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    )
})

export default LaudoCard
