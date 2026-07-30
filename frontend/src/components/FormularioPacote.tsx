import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TipoPacote, StatusPagamento, Precos } from '@/types/api'
import { labelTipoPacote, precoPadraoParaTipo } from '@/lib/pacotes'

export interface ValorFormularioPacote {
  tipo: TipoPacote
  valor_cobrado: string
  status_pagamento: StatusPagamento
}

interface Props {
  valor: ValorFormularioPacote
  precos: Precos | null
  onChange: (novoValor: ValorFormularioPacote) => void
  /** id do <Input> de valor — precisa ser único quando o formulário aparece mais de uma vez na mesma página (ex: dois modais na Agenda) */
  idValor?: string
}

/**
 * Formulário de tipo + valor + pagamento de um pacote. Extraído porque o
 * mesmo bloco existia, quase idêntico, em Sessoes.tsx e duas vezes em
 * Agenda/index.tsx — ver Diagnostico-Tecnico.md, Bloco 1.
 */
export function FormularioPacote({ valor, precos, onChange, idValor = 'valor_pacote' }: Props) {
  function handleTipoChange(tipo: TipoPacote) {
    onChange({ ...valor, tipo, valor_cobrado: precoPadraoParaTipo(tipo, precos) })
  }

  return (
    <>
      <div className="space-y-1.5">
        <Label>Tipo</Label>
        <div className="grid grid-cols-3 gap-2">
          {(['INDIVIDUAL', 'PACOTE_5', 'PACOTE_10'] as const).map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => handleTipoChange(tipo)}
              className={`py-2 px-2 sm:px-3 rounded-lg border text-xs font-medium transition-colors ${
                valor.tipo === tipo
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-muted-foreground border-border hover:bg-accent'
              }`}
            >
              {labelTipoPacote(tipo)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={idValor}>Valor (R$)</Label>
          {precos && (
            <span className="text-xs text-muted-foreground">
              Padrão: R$ {Number(precoPadraoParaTipo(valor.tipo, precos) || 0).toFixed(2)}
            </span>
          )}
        </div>
        <Input
          id={idValor}
          type="number"
          min={0}
          step={0.01}
          value={valor.valor_cobrado}
          onChange={(e) => onChange({ ...valor, valor_cobrado: e.target.value })}
          placeholder="0,00"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Pagamento</Label>
        <div className="grid grid-cols-2 gap-2">
          {(['AGUARDANDO', 'PAGO'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onChange({ ...valor, status_pagamento: status })}
              className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                valor.status_pagamento === status
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-muted-foreground border-border hover:bg-accent'
              }`}
            >
              {status === 'AGUARDANDO' ? 'A receber' : 'Já pago'}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
