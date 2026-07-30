import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  labelTipoPacote as labelTipo,
  precoPadraoParaTipo,
} from '@/lib/pacotes'
import type { TipoPacote, Precos } from '@/lib/pacotes'

interface FormPacote {
  tipo: TipoPacote
  valor_cobrado: string
  status_pagamento: 'AGUARDANDO' | 'PAGO'
}

interface ModalNovoPacoteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formPacote: FormPacote
  onTipoChange: (tipo: TipoPacote) => void
  onValorChange: (valor: string) => void
  onStatusChange: (status: 'AGUARDANDO' | 'PAGO') => void
  precos: Precos | null
  salvando: boolean
  onCriar: () => void
}

export function ModalNovoPacote({
  open,
  onOpenChange,
  formPacote,
  onTipoChange,
  onValorChange,
  onStatusChange,
  precos,
  salvando,
  onCriar,
}: ModalNovoPacoteProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo pacote</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['INDIVIDUAL', 'PACOTE_5', 'PACOTE_10'] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => onTipoChange(tipo)}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    formPacote.tipo === tipo
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card text-muted-foreground border-border hover:bg-accent'
                  }`}
                >
                  {labelTipo(tipo)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="valor">Valor (R$)</Label>
              {precos && (
                <span className="text-xs text-muted-foreground">
                  Padrão: R$ {Number(precoPadraoParaTipo(formPacote.tipo, precos) || 0).toFixed(2)}
                </span>
              )}
            </div>
            <Input
              id="valor"
              type="number"
              min={0}
              step={0.01}
              value={formPacote.valor_cobrado}
              onChange={(e) => onValorChange(e.target.value)}
              placeholder="0,00"
            />
            <p className="text-xs text-muted-foreground">
              Edite o valor para negociações com desconto ou acréscimo.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Pagamento</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['AGUARDANDO', 'PAGO'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => onStatusChange(status)}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    formPacote.status_pagamento === status
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card text-muted-foreground border-border hover:bg-accent'
                  }`}
                >
                  {status === 'AGUARDANDO' ? 'A receber' : 'Já pago'}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full gap-2"
            onClick={onCriar}
            disabled={salvando || !formPacote.valor_cobrado}
          >
            {salvando
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Plus className="w-4 h-4" />
            }
            {salvando ? 'Criando...' : 'Criar pacote'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
