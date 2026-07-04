import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign, CheckCircle2, Clock, ChevronLeft, ChevronRight,
  TrendingUp, Users, ChevronRight as ChevronRightIcon
} from 'lucide-react'
import api from '@/services/api'

interface Resumo {
  periodo: { mes: number; ano: number }
  recebido_no_mes: number
  a_receber_no_mes: number
  total_periodo: number
  total_acumulado: number
  breakdown_por_tipo: {
    individual: { quantidade: number; valor: number }
    pacote_5: { quantidade: number; valor: number }
    pacote_10: { quantidade: number; valor: number }
  }
}

interface PacienteFinanceiro {
  paciente_id: string
  paciente_nome: string
  total_cobrado: number
  total_recebido: number
  total_pendente: number
}

const nomesMeses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function FinanceiroPage() {
  const navigate = useNavigate()
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [pacientes, setPacientes] = useState<PacienteFinanceiro[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const [resumoRes, pacientesRes] = await Promise.all([
        api.get(`/financeiro?mes=${mes}&ano=${ano}`),
        api.get(`/financeiro/pacientes?mes=${mes}&ano=${ano}`),
      ])
      setResumo(resumoRes.data)
      setPacientes(pacientesRes.data.pacientes)
    } catch {
      // silencioso
    } finally {
      setCarregando(false)
    }
  }, [mes, ano])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar()
  }, [carregar])

  function avancarMes(direcao: 1 | -1) {
    let novoMes = mes + direcao
    let novoAno = ano
    if (novoMes > 12) { novoMes = 1; novoAno++ }
    if (novoMes < 1) { novoMes = 12; novoAno-- }
    setMes(novoMes)
    setAno(novoAno)
  }

  if (carregando) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted/70 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Cabeçalho + navegação de mês */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Financeiro</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => avancarMes(-1)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-foreground min-w-32 text-center">
            {nomesMeses[mes - 1]} de {ano}
          </span>
          <button onClick={() => avancarMes(1)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            <p className="text-xs">Total do período</p>
          </div>
          <p className="text-xl font-semibold text-foreground">
            R$ {(resumo?.total_periodo || 0).toFixed(2)}
          </p>
        </div>

        <div className="bg-verde-claro/15 rounded-xl border border-verde-claro/40 p-4">
          <div className="flex items-center gap-1.5 text-green-700 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <p className="text-xs">Recebido</p>
          </div>
          <p className="text-xl font-semibold text-green-700">
            R$ {(resumo?.recebido_no_mes || 0).toFixed(2)}
          </p>
        </div>

        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <div className="flex items-center gap-1.5 text-amber-600 mb-2">
            <Clock className="w-3.5 h-3.5" />
            <p className="text-xs">A receber</p>
          </div>
          <p className="text-xl font-semibold text-amber-700">
            R$ {(resumo?.a_receber_no_mes || 0).toFixed(2)}
          </p>
        </div>

        <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
          <div className="flex items-center gap-1.5 text-primary mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <p className="text-xs">Acumulado total</p>
          </div>
          <p className="text-xl font-semibold text-primary">
            R$ {(resumo?.total_acumulado || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Breakdown por tipo de pacote */}
      {resumo && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Por tipo de pacote</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Individual', dados: resumo.breakdown_por_tipo.individual },
              { label: 'Pacote com 5 sessões', dados: resumo.breakdown_por_tipo.pacote_5 },
              { label: 'Pacote com 10 sessões', dados: resumo.breakdown_por_tipo.pacote_10 },
            ].map(({ label, dados }) => (
              <div key={label} className="text-center p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Tipo de pacote: {label}</p>
                <p className="text-sm font-semibold text-foreground">Quantidade: {dados.quantidade}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Valor: R$ {dados.valor.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista por paciente */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Por paciente</h2>
        </div>

        {pacientes.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhum movimento financeiro neste período.</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {pacientes.map((p) => (
              <button
                key={p.paciente_id}
                onClick={() => navigate(`/pacientes/${p.paciente_id}?aba=financeiro`)}
                className="flex items-center justify-between w-full px-5 py-4 hover:bg-accent transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                    {p.paciente_nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.paciente_nome}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cobrado: R$ {p.total_cobrado.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-green-700">R$ {p.total_recebido.toFixed(2)}</p>
                    {p.total_pendente > 0 && (
                      <p className="text-xs text-amber-600 mt-0.5">R$ {p.total_pendente.toFixed(2)} pendente</p>
                    )}
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
