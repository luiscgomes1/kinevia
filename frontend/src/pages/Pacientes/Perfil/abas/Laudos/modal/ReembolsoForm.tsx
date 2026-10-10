import { memo } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ConteudoReembolso } from '../types'
import ClinicoFormBase from './ClinicoForm'

interface Props {
    conteudo: ConteudoReembolso
    onChange: (partial: Partial<ConteudoReembolso>) => void
    tipoAssinatura: 'DIGITAL' | 'MANUSCRITA'
    onChangeAssinatura: (tipo: 'DIGITAL' | 'MANUSCRITA') => void
}

const ReembolsoForm = memo(function ReembolsoForm({ conteudo, onChange, tipoAssinatura, onChangeAssinatura }: Props) {
    function addTuss() {
        onChange({
            codigos_tuss_adicionais: [...conteudo.codigos_tuss_adicionais, { codigo: '', descricao: '' }],
        })
    }

    function removeTuss(i: number) {
        const arr = conteudo.codigos_tuss_adicionais.filter((_, idx) => idx !== i)
        onChange({ codigos_tuss_adicionais: arr })
    }

    function updateTuss(i: number, field: 'codigo' | 'descricao', value: string) {
        const arr = conteudo.codigos_tuss_adicionais.map((e, idx) =>
            idx === i ? { ...e, [field]: value } : e
        )
        onChange({ codigos_tuss_adicionais: arr })
    }

    return (
        <div className="space-y-4 pt-2">
            <ClinicoFormBase
                conteudo={conteudo}
                onChange={onChange}
                tipoAssinatura={tipoAssinatura}
                onChangeAssinatura={onChangeAssinatura}
            />

            <hr className="border-border" />

            <p className="text-sm font-semibold text-foreground">Dados do médico solicitante</p>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label>CRM</Label>
                    <input
                        value={conteudo.medico_solicitante_crm}
                        onChange={(e) => onChange({ medico_solicitante_crm: e.target.value })}
                        placeholder="Ex: 123456"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>UF</Label>
                    <input
                        value={conteudo.medico_solicitante_uf}
                        onChange={(e) => onChange({ medico_solicitante_uf: e.target.value })}
                        placeholder="Ex: SP"
                        maxLength={2}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Código TUSS</Label>
                <input
                    value={conteudo.codigo_tuss}
                    onChange={(e) => onChange({ codigo_tuss: e.target.value })}
                    placeholder="Ex: 08010010"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>TUSS adicionais</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addTuss} className="gap-1">
                        <Plus className="w-3 h-3" /> Adicionar
                    </Button>
                </div>
                {conteudo.codigos_tuss_adicionais.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                        <div className="flex-1 space-y-1">
                            <input
                                value={item.codigo}
                                onChange={(e) => updateTuss(i, 'codigo', e.target.value)}
                                placeholder="Código"
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <input
                                value={item.descricao}
                                onChange={(e) => updateTuss(i, 'descricao', e.target.value)}
                                placeholder="Descrição"
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => removeTuss(i)}
                            className="p-1.5 mt-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-destructive transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            <hr className="border-border" />

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label>Sessões autorizadas</Label>
                    <input
                        type="number"
                        value={conteudo.sessoes_autorizadas ?? ''}
                        onChange={(e) => onChange({ sessoes_autorizadas: e.target.value ? Number(e.target.value) : null })}
                        min={0}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Sessões realizadas</Label>
                    <input
                        type="number"
                        value={conteudo.sessoes_realizadas ?? ''}
                        onChange={(e) => onChange({ sessoes_realizadas: e.target.value ? Number(e.target.value) : null })}
                        min={0}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label>Período — início</Label>
                    <input
                        type="date"
                        value={conteudo.periodo_tratamento_inicio}
                        onChange={(e) => onChange({ periodo_tratamento_inicio: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Período — fim</Label>
                    <input
                        type="date"
                        value={conteudo.periodo_tratamento_fim}
                        onChange={(e) => onChange({ periodo_tratamento_fim: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label>Valor total (R$)</Label>
                <input
                    type="number"
                    value={conteudo.valor_total ?? ''}
                    onChange={(e) => onChange({ valor_total: e.target.value ? Number(e.target.value) : null })}
                    min={0}
                    step="0.01"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
            </div>

            <div className="space-y-1.5">
                <Label>Prognóstico</Label>
                <Textarea
                    value={conteudo.prognostico}
                    onChange={(e) => onChange({ prognostico: e.target.value })}
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
            </div>

            <div className="space-y-1.5">
                <Label>Justificativa para continuidade</Label>
                <Textarea
                    value={conteudo.justificativa_continuidade}
                    onChange={(e) => onChange({ justificativa_continuidade: e.target.value })}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
            </div>
        </div>
    )
})

export default ReembolsoForm
