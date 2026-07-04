import { useState, useEffect, useCallback } from 'react'
import { DayPicker } from 'react-day-picker'
import { ptBR } from 'date-fns/locale'
import { Plus, Loader2, Calendar, CheckCircle2, XCircle, MinusCircle, Package, CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import 'react-day-picker/dist/style.css'
import api from '@/services/api'

interface Agendamento {
  id: string
  data: string
  horario: string
  slot: number
  status: 'AGENDADO' | 'COMPARECEU' | 'FALTOU' | 'DESMARCOU'
  tipo: 'AVALIACAO' | 'SESSAO' | 'REPOSICAO'
}

interface SessaoPacote {
  id: string
  agendamento: Agendamento
}

interface Pacote {
  id: string
  tipo: 'INDIVIDUAL' | 'PACOTE_5' | 'PACOTE_10'
  valor_cobrado: number
  status_pagamento: 'AGUARDANDO' | 'PAGO'
  pago_em: string | null
  criado_em: string
  sessoes: SessaoPacote[]
  sessoes_realizadas: number
  sessoes_agendadas: number
  sessoes_limite: number
}

interface Precos {
  preco_sessao_individual: number
  preco_pacote_5: number
  preco_pacote_10: number
}

interface SlotGrade {
  slot: number
  agendamento: { id: string } | null
}

interface HorarioGrade {
  horario: string
  slots: SlotGrade[]
}

interface GradeAgenda {
  data: string
  horarios: HorarioGrade[]
}

function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function formatarDataISO(data: Date): string {
  return data.toISOString().split('T')[0]
}

function labelTipo(tipo: Pacote['tipo']): string {
  const map = { INDIVIDUAL: 'Individual', PACOTE_5: 'Pacote 5', PACOTE_10: 'Pacote 10' }
  return map[tipo]
}

function StatusBadge({ status }: { status: Agendamento['status'] }) {
  const map = {
    AGENDADO: { label: 'Agendado', variant: 'secondary' as const, icon: Calendar },
    COMPARECEU: { label: 'Compareceu', variant: 'success' as const, icon: CheckCircle2 },
    FALTOU: { label: 'Faltou', variant: 'destructive' as const, icon: XCircle },
    DESMARCOU: { label: 'Desmarcou', variant: 'outline' as const, icon: MinusCircle },
  }
  const { label, variant, icon: Icon } = map[status]
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  )
}

interface Props {
  pacienteId: string
}

export default function SessoesTab({ pacienteId }: Props) {
  const [pacotes, setPacotes] = useState<Pacote[]>([])
  const [carregando, setCarregando] = useState(true)
  const [precos, setPrecos] = useState<Precos | null>(null)

  // ── Modal: novo pacote ──
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [formPacote, setFormPacote] = useState({
    tipo: 'PACOTE_5' as Pacote['tipo'],
    valor_cobrado: '',
    status_pagamento: 'AGUARDANDO' as 'AGUARDANDO' | 'PAGO',
  })

  // ── Modal: agendar sessão num pacote existente ──
  const [modalAgendarAberto, setModalAgendarAberto] = useState(false)
  const [pacoteAgendando, setPacoteAgendando] = useState<Pacote | null>(null)
  const [etapaAgendar, setEtapaAgendar] = useState<'data' | 'slot'>('data')
  const [dataAgendar, setDataAgendar] = useState<Date>(new Date())
  const [gradeAgendar, setGradeAgendar] = useState<GradeAgenda | null>(null)
  const [carregandoGrade, setCarregandoGrade] = useState(false)
  const [horarioEscolhido, setHorarioEscolhido] = useState<string | null>(null)
  const [slotEscolhido, setSlotEscolhido] = useState<number | null>(null)
  const [confirmandoAgendamento, setConfirmandoAgendamento] = useState(false)

  function precoParaTipo(tipo: Pacote['tipo'], p: Precos): string {
    const map = {
      INDIVIDUAL: p.preco_sessao_individual,
      PACOTE_5: p.preco_pacote_5,
      PACOTE_10: p.preco_pacote_10,
    }
    return map[tipo] > 0 ? String(map[tipo]) : ''
  }

  const carregar = useCallback(async () => {
    try {
      const [pacotesRes, profissionalRes] = await Promise.all([
        api.get(`/pacientes/${pacienteId}/pacotes`),
        api.get('/profissional/me'),
      ])
      setPacotes(pacotesRes.data)
      setPrecos(profissionalRes.data)
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

  // ── Funções: novo pacote ──

  function handleAbrirModal() {
    setFormPacote((prev) => ({
      ...prev,
      valor_cobrado: precos ? precoParaTipo(prev.tipo, precos) : '',
    }))
    setModalAberto(true)
  }

  function handleTipoChange(tipo: Pacote['tipo']) {
    setFormPacote((prev) => ({
      ...prev,
      tipo,
      valor_cobrado: precos ? precoParaTipo(tipo, precos) : prev.valor_cobrado,
    }))
  }

  async function handleCriarPacote() {
    if (!formPacote.valor_cobrado) return
    setSalvando(true)
    try {
      await api.post(`/pacientes/${pacienteId}/pacotes`, {
        tipo: formPacote.tipo,
        valor_cobrado: Number(formPacote.valor_cobrado),
        status_pagamento: formPacote.status_pagamento,
      })
      setModalAberto(false)
      setFormPacote({ tipo: 'PACOTE_5', valor_cobrado: '', status_pagamento: 'AGUARDANDO' })
      carregar()
    } catch {
      // silencioso
    } finally {
      setSalvando(false)
    }
  }

  async function handleMarcarPagamento(pacoteId: string, status: 'AGUARDANDO' | 'PAGO') {
    try {
      await api.patch(`/pacotes/${pacoteId}/pagamento`, { status_pagamento: status })
      carregar()
    } catch {
      // silencioso
    }
  }

  // ── Funções: agendar sessão num pacote existente ──

  function handleAbrirModalAgendar(pacote: Pacote) {
    setPacoteAgendando(pacote)
    setDataAgendar(new Date())
    setGradeAgendar(null)
    setHorarioEscolhido(null)
    setSlotEscolhido(null)
    setEtapaAgendar('data')
    setModalAgendarAberto(true)
  }

  async function handleVerHorarios() {
    setCarregandoGrade(true)
    setHorarioEscolhido(null)
    setSlotEscolhido(null)
    try {
      const response = await api.get(`/agenda?data=${formatarDataISO(dataAgendar)}`)
      setGradeAgendar(response.data)
      setEtapaAgendar('slot')
    } catch {
      // silencioso
    } finally {
      setCarregandoGrade(false)
    }
  }

  async function handleConfirmarAgendamento() {
    if (!pacoteAgendando || !horarioEscolhido || !slotEscolhido) return
    setConfirmandoAgendamento(true)
    try {
      await api.post(`/pacotes/${pacoteAgendando.id}/sessoes`, {
        data: formatarDataISO(dataAgendar),
        horario: horarioEscolhido,
        slot: slotEscolhido,
      })
      setModalAgendarAberto(false)
      carregar()
    } catch {
      // silencioso
    } finally {
      setConfirmandoAgendamento(false)
    }
  }

  if (carregando) {
    return (
      <div className="space-y-3 py-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-24 bg-muted/70 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  const totalRealizadas = pacotes.reduce((acc, p) => acc + p.sessoes_realizadas, 0)

  return (
    <div className="space-y-5">

      {/* Resumo + botão */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-700" />
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{totalRealizadas}</span> sessões realizadas no total
          </span>
        </div>
        <Button size="sm" onClick={handleAbrirModal} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Novo pacote
        </Button>
      </div>

      {/* Lista vazia */}
      {pacotes.length === 0 && (
        <div className="text-center py-10">
          <Package className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum pacote cadastrado ainda.</p>
        </div>
      )}

      {/* Pacotes */}
      <div className="space-y-4">
        {pacotes.map((pacote) => {
          const temVaga = pacote.sessoes_agendadas < pacote.sessoes_limite
          return (
            <div key={pacote.id} className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-muted border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    {labelTipo(pacote.tipo)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {pacote.sessoes_realizadas}/{pacote.sessoes_limite} sessões realizadas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    R$ {Number(pacote.valor_cobrado).toFixed(2)}
                  </span>
                  {pacote.status_pagamento === 'PAGO' ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Pago
                    </Badge>
                  ) : (
                    <button
                      onClick={() => handleMarcarPagamento(pacote.id, 'PAGO')}
                      className="text-xs px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                      Marcar como pago
                    </button>
                  )}
                </div>
              </div>

              {pacote.sessoes.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  Nenhuma sessão agendada neste pacote ainda.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pacote.sessoes.map(({ agendamento }) => (
                    <div key={agendamento.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <span className="text-sm text-foreground">
                            {formatarData(agendamento.data)} às {agendamento.horario}
                          </span>
                          {agendamento.tipo !== 'SESSAO' && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({agendamento.tipo === 'AVALIACAO' ? 'Avaliação' : 'Reposição'})
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={agendamento.status} />
                    </div>
                  ))}
                </div>
              )}

              {/* Agendar sessão — só aparece se ainda houver vaga no pacote */}
              {temVaga && (
                <div className="px-4 py-3 border-t border-border bg-card">
                  <button
                    onClick={() => handleAbrirModalAgendar(pacote)}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    Agendar sessão neste pacote
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal: novo pacote */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
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
                    onClick={() => handleTipoChange(tipo)}
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
                    Padrão: R$ {Number(precoParaTipo(formPacote.tipo, precos) || 0).toFixed(2)}
                  </span>
                )}
              </div>
              <Input
                id="valor"
                type="number"
                min={0}
                step={0.01}
                value={formPacote.valor_cobrado}
                onChange={(e) => setFormPacote((p) => ({ ...p, valor_cobrado: e.target.value }))}
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
                    onClick={() => setFormPacote((p) => ({ ...p, status_pagamento: status }))}
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
              onClick={handleCriarPacote}
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

      {/* Modal: agendar sessão num pacote existente */}
      <Dialog open={modalAgendarAberto} onOpenChange={setModalAgendarAberto}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Agendar sessão — {pacoteAgendando && labelTipo(pacoteAgendando.tipo)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">

            {/* Etapa 1: escolher data */}
            {etapaAgendar === 'data' && (
              <>
                <p className="text-sm text-muted-foreground">Escolha a data para a próxima sessão:</p>
                <div className="flex justify-center">
                  <DayPicker
                    mode="single"
                    selected={dataAgendar}
                    onSelect={(d) => d && setDataAgendar(d)}
                    locale={ptBR}
                    disabled={{ before: new Date() }}
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 gap-2" disabled={carregandoGrade} onClick={handleVerHorarios}>
                    {carregandoGrade ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    {carregandoGrade ? 'Carregando...' : 'Ver horários disponíveis'}
                  </Button>
                  <Button variant="outline" onClick={() => setModalAgendarAberto(false)}>Cancelar</Button>
                </div>
              </>
            )}

            {/* Etapa 2: escolher horário e slot */}
            {etapaAgendar === 'slot' && gradeAgendar && (
              <>
                <p className="text-sm text-muted-foreground capitalize">
                  Horários disponíveis em{' '}
                  <span className="font-medium">
                    {dataAgendar.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>:
                </p>

                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {gradeAgendar.horarios.map(({ horario, slots }) => {
                    const slotsLivres = slots.filter((s) => !s.agendamento)
                    if (slotsLivres.length === 0) return null
                    return (
                      <div key={horario} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-12 shrink-0">{horario}</span>
                        <div className="flex gap-2">
                          {slotsLivres.map(({ slot }) => (
                            <button
                              key={slot}
                              onClick={() => { setHorarioEscolhido(horario); setSlotEscolhido(slot) }}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                                horarioEscolhido === horario && slotEscolhido === slot
                                  ? 'bg-primary text-white border-primary'
                                  : 'border-border text-muted-foreground hover:bg-accent'
                              }`}
                            >
                              Slot {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {gradeAgendar.horarios.every((h) => h.slots.every((s) => s.agendamento)) && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum slot disponível neste dia.</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    disabled={!horarioEscolhido || !slotEscolhido || confirmandoAgendamento}
                    onClick={handleConfirmarAgendamento}
                  >
                    {confirmandoAgendamento
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <CheckCircle2 className="w-4 h-4" />
                    }
                    {confirmandoAgendamento ? 'Agendando...' : 'Confirmar'}
                  </Button>
                  <Button variant="outline" onClick={() => setEtapaAgendar('data')}>Voltar</Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
