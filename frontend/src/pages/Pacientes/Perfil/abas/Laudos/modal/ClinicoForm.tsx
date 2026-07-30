import { memo } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ConteudoBase } from '../types'

interface Props {
    conteudo: ConteudoBase
    onChange: (partial: Partial<ConteudoBase>) => void
    tipoAssinatura: 'DIGITAL' | 'MANUSCRITA'
    onChangeAssinatura: (tipo: 'DIGITAL' | 'MANUSCRITA') => void
}

const ClinicoForm = memo(function ClinicoForm({ conteudo, onChange, tipoAssinatura, onChangeAssinatura }: Props) {
    return (
        <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label>Médico solicitante</Label>
                    <input
                        value={conteudo.medico_solicitante}
                        onChange={(e) => onChange({ medico_solicitante: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Diagnóstico médico</Label>
                    <input
                        value={conteudo.diagnostico_medico}
                        onChange={(e) => onChange({ diagnostico_medico: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label>CID</Label>
                    <input
                        value={conteudo.cid}
                        onChange={(e) => onChange({ cid: e.target.value })}
                        placeholder="Ex: M54.3"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Total de sessões</Label>
                    <input
                        value={conteudo.total_sessoes}
                        onChange={(e) => onChange({ total_sessoes: e.target.value })}
                        placeholder="Ex: 10 sessões"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label>Início do tratamento</Label>
                    <input
                        value={conteudo.data_inicio}
                        onChange={(e) => onChange({ data_inicio: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Frequência semanal</Label>
                    <input
                        value={conteudo.frequencia_semanal}
                        onChange={(e) => onChange({ frequencia_semanal: e.target.value })}
                        placeholder="Ex: 3x semanais"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
            </div>

            {([
                { campo: 'quadro_clinico' as const, label: 'Quadro clínico' },
                { campo: 'achados_exame' as const, label: 'Achados ao exame físico' },
                { campo: 'diagnostico_funcional' as const, label: 'Diagnóstico funcional' },
                { campo: 'procedimentos' as const, label: 'Procedimentos realizados' },
            ]).map(({ campo, label }) => (
                <div key={campo} className="space-y-1.5">
                    <Label>{label}</Label>
                    <Textarea
                        value={String(conteudo[campo] ?? '')}
                        onChange={(e) => onChange({ [campo]: e.target.value })}
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    />
                </div>
            ))}

            {(conteudo.eva_inicial !== null || conteudo.eva_atual !== null) && (
                <div className="space-y-1.5 p-3 bg-muted rounded-lg border border-border">
                    <Label className="text-xs text-muted-foreground">Escala de dor (EVA 0-10)</Label>
                    <div className="flex gap-4 text-sm">
                        {conteudo.eva_inicial !== null && (
                            <span>Inicial: <strong>{conteudo.eva_inicial}/10</strong></span>
                        )}
                        {conteudo.eva_atual !== null && (
                            <span>Atual: <strong>{conteudo.eva_atual}/10</strong></span>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-1.5">
                <Label>Conclusão</Label>
                <Textarea
                    value={conteudo.conclusao}
                    onChange={(e) => onChange({ conclusao: e.target.value })}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
            </div>

            <div className="space-y-1.5">
                <Label>Tipo de assinatura</Label>
                <div className="grid grid-cols-2 gap-2">
                    {(['MANUSCRITA', 'DIGITAL'] as const).map((tipo) => (
                        <button
                            key={tipo}
                            type="button"
                            onClick={() => onChangeAssinatura(tipo)}
                            className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${tipoAssinatura === tipo
                                ? 'bg-primary text-white border-primary'
                                : 'bg-card text-muted-foreground border-border hover:bg-accent'
                            }`}
                        >
                            {tipo === 'MANUSCRITA' ? 'Manuscrita (espaço em branco)' : 'Digital (imagem)'}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
})

export default ClinicoForm
