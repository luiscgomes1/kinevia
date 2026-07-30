import { useState, useEffect, memo } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, CheckCircle2, Loader2, Package } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { ptBR } from 'date-fns/locale'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FormularioPacote, type ValorFormularioPacote } from '@/components/FormularioPacote'
import {
  type Precos,
  type PacoteResumo as Pacote,
  LIMITE_SESSOES_POR_TIPO,
  labelTipoPacote,
  precoPadraoParaTipo,
  buscarPacotesDisponiveis,
} from '@/lib/pacotes'
import { formatarDataISO } from '@/lib/data'
import 'react-day-picker/dist/style.css'
import { useAgenda } from './AgendaContext'
import api from '@/services/api'

interface SlotGrade {
  slot: number
  agendamento: { id: string } | null
}

interface Horario {
  horario: string
  slots: SlotGrade[]
}

interface GradeAgenda {
  data: string
  horarios: Horario[]
}

type Etapa = 'sem_pacote' | 'criar_pacote_marcar' | 'escolher_data' | 'escolher_slot' | 'selecionar_pacote_marcar'

const ModalMarcarSessao = memo(function ModalMarcarSessao() {
  const { pacienteMarcar: paciente, fecharMarcarSessao: onClose, recarregar: onAgendado } = useAgenda()
  const [pronto, setPronto] = useState(false)
  const [etapa, setEtapa] = useState<Etapa>('escolher_data')
  const [dataMarcar, setDataMarcar] = useState<Date>(new Date())
  const [gradeMarcar, setGradeMarcar] = useState<GradeAgenda | null>(null)
  const [carregandoGradeMarcar, setCarregandoGradeMarcar] = useState(false)
  const [horarioMarcar, setHorarioMarcar] = useState<string | null>(null)
  const [slotMarcar, setSlotMarcar] = useState<number | null>(null)
  const [pacotesMarcar, setPacotesMarcar] = useState<Pacote[]>([])
  const [pacoteMarcar, setPacoteMarcar] = useState<Pacote | null>(null)
  const [agendandoMarcar, setAgendandoMarcar] = useState(false)
  const [precos, setPrecos] = useState<Precos | null>(null)
  const [formPacote, setFormPacote] = useState<ValorFormularioPacote>({
    tipo: 'PACOTE_5',
    valor_cobrado: '',
    status_pagamento: 'AGUARDANDO',
  })
  const [criandoPacote, setCriandoPacote] = useState(false)

  // Ao receber um novo paciente, prepara o estado e só então libera a abertura do modal
  // (mesmo comportamento de antes: o modal só aparece quando os dados já estão prontos)
  useEffect(() => {
    if (!paciente) {
      setPronto(false)
      return
    }

    let cancelado = false
    async function preparar() {
      setDataMarcar(new Date())
      setGradeMarcar(null)
      setHorarioMarcar(null)
      setSlotMarcar(null)
      setPacoteMarcar(null)
      setEtapa('escolher_data')

      try {
        const disponiveis = await buscarPacotesDisponiveis(paciente!.id)
        if (cancelado) return
        setPacotesMarcar(disponiveis)

        if (disponiveis.length === 0) {
          const profRes = await api.get('/profissional/me')
          if (cancelado) return
          const p: Precos = profRes.data
          setPrecos(p)
          setFormPacote({
            tipo: 'PACOTE_5',
            valor_cobrado: precoPadraoParaTipo('PACOTE_5', p),
            status_pagamento: 'AGUARDANDO',
          })
          setEtapa('sem_pacote')
        } else {
          if (disponiveis.length === 1) setPacoteMarcar(disponiveis[0])
          setEtapa('escolher_data')
        }
      } catch {
        toast.error('Não foi possível carregar os pacotes deste paciente.')
      }

      if (!cancelado) setPronto(true)
    }
    preparar()

    return () => { cancelado = true }
  }, [paciente])

  async function handleCriarPacoteParaMarcar() {
    if (!paciente || !formPacote.valor_cobrado) return
    setCriandoPacote(true)
    try {
      const response = await api.post(`/pacientes/${paciente.id}/pacotes`, {
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
        sessoes_limite: LIMITE_SESSOES_POR_TIPO[pacoteCriado.tipo as Pacote['tipo']],
      }

      setPacotesMarcar([novoPacote])
      setPacoteMarcar(novoPacote)
      setEtapa('escolher_data')
      toast.success('Pacote criado! Agora escolha a data da sessão.')
    } catch {
      toast.error('Não foi possível criar o pacote.')
    } finally {
      setCriandoPacote(false)
    }
  }

  async function handleCarregarGradeMarcar(data: Date) {
    setDataMarcar(data)
    setCarregandoGradeMarcar(true)
    setHorarioMarcar(null)
    setSlotMarcar(null)
    try {
      const response = await api.get(`/agenda?data=${formatarDataISO(data)}`)
      setGradeMarcar(response.data)
      setEtapa('escolher_slot')
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
      onClose()
      onAgendado()
    } catch {
      toast.error('Não foi possível agendar a sessão.')
    }
    finally { setAgendandoMarcar(false) }
  }

  return (<>
    <Dialog open={!!paciente && pronto} onOpenChange={(aberto) => { if (!aberto) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {(etapa === 'escolher_slot' || etapa === 'criar_pacote_marcar') && (
              <button onClick={() => setEtapa(etapa === 'criar_pacote_marcar' ? 'sem_pacote' : 'escolher_data')} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {etapa === 'selecionar_pacote_marcar' && (
              <button onClick={() => setEtapa('escolher_slot')} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <DialogTitle className="truncate">Marcar sessão — {paciente?.nome}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">

          {/* Etapa 1: escolher data */}
          {etapa === 'escolher_data' && (
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
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
              </div>
            </>
          )}

          {/* Etapa 2: escolher horário e vaga */}
          {etapa === 'escolher_slot' && gradeMarcar && (
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
                            Vaga {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {gradeMarcar.horarios.every((h) => h.slots.every((s) => s.agendamento)) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma vaga disponível neste dia.</p>
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
                      setEtapa('selecionar_pacote_marcar')
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
          {etapa === 'sem_pacote' && (
            <>
              <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <Package className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  <span className="font-medium">{paciente?.nome}</span> não tem pacotes com sessões disponíveis. Crie um pacote para continuar.
                </p>
              </div>
              <Button className="w-full gap-2" onClick={() => setEtapa('criar_pacote_marcar')}>
                <Package className="w-4 h-4" />
                Criar novo pacote
              </Button>
              <Button variant="outline" className="w-full" onClick={onClose}>
                Cancelar
              </Button>
            </>
          )}

          {/* Etapa: criar pacote dentro do fluxo de marcar sessão */}
          {etapa === 'criar_pacote_marcar' && (
            <>
              <FormularioPacote
                valor={formPacote}
                precos={precos}
                onChange={setFormPacote}
                idValor="valor_pacote_marcar_sessao"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="flex-1 gap-2" disabled={criandoPacote || !formPacote.valor_cobrado} onClick={handleCriarPacoteParaMarcar}>
                  {criandoPacote ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {criandoPacote ? 'Criando...' : 'Criar pacote'}
                </Button>
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
              </div>
            </>
          )}

          {/* Etapa: selecionar pacote (sempre tem ao menos 2, pois length 0 é tratado acima e length 1 confirma direto) */}
          {etapa === 'selecionar_pacote_marcar' && (
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
                        <p className="font-medium text-foreground">{labelTipoPacote(pacote.tipo)}</p>
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
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  </>)
})

export { ModalMarcarSessao }
