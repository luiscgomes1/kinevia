import { DayPicker } from 'react-day-picker'
import { ptBR } from 'date-fns/locale'
import { Calendar, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import 'react-day-picker/dist/style.css'
import { labelTipoPacote as labelTipo } from '@/lib/pacotes'
import type { TipoPacote } from '@/lib/pacotes'

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

interface ModalAgendarSessaoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pacote: { tipo: TipoPacote } | null
  gradeAgendar: GradeAgenda | null
  carregandoGrade: boolean
  dataAgendar: Date
  onDataChange: (data: Date) => void
  etapaAgendar: 'data' | 'slot'
  onEtapaChange: (etapa: 'data' | 'slot') => void
  horarioEscolhido: string | null
  slotEscolhido: number | null
  onSlotEscolher: (horario: string, slot: number) => void
  onVerHorarios: () => void
  onConfirmar: () => void
  confirmandoAgendamento: boolean
}

export function ModalAgendarSessao({
  open,
  onOpenChange,
  pacote,
  gradeAgendar,
  carregandoGrade,
  dataAgendar,
  onDataChange,
  etapaAgendar,
  onEtapaChange,
  horarioEscolhido,
  slotEscolhido,
  onSlotEscolher,
  onVerHorarios,
  onConfirmar,
  confirmandoAgendamento,
}: ModalAgendarSessaoProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Agendar sessão — {pacote && labelTipo(pacote.tipo)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {etapaAgendar === 'data' && (
            <>
              <p className="text-sm text-muted-foreground">Escolha a data para a próxima sessão:</p>
              <div className="flex justify-center">
                <DayPicker
                  mode="single"
                  selected={dataAgendar}
                  onSelect={(d) => d && onDataChange(d)}
                  locale={ptBR}
                  disabled={{ before: new Date() }}
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 gap-2" disabled={carregandoGrade} onClick={onVerHorarios}>
                  {carregandoGrade ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                  {carregandoGrade ? 'Carregando...' : 'Ver horários disponíveis'}
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              </div>
            </>
          )}

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
                            onClick={() => onSlotEscolher(horario, slot)}
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
                  onClick={onConfirmar}
                >
                  {confirmandoAgendamento
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle2 className="w-4 h-4" />
                  }
                  {confirmandoAgendamento ? 'Agendando...' : 'Confirmar'}
                </Button>
                <Button variant="outline" onClick={() => onEtapaChange('data')}>Voltar</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
