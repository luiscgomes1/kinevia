import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { DayPicker } from 'react-day-picker'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  ChevronLeft, ChevronRight, Plus, User,
  ClipboardList, Calendar, FileText, CheckCircle2,
  XCircle, MinusCircle, Clock, Loader2, Package,
  ArrowLeft
} from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import 'react-day-picker/dist/style.css'
import api from '@/services/api'

interface Paciente {
  id: string
  nome: string
}

interface Pacote {
  id: string
  tipo: 'INDIVIDUAL' | 'PACOTE_5' | 'PACOTE_10'
  valor_cobrado: number
  status_pagamento: 'AGUARDANDO' | 'PAGO'
  sessoes_agendadas: number
  sessoes_limite: number
}

interface Agendamento {
  id: string
  paciente: { id: string; nome: string }
  status: 'AGENDADO' | 'COMPARECEU' | 'FALTOU' | 'DESMARCOU'
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

interface GradeAgenda {
  data: string
  horarios: Horario[]
}

interface Precos {
  preco_sessao_individual: number
  preco_pacote_5: number
  preco_pacote_10: number
}

const statusConfig = {
  AGENDADO: { cor: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPARECEU: { cor: 'bg-verde-claro/15 text-green-700 border-verde-claro/40' },
  FALTOU: { cor: 'bg-red-50 text-red-700 border-red-200' },
  DESMARCOU: { cor: 'bg-muted text-muted-foreground border-border' },
}

const statusLabel = {
  AGENDADO: 'Agendado',
  COMPARECEU: 'Compareceu',
  FALTOU: 'Faltou',
  DESMARCOU: 'Desmarcou',
}

function labelTipo(tipo: Pacote['tipo']): string {
  const map = { INDIVIDUAL: 'Individual', PACOTE_5: 'Pacote 5', PACOTE_10: 'Pacote 10' }
  return map[tipo]
}

function formatarDataISO(data: Date): string {
  return data.toISOString().split('T')[0]
}

function formatarDataExibicao(data: Date): string {
  return data.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

type Etapa = 'buscar' | 'selecionar_pacote' | 'criar_pacote'
type EtapaMarcar = 'sem_pacote' | 'criar_pacote_marcar' | 'escolher_data' | 'escolher_slot' | 'selecionar_pacote_marcar'

export default function AgendaPage() {
  const navigate = useNavigate()
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date())
  const [grade, setGrade] = useState<GradeAgenda | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [atualizandoStatus, setAtualizandoStatus] = useState<string | null>(null)
  const [mostrarCalendarioMobile, setMostrarCalendarioMobile] = useState(false)

  // ── Modal de agendamento rápido (pelo +) ──
  const [modalAberto, setModalAberto] = useState(false)
  const [etapa, setEtapa] = useState<Etapa>('buscar')
  const [slotSelecionado, setSlotSelecionado] = useState<{ horario: string; slot: number } | null>(null)
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [buscaPaciente, setBuscaPaciente] = useState('')
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null)
  const [carregandoPacotes, setCarregandoPacotes] = useState(false)
  const [pacotesDisponiveis, setPacotesDisponiveis] = useState<Pacote[]>([])
  const [pacoteSelecionado, setPacoteSelecionado] = useState<Pacote | null>(null)
  const [agendando, setAgendando] = useState(false)
  const [precos, setPrecos] = useState<Precos | null>(null)
  const [formPacote, setFormPacote] = useState({
    tipo: 'PACOTE_5' as Pacote['tipo'],
    valor_cobrado: '',
    status_pagamento: 'AGUARDANDO' as 'AGUARDANDO' | 'PAGO',
  })
  const [criandoPacote, setCriandoPacote] = useState(false)

  // ── Modal de "Marcar sessão" (pelo menu de contexto) ──
  const [modalMarcarAberto, setModalMarcarAberto] = useState(false)
  const [etapaMarcar, setEtapaMarcar] = useState<EtapaMarcar>('escolher_data')
  const [pacienteMarcar, setPacienteMarcar] = useState<Paciente | null>(null)
  const [dataMarcar, setDataMarcar] = useState<Date>(new Date())
  const [gradeMarcar, setGradeMarcar] = useState<GradeAgenda | null>(null)
  const [carregandoGradeMarcar, setCarregandoGradeMarcar] = useState(false)
  const [horarioMarcar, setHorarioMarcar] = useState<string | null>(null)
  const [slotMarcar, setSlotMarcar] = useState<number | null>(null)
  const [pacotesMarcar, setPacotesMarcar] = useState<Pacote[]>([])
  const [pacoteMarcar, setPacoteMarcar] = useState<Pacote | null>(null)
  const [agendandoMarcar, setAgendandoMarcar] = useState(false)

  const carregarGrade = useCallback(async () => {
    setCarregando(true)
    try {
      const response = await api.get(`/agenda?data=${formatarDataISO(dataSelecionada)}`)
      setGrade(response.data)
    } catch {
      toast.error('Não foi possível carregar a agenda deste dia.')
    } finally {
      setCarregando(false)
    }
  }, [dataSelecionada])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregarGrade()
  }, [carregarGrade])

  useEffect(() => {
    async function buscar() {
      try {
        const response = await api.get(`/pacientes?busca=${buscaPaciente}`)
        setPacientes(response.data)
      } catch { /* silencioso — busca incremental, não vale interromper com toast a cada tecla */ }
    }
    const t = setTimeout(buscar, 300)
    return () => clearTimeout(t)
  }, [buscaPaciente])

  function avancarDia(direcao: 1 | -1) {
    const nova = new Date(dataSelecionada)
    nova.setDate(nova.getDate() + direcao)
    setDataSelecionada(nova)
  }

  // ── Funções do modal de agendamento rápido ──

  function handleAbrirModal(horario: string, slot: number) {
    setSlotSelecionado({ horario, slot })
    setEtapa('buscar')
    setBuscaPaciente('')
    setPacienteSelecionado(null)
    setPacotesDisponiveis([])
    setPacoteSelecionado(null)
    setModalAberto(true)
  }

  async function handleSelecionarPaciente(paciente: Paciente) {
    setPacienteSelecionado(paciente)
    setBuscaPaciente(paciente.nome)
    setCarregandoPacotes(true)
    try {
      const response = await api.get(`/pacientes/${paciente.id}/pacotes`)
      const todos: Pacote[] = response.data
      const disponiveis = todos.filter((p) => p.sessoes_agendadas < p.sessoes_limite)
      setPacotesDisponiveis(disponiveis)
      if (disponiveis.length === 0) {
        const profRes = await api.get('/profissional/me')
        const p: Precos = profRes.data
        setPrecos(p)
        const precoInicial = {
          INDIVIDUAL: p.preco_sessao_individual,
          PACOTE_5: p.preco_pacote_5,
          PACOTE_10: p.preco_pacote_10,
        }
        setFormPacote((prev) => ({
          ...prev,
          valor_cobrado: precoInicial[prev.tipo] > 0 ? String(precoInicial[prev.tipo]) : '',
        }))
        setEtapa('criar_pacote')
      } else if (disponiveis.length === 1) {
        setPacoteSelecionado(disponiveis[0])
        setEtapa('selecionar_pacote')
      } else {
        setEtapa('selecionar_pacote')
      }
    } catch {
      toast.error('Não foi possível carregar os pacotes deste paciente.')
    }
    finally { setCarregandoPacotes(false) }
  }

  function precoParaTipo(tipo: Pacote['tipo']): string {
    if (!precos) return ''
    const map = {
      INDIVIDUAL: precos.preco_sessao_individual,
      PACOTE_5: precos.preco_pacote_5,
      PACOTE_10: precos.preco_pacote_10,
    }
    return map[tipo] > 0 ? String(map[tipo]) : ''
  }

  async function handleCriarPacoteEAgendar() {
    if (!pacienteSelecionado || !slotSelecionado || !formPacote.valor_cobrado) return
    setCriandoPacote(true)
    try {
      const pacoteRes = await api.post(`/pacientes/${pacienteSelecionado.id}/pacotes`, {
        tipo: formPacote.tipo,
        valor_cobrado: Number(formPacote.valor_cobrado),
        status_pagamento: formPacote.status_pagamento,
      })
      await api.post(`/pacotes/${pacoteRes.data.pacote.id}/sessoes`, {
        data: formatarDataISO(dataSelecionada),
        horario: slotSelecionado.horario,
        slot: slotSelecionado.slot,
      })
      toast.success('Pacote criado e sessão agendada!')
      setModalAberto(false)
      carregarGrade()
    } catch {
      toast.error('Não foi possível criar o pacote e agendar a sessão.')
    }
    finally { setCriandoPacote(false) }
  }

  async function handleAgendar() {
    if (!pacoteSelecionado || !slotSelecionado) return
    setAgendando(true)
    try {
      await api.post(`/pacotes/${pacoteSelecionado.id}/sessoes`, {
        data: formatarDataISO(dataSelecionada),
        horario: slotSelecionado.horario,
        slot: slotSelecionado.slot,
      })
      toast.success('Sessão agendada com sucesso!')
      setModalAberto(false)
      carregarGrade()
    } catch {
      toast.error('Não foi possível agendar a sessão.')
    }
    finally { setAgendando(false) }
  }

  // ── Funções do modal de "Marcar sessão" ──

  async function handleCriarPacoteParaMarcar() {
    if (!pacienteMarcar || !formPacote.valor_cobrado) return
    setCriandoPacote(true)
    try {
      const response = await api.post(`/pacientes/${pacienteMarcar.id}/pacotes`, {
        tipo: formPacote.tipo,
        valor_cobrado: Number(formPacote.valor_cobrado),
        status_pagamento: formPacote.status_pagamento,
      })

      const pacoteCriado = response.data.pacote

      const novoPacote: Pacote = {
        id: pacoteCriado.id,
        tipo: pacoteCriado.tipo,
        valor_cobrado: pacoteCriado.valor_cobrado,
        status_pagamento: pacoteCriado.status_pagamento,
        sessoes_agendadas: 0,
        sessoes_limite: pacoteCriado.tipo === 'INDIVIDUAL' ? 1 : pacoteCriado.tipo === 'PACOTE_5' ? 5 : 10,
      }

      setPacotesMarcar([novoPacote])
      setPacoteMarcar(novoPacote)
      setEtapaMarcar('escolher_data')
      toast.success('Pacote criado! Agora escolha a data da sessão.')
    } catch {
      toast.error('Não foi possível criar o pacote.')
    } finally {
      setCriandoPacote(false)
    }
  }

  async function handleAbrirMarcarSessao(paciente: Paciente) {
    setPacienteMarcar(paciente)
    setDataMarcar(new Date())
    setGradeMarcar(null)
    setHorarioMarcar(null)
    setSlotMarcar(null)
    setPacoteMarcar(null)
    setEtapaMarcar('escolher_data')

    try {
      const response = await api.get(`/pacientes/${paciente.id}/pacotes`)
      const todos: Pacote[] = response.data
      const disponiveis = todos.filter((p) => p.sessoes_agendadas < p.sessoes_limite)
      setPacotesMarcar(disponiveis)

      if (disponiveis.length === 0) {
        const profRes = await api.get('/profissional/me')
        const p: Precos = profRes.data
        setPrecos(p)

        const precoInicial = {
          INDIVIDUAL: p.preco_sessao_individual,
          PACOTE_5: p.preco_pacote_5,
          PACOTE_10: p.preco_pacote_10,
        }
        setFormPacote({
          tipo: 'PACOTE_5',
          valor_cobrado: precoInicial['PACOTE_5'] > 0 ? String(precoInicial['PACOTE_5']) : '',
          status_pagamento: 'AGUARDANDO',
        })

        setEtapaMarcar('sem_pacote')
      } else {
        if (disponiveis.length === 1) setPacoteMarcar(disponiveis[0])
        setEtapaMarcar('escolher_data')
      }
    } catch {
      toast.error('Não foi possível carregar os pacotes deste paciente.')
    }

    setModalMarcarAberto(true)
  }

  async function handleCarregarGradeMarcar(data: Date) {
    setDataMarcar(data)
    setCarregandoGradeMarcar(true)
    setHorarioMarcar(null)
    setSlotMarcar(null)
    try {
      const response = await api.get(`/agenda?data=${formatarDataISO(data)}`)
      setGradeMarcar(response.data)
      setEtapaMarcar('escolher_slot')
    } catch {
      toast.error('Não foi possível carregar os horários deste dia.')
    }
    finally { setCarregandoGradeMarcar(false) }
  }

  async function handleConfirmarMarcar() {
    if (!pacoteMarcar || !horarioMarcar || !slotMarcar) return
    setAgendandoMarcar(true)
    try {
      await api.post(`/pacotes/${pacoteMarcar.id}/sessoes`, {
        data: formatarDataISO(dataMarcar),
        horario: horarioMarcar,
        slot: slotMarcar,
      })
      toast.success('Sessão agendada com sucesso!')
      setModalMarcarAberto(false)
      carregarGrade()
    } catch {
      toast.error('Não foi possível agendar a sessão.')
    }
    finally { setAgendandoMarcar(false) }
  }

  async function handleAtualizarStatus(
    agendamentoId: string,
    status: 'COMPARECEU' | 'FALTOU' | 'DESMARCOU'
  ) {
    setAtualizandoStatus(agendamentoId)
    try {
      await api.patch(`/agenda/agendamentos/${agendamentoId}/status`, { status })
      toast.success(`Status atualizado para "${statusLabel[status]}".`)
      carregarGrade()
    } catch {
      toast.error('Não foi possível atualizar o status.')
    }
    finally { setAtualizandoStatus(null) }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full">

      {/* ── Calendário mini (desktop/tablet grande) ─── */}
      <div className="hidden lg:block shrink-0">
        <div className="bg-card rounded-xl border border-border p-3 sticky top-6">
          <DayPicker
            mode="single"
            selected={dataSelecionada}
            onSelect={(d) => d && setDataSelecionada(d)}
            locale={ptBR}
            className="text-sm"
          />
        </div>
      </div>

      {/* ── Grade da agenda ──────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button onClick={() => avancarDia(-1)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </button>
            {/* Em telas pequenas o texto completo não cabe — abre um seletor de data por toque */}
            <button
              onClick={() => setMostrarCalendarioMobile(!mostrarCalendarioMobile)}
              className="lg:pointer-events-none text-left min-w-0"
            >
              <h1 className="text-sm sm:text-base font-semibold text-foreground capitalize truncate">
                {formatarDataExibicao(dataSelecionada)}
              </h1>
            </button>
            <button onClick={() => avancarDia(1)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button onClick={() => setDataSelecionada(new Date())} className="text-xs text-primary hover:underline shrink-0 ml-2">
            Hoje
          </button>
        </div>

        {/* Calendário mini — some como painel abaixo do cabeçalho em telas menores que lg */}
        {mostrarCalendarioMobile && (
          <div className="lg:hidden bg-card rounded-xl border border-border p-3 flex justify-center">
            <DayPicker
              mode="single"
              selected={dataSelecionada}
              onSelect={(d) => { if (d) { setDataSelecionada(d); setMostrarCalendarioMobile(false) } }}
              locale={ptBR}
              className="text-sm"
            />
          </div>
        )}

        {carregando ? (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <div className="w-14 h-4 bg-muted animate-pulse rounded shrink-0" />
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {[...Array(3)].map((_, j) => <div key={j} className="h-9 bg-muted/70 animate-pulse rounded-lg" />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Header de colunas — só faz sentido a partir de sm, onde os 3 slots ficam lado a lado */}
            <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-muted border-b border-border">
              <div className="w-14 shrink-0" />
              <div className="flex-1 grid grid-cols-3 gap-3">
                {['Slot 1', 'Slot 2', 'Slot 3'].map((label) => (
                  <div key={label} className="text-xs font-medium text-muted-foreground text-center">{label}</div>
                ))}
              </div>
            </div>

            {grade?.horarios.map(({ horario, slots }) => (
              <div key={horario} className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center px-4 py-3 sm:py-2.5 border-b border-border last:border-0">
                <div className="sm:w-14 sm:shrink-0">
                  <span className="text-xs font-semibold sm:font-medium text-foreground sm:text-muted-foreground">{horario}</span>
                </div>
                {/* Em telas pequenas cada slot ocupa a largura toda, empilhado (mais fácil de tocar e ler o nome) */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {slots.map(({ slot, agendamento }) => (
                    <div key={slot}>
                      {agendamento ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className={`w-full px-2.5 py-2 sm:py-1.5 rounded-lg border text-xs font-medium text-left truncate transition-colors hover:opacity-80 ${statusConfig[agendamento.status].cor}`}>
                              <span className="sm:hidden text-[10px] opacity-70 mr-1">Slot {slot} ·</span>
                              {agendamento.paciente.nome.split(' ').slice(0, 2).join(' ')}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="start">
                            <div className="px-2 py-1.5 mb-1">
                              <p className="text-xs font-semibold text-foreground truncate">{agendamento.paciente.nome}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{horario} · Slot {slot}</p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Registrar presença</p>
                              {[
                                { status: 'COMPARECEU' as const, icon: CheckCircle2, label: 'Compareceu', cor: 'text-green-700' },
                                { status: 'FALTOU' as const, icon: XCircle, label: 'Faltou', cor: 'text-red-500' },
                                { status: 'DESMARCOU' as const, icon: MinusCircle, label: 'Desmarcou', cor: 'text-muted-foreground' },
                              ].map(({ status, icon: Icon, label, cor }) => (
                                <button
                                  key={status}
                                  disabled={agendamento.status === status || !!atualizandoStatus}
                                  onClick={() => handleAtualizarStatus(agendamento.id, status)}
                                  className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-accent disabled:opacity-40 ${cor}`}
                                >
                                  {atualizandoStatus === agendamento.id
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Icon className="w-3.5 h-3.5" />
                                  }
                                  {label}
                                </button>
                              ))}
                              <div className="border-t border-border my-1" />
                              {[
                                { icon: User, label: 'Perfil completo', acao: () => navigate(`/pacientes/${agendamento.paciente.id}`) },
                                { icon: ClipboardList, label: 'Prontuário', acao: () => navigate(`/pacientes/${agendamento.paciente.id}?aba=prontuario`) },
                                { icon: Calendar, label: 'Marcar sessão', acao: () => handleAbrirMarcarSessao(agendamento.paciente) },
                                { icon: FileText, label: 'Gerar laudo', acao: () => navigate(`/pacientes/${agendamento.paciente.id}?aba=laudos`) },
                              ].map(({ icon: Icon, label, acao }) => (
                                <button key={label} onClick={acao} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-muted-foreground transition-colors hover:bg-accent">
                                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                                  {label}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <button
                          onClick={() => handleAbrirModal(horario, slot)}
                          className="w-full px-2.5 py-2 sm:py-1.5 rounded-lg border border-dashed border-border text-muted-foreground/60 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="sm:hidden text-xs">Slot {slot} — agendar</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal de agendamento rápido (pelo +) ─────── */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {etapa !== 'buscar' && (
                <button onClick={() => { setEtapa('buscar'); setPacienteSelecionado(null); setBuscaPaciente('') }} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <DialogTitle>
                {etapa === 'buscar' && 'Agendar paciente'}
                {etapa === 'selecionar_pacote' && 'Selecionar pacote'}
                {etapa === 'criar_pacote' && 'Criar pacote'}
              </DialogTitle>
            </div>
          </DialogHeader>

          {slotSelecionado && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {formatarDataExibicao(dataSelecionada)} · {slotSelecionado.horario} · Slot {slotSelecionado.slot}
                </span>
              </div>

              {etapa === 'buscar' && (
                <>
                  <div className="space-y-1.5">
                    <Label>Buscar paciente</Label>
                    <Input value={buscaPaciente} onChange={(e) => { setBuscaPaciente(e.target.value); setPacienteSelecionado(null) }} placeholder="Digite o nome..." autoFocus />
                  </div>
                  {carregandoPacotes && <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}
                  {pacientes.length > 0 && !carregandoPacotes && (
                    <div className="border border-border rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                      {pacientes.map((p) => (
                        <button key={p.id} onClick={() => handleSelecionarPaciente(p)} className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-left hover:bg-accent border-b border-border last:border-0 transition-colors">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">{p.nome.charAt(0).toUpperCase()}</div>
                          {p.nome}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-center text-muted-foreground">
                    Paciente não cadastrado?{' '}
                    <button onClick={() => navigate('/pacientes/novo')} className="text-primary hover:underline">Cadastrar agora</button>
                  </p>
                </>
              )}

              {etapa === 'selecionar_pacote' && (
                <>
                  <p className="text-sm text-muted-foreground">Selecione o pacote de <span className="font-medium text-foreground">{pacienteSelecionado?.nome}</span>:</p>
                  <div className="space-y-2">
                    {pacotesDisponiveis.map((pacote) => (
                      <button key={pacote.id} onClick={() => setPacoteSelecionado(pacote)} className={`w-full flex items-center justify-between px-3 py-3 rounded-lg border text-sm transition-colors ${pacoteSelecionado?.id === pacote.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}`}>
                        <div className="flex items-center gap-2.5">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <div className="text-left">
                            <p className="font-medium text-foreground">{labelTipo(pacote.tipo)}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{pacote.sessoes_agendadas}/{pacote.sessoes_limite} sessões · R$ {Number(pacote.valor_cobrado).toFixed(2)}</p>
                          </div>
                        </div>
                        {pacoteSelecionado?.id === pacote.id && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button className="flex-1 gap-2" disabled={!pacoteSelecionado || agendando} onClick={handleAgendar}>
                      {agendando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                      {agendando ? 'Agendando...' : 'Confirmar'}
                    </Button>
                    <Button variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
                  </div>
                </>
              )}

              {etapa === 'criar_pacote' && (
                <>
                  <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                    <Package className="w-4 h-4 shrink-0 mt-0.5" />
                    <p><span className="font-medium">{pacienteSelecionado?.nome}</span> não tem pacote disponível. Crie um para continuar.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['INDIVIDUAL', 'PACOTE_5', 'PACOTE_10'] as const).map((tipo) => (
                        <button key={tipo} type="button" onClick={() => setFormPacote((p) => ({ ...p, tipo, valor_cobrado: precoParaTipo(tipo) }))} className={`py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${formPacote.tipo === tipo ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:bg-accent'}`}>
                          {labelTipo(tipo)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="valor_pacote">Valor (R$)</Label>
                      {precos && <span className="text-xs text-muted-foreground">Padrão: R$ {Number(precoParaTipo(formPacote.tipo) || 0).toFixed(2)}</span>}
                    </div>
                    <Input id="valor_pacote" type="number" min={0} step={0.01} value={formPacote.valor_cobrado} onChange={(e) => setFormPacote((p) => ({ ...p, valor_cobrado: e.target.value }))} placeholder="0,00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Pagamento</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['AGUARDANDO', 'PAGO'] as const).map((status) => (
                        <button key={status} type="button" onClick={() => setFormPacote((p) => ({ ...p, status_pagamento: status }))} className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${formPacote.status_pagamento === status ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:bg-accent'}`}>
                          {status === 'AGUARDANDO' ? 'A receber' : 'Já pago'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button className="flex-1 gap-2" disabled={criandoPacote || !formPacote.valor_cobrado} onClick={handleCriarPacoteEAgendar}>
                      {criandoPacote ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {criandoPacote ? 'Criando...' : 'Criar e agendar'}
                    </Button>
                    <Button variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal de "Marcar sessão" (pelo menu de contexto) ── */}
      <Dialog open={modalMarcarAberto} onOpenChange={setModalMarcarAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {(etapaMarcar === 'escolher_slot' || etapaMarcar === 'criar_pacote_marcar') && (
                <button onClick={() => setEtapaMarcar(etapaMarcar === 'criar_pacote_marcar' ? 'sem_pacote' : 'escolher_data')} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              {etapaMarcar === 'selecionar_pacote_marcar' && (
                <button onClick={() => setEtapaMarcar('escolher_slot')} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <DialogTitle className="truncate">Marcar sessão — {pacienteMarcar?.nome}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-1">

            {/* Etapa 1: escolher data */}
            {etapaMarcar === 'escolher_data' && (
              <>
                <p className="text-sm text-muted-foreground">Escolha a data para a próxima sessão:</p>
                <div className="flex justify-center overflow-x-auto">
                  <DayPicker
                    mode="single"
                    selected={dataMarcar}
                    onSelect={(d) => d && setDataMarcar(d)}
                    locale={ptBR}
                    disabled={{ before: new Date() }}
                    className="text-sm"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button className="flex-1 gap-2" disabled={carregandoGradeMarcar} onClick={() => handleCarregarGradeMarcar(dataMarcar)}>
                    {carregandoGradeMarcar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    {carregandoGradeMarcar ? 'Carregando...' : 'Ver horários disponíveis'}
                  </Button>
                  <Button variant="outline" onClick={() => setModalMarcarAberto(false)}>Cancelar</Button>
                </div>
              </>
            )}

            {/* Etapa 2: escolher horário e slot */}
            {etapaMarcar === 'escolher_slot' && gradeMarcar && (
              <>
                <p className="text-sm text-muted-foreground capitalize">
                  Horários disponíveis em <span className="font-medium text-foreground">{dataMarcar.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>:
                </p>

                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {gradeMarcar.horarios.map(({ horario, slots }) => {
                    const slotsLivres = slots.filter((s) => !s.agendamento)
                    if (slotsLivres.length === 0) return null
                    return (
                      <div key={horario} className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-muted-foreground w-12 shrink-0">{horario}</span>
                        <div className="flex gap-2 flex-wrap">
                          {slotsLivres.map(({ slot }) => (
                            <button
                              key={slot}
                              onClick={() => { setHorarioMarcar(horario); setSlotMarcar(slot) }}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${horarioMarcar === horario && slotMarcar === slot ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}
                            >
                              Slot {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {gradeMarcar.horarios.every((h) => h.slots.every((s) => s.agendamento)) && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum slot disponível neste dia.</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    disabled={!horarioMarcar || !slotMarcar}
                    onClick={() => {
                      if (pacotesMarcar.length === 1) {
                        handleConfirmarMarcar()
                      } else {
                        setEtapaMarcar('selecionar_pacote_marcar')
                      }
                    }}
                  >
                    <Calendar className="w-4 h-4" />
                    {pacotesMarcar.length === 1 ? 'Confirmar' : 'Escolher pacote'}
                  </Button>
                </div>
              </>
            )}

            {/* Etapa "sem_pacote": aviso imediato, antes de escolher data */}
            {etapaMarcar === 'sem_pacote' && (
              <>
                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  <Package className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    <span className="font-medium">{pacienteMarcar?.nome}</span> não tem pacotes com sessões disponíveis. Crie um pacote para continuar.
                  </p>
                </div>
                <Button className="w-full gap-2" onClick={() => setEtapaMarcar('criar_pacote_marcar')}>
                  <Package className="w-4 h-4" />
                  Criar novo pacote
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setModalMarcarAberto(false)}>
                  Cancelar
                </Button>
              </>
            )}

            {/* Etapa: criar pacote dentro do fluxo de marcar sessão */}
            {etapaMarcar === 'criar_pacote_marcar' && (
              <>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['INDIVIDUAL', 'PACOTE_5', 'PACOTE_10'] as const).map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setFormPacote((p) => ({ ...p, tipo, valor_cobrado: precoParaTipo(tipo) }))}
                        className={`py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${formPacote.tipo === tipo ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:bg-accent'}`}
                      >
                        {labelTipo(tipo)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="valor_pacote_marcar">Valor (R$)</Label>
                    {precos && <span className="text-xs text-muted-foreground">Padrão: R$ {Number(precoParaTipo(formPacote.tipo) || 0).toFixed(2)}</span>}
                  </div>
                  <Input
                    id="valor_pacote_marcar"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formPacote.valor_cobrado}
                    onChange={(e) => setFormPacote((p) => ({ ...p, valor_cobrado: e.target.value }))}
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
                        onClick={() => setFormPacote((p) => ({ ...p, status_pagamento: status }))}
                        className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${formPacote.status_pagamento === status ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:bg-accent'}`}
                      >
                        {status === 'AGUARDANDO' ? 'A receber' : 'Já pago'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button className="flex-1 gap-2" disabled={criandoPacote || !formPacote.valor_cobrado} onClick={handleCriarPacoteParaMarcar}>
                    {criandoPacote ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {criandoPacote ? 'Criando...' : 'Criar pacote'}
                  </Button>
                  <Button variant="outline" onClick={() => setModalMarcarAberto(false)}>Cancelar</Button>
                </div>
              </>
            )}

            {/* Etapa: selecionar pacote (sempre tem ao menos 2, pois length 0 é tratado acima e length 1 confirma direto) */}
            {etapaMarcar === 'selecionar_pacote_marcar' && (
              <>
                <p className="text-sm text-muted-foreground">Selecione o pacote para vincular esta sessão:</p>
                <div className="space-y-2">
                  {pacotesMarcar.map((pacote) => (
                    <button
                      key={pacote.id}
                      onClick={() => setPacoteMarcar(pacote)}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-lg border text-sm transition-colors ${pacoteMarcar?.id === pacote.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <div className="text-left">
                          <p className="font-medium text-foreground">{labelTipo(pacote.tipo)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{pacote.sessoes_agendadas}/{pacote.sessoes_limite} sessões</p>
                        </div>
                      </div>
                      {pacoteMarcar?.id === pacote.id && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button className="flex-1 gap-2" disabled={!pacoteMarcar || agendandoMarcar} onClick={handleConfirmarMarcar}>
                    {agendandoMarcar ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {agendandoMarcar ? 'Agendando...' : 'Confirmar'}
                  </Button>
                  <Button variant="outline" onClick={() => setModalMarcarAberto(false)}>Cancelar</Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
