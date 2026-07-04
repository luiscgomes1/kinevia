import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, Clock, DollarSign, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import api from '@/services/api'

interface Pacote {
  id: string
  tipo: 'INDIVIDUAL' | 'PACOTE_5' | 'PACOTE_10'
  valor_cobrado: number
  status_pagamento: 'AGUARDANDO' | 'PAGO'
  pago_em: string | null
  criado_em: string
  sessoes_total: number
}

interface ResumoFinanceiro {
  paciente_id: string
  paciente_nome: string
  total_cobrado: number
  total_recebido: number
  total_pendente: number
  pacotes: Pacote[]
}

function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function labelTipo(tipo: Pacote['tipo']): string {
  const map = { INDIVIDUAL: 'Individual', PACOTE_5: 'Pacote 5', PACOTE_10: 'Pacote 10' }
  return map[tipo]
}

interface Props {
  pacienteId: string
}

export default function FinanceiroTab({ pacienteId }: Props) {
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    try {
      const response = await api.get('/financeiro/pacientes')
      const lista: ResumoFinanceiro[] = response.data.pacientes
      const paciente = lista.find((p) => p.paciente_id === pacienteId)
      setResumo(paciente || null)
    } catch {
      // silencioso
    } finally {
      setCarregando(false)
    }
  }, [pacienteId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar()
  }, [carregar])

  if (carregando) {
    return (
      <div className="space-y-3 py-4">
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/70 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!resumo || resumo.pacotes.length === 0) {
    return (
      <div className="text-center py-10">
        <DollarSign className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Nenhum registro financeiro para este paciente.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total cobrado</p>
          <p className="text-lg font-semibold text-foreground">
            R$ {resumo.total_cobrado.toFixed(2)}
          </p>
        </div>
        <div className="bg-verde-claro/15 rounded-xl border border-verde-claro/40 p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3 h-3 text-green-700" />
            <p className="text-xs text-green-700">Recebido</p>
          </div>
          <p className="text-lg font-semibold text-green-700">
            R$ {resumo.total_recebido.toFixed(2)}
          </p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <p className="text-xs text-amber-600">Pendente</p>
          </div>
          <p className="text-lg font-semibold text-amber-700">
            R$ {resumo.total_pendente.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Lista de pacotes */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Histórico de pacotes</h3>
        <div className="space-y-2">
          {resumo.pacotes.map((pacote) => (
            <div
              key={pacote.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card"
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {labelTipo(pacote.tipo)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatarData(pacote.criado_em)}
                    {pacote.pago_em && ` · Pago em ${formatarData(pacote.pago_em)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">
                  R$ {Number(pacote.valor_cobrado).toFixed(2)}
                </span>
                {pacote.status_pagamento === 'PAGO' ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Pago
                  </Badge>
                ) : (
                  <Badge variant="warning" className="gap-1">
                    <Clock className="w-3 h-3" />
                    Pendente
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
