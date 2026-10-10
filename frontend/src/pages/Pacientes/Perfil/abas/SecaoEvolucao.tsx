import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EscalaDor } from '@/components/ui/escala-dor'
import { Plus, Save, Loader2, Clock, PencilLine } from 'lucide-react'
import { useState } from 'react'
import type { Evolucao } from './Prontuario'

function formatarDataHora(data: string): string {
  return new Date(data).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

const CORES_EVA: Record<number, string> = {
  0: 'text-green-600', 1: 'text-green-500', 2: 'text-lime-600',
  3: 'text-yellow-600', 4: 'text-yellow-600', 5: 'text-orange-500',
  6: 'text-orange-600', 7: 'text-red-500', 8: 'text-red-600',
  9: 'text-red-700', 10: 'text-red-800',
}

interface Props {
  evolucoes: Evolucao[]
  novaEvolucao: string
  onNovaEvolucaoChange: (valor: string) => void
  novaEva: number | null
  onNovaEvaChange: (valor: number | null) => void
  salvandoEvolucao: boolean
  mostrarForm: boolean
  onToggleForm: () => void
  onSalvarEvolucao: () => void
  onCancelarEvolucao?: () => void
  onCorrigirEvolucao: (evolucaoId: string, correcaoTexto: string) => Promise<void>
}

export default function SecaoEvolucao({
  evolucoes, novaEvolucao, onNovaEvolucaoChange,
  novaEva, onNovaEvaChange,
  salvandoEvolucao, mostrarForm, onToggleForm,
  onSalvarEvolucao, onCancelarEvolucao, onCorrigirEvolucao
}: Props) {
  const [corrigindoId, setCorrigindoId] = useState<string | null>(null)
  const [correcaoTexto, setCorrecaoTexto] = useState('')
  const [salvandoCorrecao, setSalvandoCorrecao] = useState(false)

  async function handleSalvarCorrecao(evolucaoId: string) {
    if (!correcaoTexto.trim()) return
    setSalvandoCorrecao(true)
    try {
      await onCorrigirEvolucao(evolucaoId, correcaoTexto.trim())
      setCorrigindoId(null)
      setCorrecaoTexto('')
    } catch {
      // erro já tratado no pai — mantém o formulário aberto
    } finally {
      setSalvandoCorrecao(false)
    }
  }
  return (
    <>
      {/* Divisor */}
      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">Evolução</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleForm}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova entrada
          </Button>
        </div>

        {mostrarForm && (
          <div className="mb-5 space-y-3 p-4 bg-muted rounded-lg border border-border">
            <EscalaDor
              value={novaEva}
              onChange={(v) => onNovaEvaChange(v)}
              label="Dor atual (EVA 0-10)"
            />
            <Label>Registro de evolução</Label>
            <Textarea
              value={novaEvolucao}
              onChange={(e) => onNovaEvolucaoChange(e.target.value)}
              rows={4}
              placeholder="Descreva a evolução da sessão de hoje..."
              className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              autoFocus
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                size="sm"
                disabled={salvandoEvolucao || !novaEvolucao.trim()}
                onClick={onSalvarEvolucao}
                className="gap-1.5"
              >
                {salvandoEvolucao
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Save className="w-3.5 h-3.5" />
                }
                {salvandoEvolucao ? 'Salvando...' : 'Salvar entrada'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onCancelarEvolucao ?? (() => { onNovaEvolucaoChange(''); onToggleForm() })}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {evolucoes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma evolução registrada ainda.
          </p>
        )}

        <div className="space-y-3">
          {[...evolucoes].reverse().map((ev) => (
            <div key={ev.id} className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {formatarDataHora(ev.criado_em)}
                </div>
                {ev.dor_eva !== null && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${CORES_EVA[ev.dor_eva] ?? 'text-muted-foreground'} bg-muted`}>
                    EVA {ev.dor_eva}/10
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {ev.texto}
              </p>
              {ev.correcao_texto ? (
                <div className="mt-2 pt-2 border-t border-amber-200 bg-amber-50 rounded px-2 py-1.5">
                  <p className="text-xs text-amber-600 font-medium mb-0.5">
                    Correção — {formatarDataHora(ev.correcao_em!)}
                  </p>
                  <p className="text-xs text-amber-700">{ev.correcao_texto}</p>
                </div>
              ) : corrigindoId === ev.id ? (
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={correcaoTexto}
                    onChange={(e) => setCorrecaoTexto(e.target.value)}
                    rows={2}
                    placeholder="Descreva a correção do registro..."
                    className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={salvandoCorrecao || !correcaoTexto.trim()}
                      onClick={() => { void handleSalvarCorrecao(ev.id) }}
                      className="gap-1.5"
                    >
                      {salvandoCorrecao ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      {salvandoCorrecao ? 'Salvando...' : 'Salvar correção'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => { setCorrigindoId(null); setCorrecaoTexto('') }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setCorrigindoId(ev.id); setCorrecaoTexto('') }}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 hover:underline transition-colors"
                >
                  <PencilLine className="w-3.5 h-3.5" />
                  Corrigir registro
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
