import { useState, useEffect, useCallback, memo } from 'react'
import { Calendar, CheckCircle2, XCircle, MinusCircle, Package, CalendarPlus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import api from '@/services/api'
import { exibirErro } from '@/services/api'
import { formatarDataISO } from '@/lib/data'
import { ModalNovoPacote } from './ModalNovoPacote'
import { ModalAgendarSessao } from './ModalAgendarSessao'

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
  profissional_id: string
  tipo: 'INDIVIDUAL' | 'PACOTE_5' | 'PACOTE_10'
  valor_cobrado: number
  status_pagamento: 'AGUARDANDO' | 'PAGO'
  pago_em: string | null
  criado_em: string
  sessoes: SessaoPacote[]
  sessoes_realizadas: number
  sessoes_agendadas: number
  sessoes_limite: number
  quantidade_sessoes: number
}

function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
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

const SessoesTab = memo(function SessoesTab({ pacienteId }: Props) {
  const [pacotes, setPacotes] = useState<Pacote[]>([])
  const [carregando, setCarregando] = useState(true)
  const [precos, setPrecos] = useState<{ preco_sessao_individual: number; preco_pacote_5: number; preco_pacote_10: number } | null>(null)

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
  const [gradeAgendar, setGradeAgendar] = useState<{ data: string; horarios: { horario: string; slots: { slot: number; agendamento: { id: string } | null }[] }[] } | null>(null)
  const [carregandoGrade, setCarregandoGrade] = useState(false)
  const [horarioEscolhido, setHorarioEscolhido] = useState<string | null>(null)
  const [slotEscolhido, setSlotEscolhido] = useState<number | null>(null)
  const [confirmandoAgendamento, setConfirmandoAgendamento] = useState(false)

  function precoParaTipo(tipo: Pacote['tipo'], p: { preco_sessao_individual: number; preco_pacote_5: number; preco_pacote_10: number }): string {
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
    } catch (err) {
      toast.error(exibirErro(err, 'Não foi possível carregar os dados.'))
    } finally {
      setCarregando(false)
    }
  }, [pacienteId])

  useEffect(() => {
    ;(async () => {
      await carregar()
    })()
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
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao criar pacote.'))
    } finally {
      setSalvando(false)
    }
  }

  const [marcandoPagamento, setMarcandoPagamento] = useState<string | null>(null)

  async function handleMarcarPagamento(pacoteId: string, status: 'AGUARDANDO' | 'PAGO') {
    setMarcandoPagamento(pacoteId)
    try {
      await api.patch(`/pacotes/${pacoteId}/pagamento`, { status_pagamento: status })
      carregar()
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao atualizar pagamento.'))
    } finally {
      setMarcandoPagamento(null)
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
      const params = new URLSearchParams({ data: formatarDataISO(dataAgendar) })
      if (pacoteAgendando?.profissional_id) params.set('profissional_id', pacoteAgendando.profissional_id)
      const response = await api.get(`/agenda?${params.toString()}`)
      setGradeAgendar(response.data)
      setEtapaAgendar('slot')
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao carregar horários.'))
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
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao agendar sessão.'))
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
                      disabled={marcandoPagamento === pacote.id}
                      className="text-xs px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {marcandoPagamento === pacote.id ? 'Atualizando...' : 'Marcar como pago'}
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

      <ModalNovoPacote
        open={modalAberto}
        onOpenChange={setModalAberto}
        formPacote={formPacote}
        onTipoChange={handleTipoChange}
        onValorChange={(valor) => setFormPacote((p) => ({ ...p, valor_cobrado: valor }))}
        onStatusChange={(status) => setFormPacote((p) => ({ ...p, status_pagamento: status }))}
        precos={precos}
        salvando={salvando}
        onCriar={handleCriarPacote}
      />

      <ModalAgendarSessao
        open={modalAgendarAberto}
        onOpenChange={setModalAgendarAberto}
        pacote={pacoteAgendando}
        gradeAgendar={gradeAgendar}
        carregandoGrade={carregandoGrade}
        dataAgendar={dataAgendar}
        onDataChange={setDataAgendar}
        etapaAgendar={etapaAgendar}
        onEtapaChange={setEtapaAgendar}
        horarioEscolhido={horarioEscolhido}
        slotEscolhido={slotEscolhido}
        onSlotEscolher={(horario, slot) => { setHorarioEscolhido(horario); setSlotEscolhido(slot) }}
        onVerHorarios={handleVerHorarios}
        onConfirmar={handleConfirmarAgendamento}
        confirmandoAgendamento={confirmandoAgendamento}
      />
    </div>
  )
})

export default SessoesTab
