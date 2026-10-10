/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { toast } from 'sonner'
import { formatarDataISO } from '@/lib/data'
import api from '@/services/api'
import { useProfissional } from '@/hooks/useProfissional'
import { useProfissionais } from '@/hooks/useProfissionais'

export interface Paciente {
  id: string
  nome: string
}

type StatusAgendamento = 'AGENDADO' | 'COMPARECEU' | 'FALTOU' | 'DESMARCOU'

export interface Agendamento {
  id: string
  paciente: Paciente
  status: StatusAgendamento
  tipo: 'AVALIACAO' | 'SESSAO' | 'REPOSICAO'
}

interface SlotGrade {
  slot: number
  agendamento: Agendamento | null
}

interface Horario {
  horario: string
  slots: SlotGrade[]
}

export interface GradeAgenda {
  data: string
  profissional_nome?: string
  horarios: Horario[]
}

type Visao = 'diaria' | 'semanal' | 'mensal'

export interface TriggerAgendamentoRapido {
  data: Date
  horario: string
  slot: number
}

interface AgendaContextType {
  dataSelecionada: Date
  setDataSelecionada: (date: Date) => void
  grade: GradeAgenda | null
  carregando: boolean
  ehHoje: boolean
  visao: Visao
  setVisao: (visao: Visao) => void
  mesSelecionado: Date
  navegarMes: (direcao: 1 | -1) => void
  diasComAgendamento: number[]
  carregandoResumo: boolean
  atualizandoStatus: string | null
  atualizarStatus: (agendamentoId: string, status: 'COMPARECEU' | 'FALTOU' | 'DESMARCOU') => Promise<void>
  marcarSessao: (paciente: Paciente) => void
  triggerRapido: TriggerAgendamentoRapido | null
  setTriggerRapido: (trigger: TriggerAgendamentoRapido | null) => void
  pacienteMarcar: Paciente | null
  fecharRapido: () => void
  fecharMarcarSessao: () => void
  recarregar: () => void
  chaveRecarga: number
  profissionalFiltroId: string
  setProfissionalFiltroId: (id: string) => void
  profissionaisDisponiveis: { id: string; nome: string }[]
}

const AgendaContext = createContext<AgendaContextType | null>(null)

export function AgendaProvider({ children }: { children: ReactNode }) {
  const { profissional } = useProfissional()
  const podeFiltrar = profissional && (profissional.role === 'ADMIN' || profissional.role === 'SUPER_ADMIN')
  const { profissionais: profissionaisDisponiveis } = useProfissionais({ habilitado: podeFiltrar === true })

  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date())
  const [grade, setGrade] = useState<GradeAgenda | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [atualizandoStatus, setAtualizandoStatus] = useState<string | null>(null)
  const [visao, setVisao] = useState<Visao>('diaria')
  const [chaveRecarga, setChaveRecarga] = useState(0)
  const [mesSelecionado, setMesSelecionado] = useState<Date>(new Date())
  const [diasComAgendamento, setDiasComAgendamento] = useState<number[]>([])
  const [carregandoResumo, setCarregandoResumo] = useState(false)
  const [triggerRapido, setTriggerRapido] = useState<TriggerAgendamentoRapido | null>(null)
  const [pacienteMarcar, setPacienteMarcar] = useState<Paciente | null>(null)
  const [profissionalFiltroId, setProfissionalFiltroId] = useState('')

  const ehHoje = formatarDataISO(dataSelecionada) === formatarDataISO(new Date())

  const profissionalPrecisaFiltrar = podeFiltrar && !profissionalFiltroId

  const montarParamsAgenda = useCallback(() => {
    const params = new URLSearchParams()
    params.set('data', formatarDataISO(dataSelecionada))
    if (profissionalFiltroId) params.set('profissional_id', profissionalFiltroId)
    return params.toString()
  }, [dataSelecionada, profissionalFiltroId])

    const carregarGrade = useCallback(async () => {
    if (profissionalPrecisaFiltrar) return
    try {
      const response = await api.get(`/agenda?${montarParamsAgenda()}`)
      setGrade(response.data)
    } catch {
      toast.error('Não foi possível carregar a agenda deste dia.')
    }
  }, [montarParamsAgenda, profissionalPrecisaFiltrar])

  useEffect(() => {
    ;(async () => {
      await Promise.resolve()
      setCarregando(true)
      await carregarGrade()
      setCarregando(false)
    })()
  }, [carregarGrade])

  const carregarResumoMes = useCallback(async (data: Date) => {
    if (profissionalPrecisaFiltrar) { setDiasComAgendamento([]); return }
    const ano = data.getFullYear()
    const mes = data.getMonth() + 1
    try {
      const params = new URLSearchParams({ ano: String(ano), mes: String(mes) })
      if (profissionalFiltroId) params.set('profissional_id', profissionalFiltroId)
      const response = await api.get(`/agenda/resumo-mes?${params}`)
      setDiasComAgendamento(response.data.dias)
    } catch {
      setDiasComAgendamento([])
    }
  }, [profissionalFiltroId, profissionalPrecisaFiltrar])

  useEffect(() => {
    ;(async () => {
      await Promise.resolve()
      setCarregandoResumo(true)
      await carregarResumoMes(mesSelecionado)
      setCarregandoResumo(false)
    })()
  }, [carregarResumoMes, mesSelecionado])

  const navegarMes = useCallback((direcao: 1 | -1) => {
    setMesSelecionado((prev) => {
      const nova = new Date(prev)
      nova.setMonth(nova.getMonth() + direcao)
      return nova
    })
  }, [])

  const recarregar = useCallback(() => {
    carregarGrade()
    setChaveRecarga((v) => v + 1)
  }, [carregarGrade])

  useEffect(() => {
    async function inicial() {
      if (chaveRecarga > 0) {
        await carregarResumoMes(mesSelecionado)
      }
    }
    void inicial()
  }, [chaveRecarga, mesSelecionado, carregarResumoMes])

  const atualizarStatus = useCallback(async (agendamentoId: string, status: 'COMPARECEU' | 'FALTOU' | 'DESMARCOU') => {
    setAtualizandoStatus(agendamentoId)
    try {
      await api.patch(`/agenda/agendamentos/${agendamentoId}/status`, { status })
      toast.success('Status atualizado.')
      recarregar()
    } catch {
      toast.error('Não foi possível atualizar o status.')
    } finally {
      setAtualizandoStatus(null)
    }
  }, [recarregar])

  function marcarSessao(paciente: Paciente) {
    setPacienteMarcar(paciente)
  }

  const fecharRapido = useCallback(() => setTriggerRapido(null), [])
  const fecharMarcarSessao = useCallback(() => setPacienteMarcar(null), [])

  const value: AgendaContextType = {
    dataSelecionada,
    setDataSelecionada,
    grade,
    carregando,
    ehHoje,
    visao,
    setVisao,
    mesSelecionado,
    navegarMes,
    diasComAgendamento,
    carregandoResumo,
    atualizandoStatus,
    atualizarStatus,
    marcarSessao,
    triggerRapido,
    setTriggerRapido,
    pacienteMarcar,
    fecharRapido,
    fecharMarcarSessao,
    recarregar,
    chaveRecarga,
    profissionalFiltroId,
    setProfissionalFiltroId,
    profissionaisDisponiveis,
  }

  return (
    <AgendaContext.Provider value={value}>
      {children}
    </AgendaContext.Provider>
  )
}

export function useAgenda() {
  const ctx = useContext(AgendaContext)
  if (!ctx) throw new Error('useAgenda must be used within an AgendaProvider')
  return ctx
}
