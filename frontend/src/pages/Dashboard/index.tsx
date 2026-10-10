import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays, XCircle, CheckCircle2, DollarSign, Wallet, UserPlus, FileText,
  Loader2, ArrowRight, CalendarPlus, Clock, ClipboardList, ArrowUp, ArrowDown, BarChart3, Info,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { toast } from 'sonner'
import api from '@/services/api'
import { useProfissional } from '@/hooks/useProfissional'
import { useProfissionais } from '@/hooks/useProfissionais'
import { formatarDataISO } from '@/lib/data'
import type { TipoSessao } from '@/types/api'

interface ResumoHoje {
  total: number
  compareceu: number
  faltou: number
  taxaFaltas: number
  ontem: { total: number; faltou: number; taxaFaltas: number }
}

interface ResumoMes {
  total: number
  compareceu: number
  faltou: number
  pacientesAtivos: number
  comparecimento: number
  novosPacientes: number
  totalPacientes: number
  laudosMes: number
  faturamentoEstimado?: number
  recebidoMes?: number
  aReceberMes?: number
}

interface ItemProximo {
  data: string
  horario: string
  slot: number
  tipo: TipoSessao
  paciente_id: string
  paciente_nome: string
}

interface ResumoDashboard {
  hoje: ResumoHoje
  mes: ResumoMes
  proximos: ItemProximo[]
  semAvaliacao?: { total: number; lista: { id: string; nome: string }[] }
  pagamentosAguardando?: { total: number; lista: { paciente_id: string; paciente_nome: string; valor: number }[] }
  chart: {
    sessoes30Dias: { dia: string; quantidade: number }[]
    faturamentoMensal?: { mes: string; estimado: number; recebido: number }[]
  }
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

function formatarDataHoje(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function rotuloTipo(tipo: TipoSessao): string {
  if (tipo === 'AVALIACAO') return 'Avaliação'
  if (tipo === 'REPOSICAO') return 'Reposição'
  return 'Sessão'
}

function Delta({ atual, anterior, invertido = false }: { atual: number; anterior: number; invertido?: boolean }) {
  if (anterior === 0) return null
  const dif = atual - anterior
  if (dif === 0) return <span className="text-xs text-muted-foreground ml-1.5">igual a ontem</span>
  const positivo = dif > 0
  const bom = invertido ? !positivo : positivo
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ml-1.5 ${bom ? 'text-green-600' : 'text-red-600'}`}>
      {positivo ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(dif)} vs ontem
    </span>
  )
}

function rotuloDia(dataISO: string, hojeISO: string, amanhaISO: string): string {
  if (dataISO === hojeISO) return 'Hoje'
  if (dataISO === amanhaISO) return 'Amanhã'
  const d = new Date(`${dataISO}T12:00:00`)
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  return `${dias[d.getDay()]} · ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
}

function formatarMesCurto(m: string): string {
  const [ano, mes] = m.split('-')
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${meses[parseInt(mes) - 1]}/${ano}`
}

function formatarDiaCurto(dia: string): string {
  return `${dia.slice(8, 10)}/${dia.slice(5, 7)}`
}

const Dashboard = () => {
  const { profissional } = useProfissional()
  const podeFiltrar = profissional && (profissional.role === 'ADMIN' || profissional.role === 'SUPER_ADMIN')
  const role = profissional?.role as string | undefined
  const podeVerFinanceiro = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const podeVerAvaliacao = role === 'ADMIN' || role === 'PROFISSIONAL' || role === 'SUPER_ADMIN'

  const [profissionalFiltroId, setProfissionalFiltroId] = useState('')
  const [resumo, setResumo] = useState<ResumoDashboard | null>(null)
  const [carregando, setCarregando] = useState(true)
  const { profissionais } = useProfissionais({ habilitado: podeFiltrar === true })

  const hoje = new Date()
  const hojeISO = formatarDataISO(hoje)
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)
  const amanhaISO = formatarDataISO(amanha)

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      await Promise.resolve()
      if (cancelado) return
      setCarregando(true)
      try {
        const params = new URLSearchParams({ data: hojeISO })
        if (profissionalFiltroId) params.set('profissional_id', profissionalFiltroId)
        const res = await api.get(`/dashboard/resumo?${params.toString()}`)
        if (cancelado) return
        setResumo(res.data)
      } catch {
        if (!cancelado) toast.error('Não foi possível carregar o dashboard.')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    })()
    return () => { cancelado = true }
  }, [profissionalFiltroId, hojeISO])

  const gruposDia = (resumo?.proximos ?? []).reduce<{ data: string; itens: ItemProximo[] }[]>((acc, item) => {
    const grupo = acc.find((g) => g.data === item.data)
    if (grupo) grupo.itens.push(item)
    else acc.push({ data: item.data, itens: [item] })
    return acc
  }, [])

  const pagamentos = podeVerFinanceiro ? resumo?.pagamentosAguardando : undefined
  const semAvaliacao = podeVerAvaliacao ? resumo?.semAvaliacao : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{formatarDataHoje()}</p>
        </div>
        {podeFiltrar && profissionais.length > 0 && (
          <div className="flex flex-col items-end gap-1">
            <select
              value={profissionalFiltroId}
              onChange={(e) => setProfissionalFiltroId(e.target.value)}
              className="h-8 px-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Toda a clínica</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
            <p className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs text-foreground/70">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Selecione um funcionário ou mantenha "Toda a clínica"
            </p>
          </div>
        )}
      </div>

      {carregando ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {resumo?.hoje.total ?? 0}
                    <Delta atual={resumo?.hoje.total ?? 0} anterior={resumo?.hoje.ontem.total ?? 0} />
                  </p>
                  <p className="text-xs text-muted-foreground">Agendamentos hoje</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {resumo?.hoje.faltou ?? 0}
                    <Delta invertido atual={resumo?.hoje.faltou ?? 0} anterior={resumo?.hoje.ontem.faltou ?? 0} />
                  </p>
                  <p className="text-xs text-muted-foreground">Faltas hoje ({resumo?.hoje.taxaFaltas ?? 0}%)</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold">{resumo?.mes.comparecimento ?? 0}%</p>
                  <p className="text-xs text-muted-foreground">Comparecimento no mês</p>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full ${(resumo?.mes.comparecimento ?? 0) >= 80 ? 'bg-emerald-500' : (resumo?.mes.comparecimento ?? 0) >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(resumo?.mes.comparecimento ?? 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{resumo?.mes.novosPacientes ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Novos pacientes no mês</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {resumo?.mes.totalPacientes ?? 0} ativos na base
                  </p>
                </div>
              </div>
            </div>

            {podeVerFinanceiro && (
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatarMoeda(resumo?.mes.faturamentoEstimado ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">Faturamento estimado (mês)</p>
                  </div>
                </div>
              </div>
            )}

            {podeVerFinanceiro && (
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatarMoeda(resumo?.mes.recebidoMes ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">Recebido no mês</p>
                  </div>
                </div>
              </div>
            )}

            {podeVerFinanceiro && (
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatarMoeda(resumo?.mes.aReceberMes ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">A receber (mês)</p>
                  </div>
                </div>
              </div>
            )}

            {podeVerAvaliacao && (
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-sky-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{resumo?.mes.laudosMes ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Laudos no mês</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Próximos agendamentos */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-muted-foreground" />
                Próximos agendamentos
              </h2>
              <Link to="/agenda" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                Ver agenda completa
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {resumo && resumo.proximos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum agendamento marcado nos próximos dias.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {gruposDia.map((grupo) => (
                  <div key={grupo.data} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      {rotuloDia(grupo.data, hojeISO, amanhaISO)}
                    </p>
                    <div className="space-y-2">
                      {grupo.itens.map((item) => (
                        <div key={`${item.data}-${item.paciente_id}-${item.horario}-${item.slot}`} className="flex items-center gap-3">
                          <span className="text-xs font-semibold [font-variant-numeric:tabular-nums] text-muted-foreground w-12 shrink-0">
                            {item.horario}
                          </span>
                          <Link to={`/pacientes/${item.paciente_id}`} className="text-sm font-medium text-foreground hover:underline truncate min-w-0">
                            {item.paciente_nome}
                          </Link>
                          <span className="text-xs text-muted-foreground ml-auto shrink-0">
                            {rotuloTipo(item.tipo)} · Vaga {item.slot}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Precisa de atenção */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {podeVerFinanceiro && (
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold flex items-center gap-2 text-amber-700">
                    <Clock className="w-4 h-4" />
                    Pagamentos aguardando
                  </h2>
                  <Link to="/financeiro" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                    Ir ao financeiro
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {pagamentos && pagamentos.lista.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum pagamento pendente. Tudo em dia!</p>
                ) : (
                  <>
                    <div className="divide-y divide-border">
                      {pagamentos?.lista.map((p) => (
                        <div key={p.paciente_id} className="flex items-center gap-3 py-2.5">
                          <Link to={`/pacientes/${p.paciente_id}`} className="text-sm font-medium text-foreground hover:underline truncate min-w-0">
                            {p.paciente_nome}
                          </Link>
                          <span className="text-sm font-semibold [font-variant-numeric:tabular-nums] ml-auto shrink-0">
                            {formatarMoeda(p.valor)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {pagamentos && pagamentos.total > 5 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        +{pagamentos.total - 5} outros aguardando pagamento
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {podeVerAvaliacao && (
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold flex items-center gap-2 text-blue-700">
                    <ClipboardList className="w-4 h-4" />
                    Avaliação inicial pendente
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {semAvaliacao?.total ?? 0} paciente(s)
                  </span>
                </div>

                {semAvaliacao && semAvaliacao.total === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum paciente aguardando avaliação inicial.
                  </p>
                ) : (
                  <>
                    <div className="divide-y divide-border">
                      {semAvaliacao?.lista.map((p) => (
                        <Link key={p.id} to={`/pacientes/${p.id}`} className="flex items-center gap-3 py-2.5 group">
                          <span className="text-sm font-medium text-foreground group-hover:underline truncate min-w-0">
                            {p.nome}
                          </span>
                          <span className="text-xs text-primary ml-auto shrink-0">Preencher prontuário</span>
                        </Link>
                      ))}
                    </div>
                    {semAvaliacao && semAvaliacao.total > 5 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        +{semAvaliacao.total - 5} outros pacientes
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resumo && resumo.chart.sessoes30Dias.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  Sessões nos últimos 30 dias
                </h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={resumo.chart.sessoes30Dias}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="dia" tickFormatter={formatarDiaCurto} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={(d) => formatarDiaCurto(String(d))} />
                    <Bar dataKey="quantidade" fill="#0d9488" radius={[4, 4, 0, 0]} name="Sessões" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {podeVerFinanceiro && resumo?.chart.faturamentoMensal && (
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    Faturamento (6 meses)
                  </h2>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-teal-600" /> Estimado</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500" /> Recebido</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={resumo.chart.faturamentoMensal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mes" tickFormatter={formatarMesCurto} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                    <Tooltip formatter={(v) => formatarMoeda(Number(v))} labelFormatter={(m) => formatarMesCurto(String(m))} />
                    <Bar dataKey="estimado" fill="#0d9488" radius={[4, 4, 0, 0]} name="Estimado" />
                    <Bar dataKey="recebido" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Recebido" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard