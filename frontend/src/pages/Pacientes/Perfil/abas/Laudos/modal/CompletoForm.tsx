import { memo } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ConteudoCompleto } from '../types'
import ClinicoFormBase from './ClinicoForm'
import CifPicker from './CifPicker'

interface Props {
    conteudo: ConteudoCompleto
    onChange: (partial: Partial<ConteudoCompleto>) => void
    tipoAssinatura: 'DIGITAL' | 'MANUSCRITA'
    onChangeAssinatura: (tipo: 'DIGITAL' | 'MANUSCRITA') => void
}

const CompletoForm = memo(function CompletoForm({ conteudo, onChange, tipoAssinatura, onChangeAssinatura }: Props) {
    function addEscala() {
        onChange({
            escalas_adicionais: [...conteudo.escalas_adicionais, { nome: '', resultado: '' }],
        })
    }

    function removeEscala(i: number) {
        const arr = conteudo.escalas_adicionais.filter((_, idx) => idx !== i)
        onChange({ escalas_adicionais: arr })
    }

    function updateEscala(i: number, field: 'nome' | 'resultado', value: string) {
        const arr = conteudo.escalas_adicionais.map((e, idx) =>
            idx === i ? { ...e, [field]: value } : e
        )
        onChange({ escalas_adicionais: arr })
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

            <p className="text-sm font-semibold text-foreground">Classificação Internacional de Funcionalidade (CIF)</p>

            <CifPicker
                cifs={conteudo.cifs}
                onChange={(cifs) => onChange({ cifs })}
            />

            <hr className="border-border" />

            <div className="space-y-1.5">
                <Label>Metas do tratamento</Label>
                <Textarea
                    value={conteudo.metas_tratamento}
                    onChange={(e) => onChange({ metas_tratamento: e.target.value })}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
            </div>

            <div className="space-y-1.5">
                <Label>Critérios de alta</Label>
                <Textarea
                    value={conteudo.criterios_alta}
                    onChange={(e) => onChange({ criterios_alta: e.target.value })}
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
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

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Escalas adicionais</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addEscala} className="gap-1">
                        <Plus className="w-3 h-3" /> Adicionar
                    </Button>
                </div>
                {conteudo.escalas_adicionais.map((escala, i) => (
                    <div key={i} className="flex gap-2 items-start">
                        <div className="flex-1 space-y-1">
                            <input
                                value={escala.nome}
                                onChange={(e) => updateEscala(i, 'nome', e.target.value)}
                                placeholder="Nome da escala"
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <input
                                value={escala.resultado}
                                onChange={(e) => updateEscala(i, 'resultado', e.target.value)}
                                placeholder="Resultado"
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => removeEscala(i)}
                            className="p-1.5 mt-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-destructive transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
})

export default CompletoForm
