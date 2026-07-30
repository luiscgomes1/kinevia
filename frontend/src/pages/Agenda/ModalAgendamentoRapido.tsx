import { useState, useEffect, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, CheckCircle2, Clock, Loader2, Package } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormularioPacote, type ValorFormularioPacote } from '@/components/FormularioPacote'
import {
  type Precos,
  type PacoteResumo as Pacote,
  labelTipoPacote,
  precoPadraoParaTipo,
  buscarPacotesDisponiveis,
} from '@/lib/pacotes'
import { formatarDataISO } from '@/lib/data'
import { useAgenda } from './AgendaContext'
import api from '@/services/api'

interface Paciente {
  id: string
  nome: string
}

type Etapa = 'buscar' | 'selecionar_pacote' | 'criar_pacote'

function formatarDataExibicao(data: Date): string {
  return data.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

const ModalAgendamentoRapido = memo(function ModalAgendamentoRapido() {
  const navigate = useNavigate()
  const { triggerRapido: trigger, fecharRapido: onClose, recarregar: onAgendado } = useAgenda()
  const [etapa, setEtapa] = useState<Etapa>('buscar')
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [buscaPaciente, setBuscaPaciente] = useState('')
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null)
  const [carregandoPacotes, setCarregandoPacotes] = useState(false)
  const [pacotesDisponiveis, setPacotesDisponiveis] = useState<Pacote[]>([])
  const [pacoteSelecionado, setPacoteSelecionado] = useState<Pacote | null>(null)
  const [agendando, setAgendando] = useState(false)
  const [precos, setPrecos] = useState<Precos | null>(null)
  const [formPacote, setFormPacote] = useState<ValorFormularioPacote>({
    tipo: 'PACOTE_5',
    valor_cobrado: '',
    status_pagamento: 'AGUARDANDO',
  })
  const [criandoPacote, setCriandoPacote] = useState(false)

  // Reseta o estado toda vez que uma nova vaga é clicada
  useEffect(() => {
    if (!trigger) return
    setEtapa('buscar')
    setBuscaPaciente('')
    setPacienteSelecionado(null)
    setPacotesDisponiveis([])
    setPacoteSelecionado(null)
  }, [trigger])

  // Busca incremental de pacientes (debounced)
  useEffect(() => {
    const controller = new AbortController()
    const t = setTimeout(async () => {
      try {
        const response = await api.get(`/pacientes?busca=${buscaPaciente}`, { signal: controller.signal })
        setPacientes(response.data)
      } catch {
        /* silencioso — busca incremental, não vale interromper com toast a cada tecla */
      }
    }, 300)
    return () => {
      controller.abort()
      clearTimeout(t)
    }
  }, [buscaPaciente])

  async function handleSelecionarPaciente(paciente: Paciente) {
    setPacienteSelecionado(paciente)
    setBuscaPaciente(paciente.nome)
    setCarregandoPacotes(true)
    try {
      const disponiveis = await buscarPacotesDisponiveis(paciente.id)
      setPacotesDisponiveis(disponiveis)
      if (disponiveis.length === 0) {
        const profRes = await api.get('/profissional/me')
        const p: Precos = profRes.data
        setPrecos(p)
        setFormPacote((prev) => ({ ...prev, valor_cobrado: precoPadraoParaTipo(prev.tipo, p) }))
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

  async function handleCriarPacoteEAgendar() {
    if (!pacienteSelecionado || !trigger || !formPacote.valor_cobrado) return
    setCriandoPacote(true)
    try {
      const pacoteRes = await api.post(`/pacientes/${pacienteSelecionado.id}/pacotes`, {
        tipo: formPacote.tipo,
        valor_cobrado: Number(formPacote.valor_cobrado),
        status_pagamento: formPacote.status_pagamento,
      })
      try {
        await api.post(`/pacotes/${pacoteRes.data.pacote.id}/sessoes`, {
          data: formatarDataISO(trigger.data),
          horario: trigger.horario,
          slot: trigger.slot,
        })
      } catch {
        // Limpa o pacote órfão se o agendamento falhar
        try { await api.delete(`/pacotes/${pacoteRes.data.pacote.id}`) } catch {}
        throw new Error('Falha ao agendar sessão. Pacote removido.')
      }
      toast.success('Pacote criado e sessão agendada!')
      onClose()
      onAgendado()
    } catch {
      toast.error('Não foi possível criar o pacote e agendar a sessão.')
    }
    finally { setCriandoPacote(false) }
  }

  async function handleAgendar() {
    if (!pacoteSelecionado || !trigger) return
    setAgendando(true)
    try {
      await api.post(`/pacotes/${pacoteSelecionado.id}/sessoes`, {
        data: formatarDataISO(trigger.data),
        horario: trigger.horario,
        slot: trigger.slot,
      })
      toast.success('Sessão agendada com sucesso!')
      onClose()
      onAgendado()
    } catch {
      toast.error('Não foi possível agendar a sessão.')
    }
    finally { setAgendando(false) }
  }

  return (<>
    <Dialog open={!!trigger} onOpenChange={(aberto) => { if (!aberto) onClose() }}>
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

        {trigger && (
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">
                {formatarDataExibicao(trigger.data)} · {trigger.horario} · Vaga {trigger.slot}
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
                          <p className="font-medium text-foreground">{labelTipoPacote(pacote.tipo)}</p>
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
                  <Button variant="outline" onClick={onClose}>Cancelar</Button>
                </div>
              </>
            )}

            {etapa === 'criar_pacote' && (
              <>
                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  <Package className="w-4 h-4 shrink-0 mt-0.5" />
                  <p><span className="font-medium">{pacienteSelecionado?.nome}</span> não tem pacote disponível. Crie um para continuar.</p>
                </div>
                <FormularioPacote
                  valor={formPacote}
                  precos={precos}
                  onChange={setFormPacote}
                  idValor="valor_pacote_agendamento_rapido"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button className="flex-1 gap-2" disabled={criandoPacote || !formPacote.valor_cobrado} onClick={handleCriarPacoteEAgendar}>
                    {criandoPacote ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {criandoPacote ? 'Criando...' : 'Criar e agendar'}
                  </Button>
                  <Button variant="outline" onClick={onClose}>Cancelar</Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  </>)
})

export { ModalAgendamentoRapido }
