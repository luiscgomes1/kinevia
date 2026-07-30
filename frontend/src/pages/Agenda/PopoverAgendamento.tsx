import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, ClipboardList, Calendar, FileText,
  CheckCircle2, XCircle, MinusCircle, Loader2,
} from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useAgenda } from './AgendaContext'

interface Agendamento {
  id: string
  paciente: { id: string; nome: string }
  status: 'AGENDADO' | 'COMPARECEU' | 'FALTOU' | 'DESMARCOU'
}

interface Props {
  agendamento: Agendamento
  horario: string
  slot: number
  children: React.ReactNode
}

const PopoverAgendamento = memo(function PopoverAgendamento({
  agendamento, horario, slot, children,
}: Props) {
  const navigate = useNavigate()
  const { atualizandoStatus, atualizarStatus, marcarSessao } = useAgenda()

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start">
        <div className="px-2 py-1.5 mb-1">
          <p className="text-xs font-semibold text-foreground truncate">{agendamento.paciente.nome}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{horario} · Vaga {slot}</p>
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
              onClick={() => atualizarStatus(agendamento.id, status)}
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
            { icon: Calendar, label: 'Marcar sessão', acao: () => marcarSessao(agendamento.paciente) },
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
  )
})

export { PopoverAgendamento }
