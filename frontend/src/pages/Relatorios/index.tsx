import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { Users, CalendarCheck, CalendarX, AlertTriangle, CalendarRange, DollarSign, Activity, ArrowUp, ArrowDown, Info } from 'lucide-react'
import { toast } from 'sonner'
import api, { exibirErro } from '@/services/api'
import { formatarDataISO } from '@/lib/data'
import { useProfissional } from '@/hooks/useProfissional'
import { useProfissionais } from '@/hooks/useProfissionais'

interface ResumoPeriodo {
  periodo: { inicio: string; fim: string }
  total: number
  compareceu: number
  faltou: number
  desmarcou: number
  taxaFaltas: number
  pacientesAtivos: number
  sessoesPorMes: { mes: string; quantidade: number }[]
  faturamentoEstimado?: number
  evolucaoEva: { data: string; eva: number }[]
}

interface Comparativo {
  periodo: { inicio: string; fim: string }
  periodoAnterior: { inicio: string; fim: string }
  atual: { total: number; compareceu: number; faltou: number; desmarcou: number }
  anterior: { total: number; compareceu: number; faltou: number; desmarcou: number }
  variacao: { total: number; compareceu: number; faltou: number; desmarcou: number }
}

function formatarValor(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatarMes(m: string): string {
  const [ano, mes] = m.split('-')
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${meses[parseInt(mes) - 1]}/${ano}`
}

function VariacaoBadge({ valor }: { valor: number }) {
  if (valor === 0) return null
  const positivo = valor > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ml-1.5 ${positivo ? 'text-red-600' : 'text-green-600'}`}>
      {positivo ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(valor)}%
    </span>
  )
}

export default function RelatoriosPage() {
  const { profissional } = useProfissional()
  const hoje = new Date()
  const [inicio, setInicio] = useState(() => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    return formatarDataISO(d)
  })
  const [fim, setFim] = useState(() => formatarDataISO(hoje))
  const [dados, setDados] = useState<ResumoPeriodo | null>(null)
  const [comparativo, setComparativo] = useState<Comparativo | null>(null)
  const [carregando, setCarregando] = useState(false)
const [profissionalFiltro, setProfissionalFiltro] = useState('')

  const podeFiltrarProfissional = profissional?.role === 'ADMIN' || profissional?.role === 'SUPER_ADMIN'

  const { profissionais } = useProfissionais({ habilitado: podeFiltrarProfissional })

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      await Promise.resolve()
      if (cancelado) return
      setCarregando(true)
      try {
        const params = new URLSearchParams({ inicio, fim })
        if (profissionalFiltro) params.set('profissional_id', profissionalFiltro)
        const [resumoRes, compRes] = await Promise.all([
          api.get(`/relatorios/resumo?${params}`),
          api.get(`/relatorios/comparativo?${params}`),
        ])
        if (cancelado) return
        setDados(resumoRes.data)
        setComparativo(compRes.data)
      } catch (err) {
        if (!cancelado) toast.error(exibirErro(err, 'Erro ao carregar relatório.'))
      } finally {
        if (!cancelado) setCarregando(false)
      }
    })()
    return () => { cancelado = true }
  }, [inicio, fim, profissionalFiltro])

  if (carregando) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted/70 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            {podeFiltrarProfissional && (
              <div className="flex flex-col gap-1">
                <label htmlFor="filtro-profissional" className="text-xs font-semibold text-foreground/70">Funcionário</label>
                <select
                  id="filtro-profissional"
                  value={profissionalFiltro}
                  onChange={(e) => setProfissionalFiltro(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">Todos os profissionais</option>
                  {profissionais.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label htmlFor="periodo-inicio" className="text-xs font-semibold text-foreground/70">Período</label>
              <div className="flex items-center gap-2">
                <input
                  id="periodo-inicio"
                  type="date"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                />
                <span className="text-xs text-muted-foreground">até</span>
                <input
                  id="periodo-fim"
                  type="date"
                  value={fim}
                  onChange={(e) => setFim(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                />
              </div>
            </div>
          </div>
          <p className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs text-foreground/70">
            <Info className="w-3.5 h-3.5 shrink-0" />
            {podeFiltrarProfissional && 'Selecione um funcionário para ver os relatórios dele. '}
            Escolha o período (data inicial e final) para gerar os dados.
          </p>
        </div>
      </div>

      {dados ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-verde-claro/15 rounded-xl border border-verde-claro/40 p-4">
              <div className="flex items-center gap-1.5 text-green-700 mb-2">
                <CalendarCheck className="w-3.5 h-3.5" />
                <p className="text-xs">Compareceram</p>
              </div>
              <p className="text-xl font-semibold text-green-700">{dados.compareceu}</p>
            </div>

            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <div className="flex items-center gap-1.5 text-red-600 mb-2">
                <CalendarX className="w-3.5 h-3.5" />
                <p className="text-xs">Faltaram</p>
              </div>
              <p className="text-xl font-semibold text-red-700">{dados.faltou}</p>
            </div>

            <div className={`rounded-xl border p-4 ${dados.taxaFaltas > 20 ? 'bg-red-50 border-red-200' : dados.taxaFaltas > 10 ? 'bg-amber-50 border-amber-200' : 'bg-verde-claro/15 border-verde-claro/40'}`}>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className={`w-3.5 h-3.5 ${dados.taxaFaltas > 20 ? 'text-red-600' : dados.taxaFaltas > 10 ? 'text-amber-600' : 'text-green-700'}`} />
                <p className={`text-xs ${dados.taxaFaltas > 20 ? 'text-red-600' : dados.taxaFaltas > 10 ? 'text-amber-600' : 'text-green-700'}`}>Taxa de faltas</p>
              </div>
              <p className={`text-xl font-semibold ${dados.taxaFaltas > 20 ? 'text-red-700' : dados.taxaFaltas > 10 ? 'text-amber-700' : 'text-green-700'}`}>{dados.taxaFaltas}%</p>
            </div>

            <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
              <div className="flex items-center gap-1.5 text-primary mb-2">
                <Users className="w-3.5 h-3.5" />
                <p className="text-xs">Pacientes ativos</p>
              </div>
              <p className="text-xl font-semibold text-primary">{dados.pacientesAtivos}</p>
            </div>

            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                <CalendarRange className="w-3.5 h-3.5" />
                <p className="text-xs">Desmarcaram</p>
              </div>
              <p className="text-xl font-semibold text-foreground">{dados.desmarcou}</p>
            </div>

            {dados.faturamentoEstimado !== undefined && (
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  <p className="text-xs">Faturamento estimado</p>
                </div>
                <p className="text-xl font-semibold text-foreground">R$ {formatarValor(dados.faturamentoEstimado)}</p>
              </div>
            )}
          </div>

          {comparativo && (
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Comparativo com período anterior</h2>
                <span className="text-xs text-muted-foreground">
                  {comparativo.periodoAnterior.inicio} ~ {comparativo.periodoAnterior.fim}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold">{comparativo.atual.total}
                    <VariacaoBadge valor={comparativo.variacao.total} />
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-600">Compareceram</p>
                  <p className="text-lg font-semibold text-green-700">{comparativo.atual.compareceu}
                    <VariacaoBadge valor={comparativo.variacao.compareceu} />
                  </p>
                </div>
                <div>
                  <p className="text-xs text-red-600">Faltaram</p>
                  <p className="text-lg font-semibold text-red-700">{comparativo.atual.faltou}
                    <VariacaoBadge valor={comparativo.variacao.faltou} />
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Desmarcaram</p>
                  <p className="text-lg font-semibold">{comparativo.atual.desmarcou}
                    <VariacaoBadge valor={comparativo.variacao.desmarcou} />
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dados.sessoesPorMes.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">Sessões por mês</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dados.sessoesPorMes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mes" tickFormatter={formatarMes} tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={(m) => formatarMes(String(m))} />
                    <Bar dataKey="quantidade" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {dados.evolucaoEva.length > 1 && (
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
                  <Activity className="w-4 h-4" />
                  <h2 className="text-sm font-semibold text-foreground">Evolução EVA (dor)</h2>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={dados.evolucaoEva}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="eva" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {dados.sessoesPorMes.length === 0 && dados.evolucaoEva.length === 0 && (
            <div className="bg-card rounded-xl border border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">Nenhum dado encontrado no período selecionado.</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
