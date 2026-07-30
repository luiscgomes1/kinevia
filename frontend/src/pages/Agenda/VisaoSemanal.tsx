import { useState, useEffect, useCallback, memo } from 'react'
import { toast } from 'sonner'
import { PopoverAgendamento } from './PopoverAgendamento'
import { formatarDataISO, mesmoDia } from '@/lib/data'
import api from '@/services/api'
import { useAgenda } from './AgendaContext'

type StatusAgendamento = 'AGENDADO' | 'COMPARECEU' | 'FALTOU' | 'DESMARCOU'

interface Agendamento {
  id: string
  paciente: { id: string; nome: string }
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

interface GradeAgenda {
  data: string
  horarios: Horario[]
}

const corSegmentoStatus: Record<StatusAgendamento, string> = {
  AGENDADO: 'bg-blue-600',
  COMPARECEU: 'bg-verde-claro',
  FALTOU: 'bg-red-600',
  DESMARCOU: 'bg-muted-foreground/40',
}

const DIAS_SEMANA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']

function inicioDaSemana(data: Date): Date {
  const d = new Date(data)
  const diaDaSemana = d.getDay()
  const deslocamento = diaDaSemana === 0 ? -6 : 1 - diaDaSemana
  d.setDate(d.getDate() + deslocamento)
  return d
}

const VisaoSemanal = memo(function VisaoSemanal() {
  const { dataSelecionada, setDataSelecionada, setTriggerRapido, chaveRecarga, setVisao } = useAgenda()
  const [grades, setGrades] = useState<GradeAgenda[]>([])
  const [carregando, setCarregando] = useState(true)

  const segunda = inicioDaSemana(dataSelecionada)
  const segundaISO = formatarDataISO(segunda)
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(segunda)
    d.setDate(d.getDate() + i)
    return d
  })

  const carregarSemana = useCallback(async () => {
    setCarregando(true)
    try {
      const respostas = await Promise.all(
        dias.map((d) => api.get(`/agenda?data=${formatarDataISO(d)}`))
      )
      setGrades(respostas.map((r) => r.data))
    } catch {
      toast.error('Não foi possível carregar a agenda da semana.')
    } finally {
      setCarregando(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segundaISO])

  useEffect(() => {
    carregarSemana()
  }, [carregarSemana, chaveRecarga])

  // Union dos horários de todos os dias — evita semana vazia se o primeiro dia não tiver expediente
  const horarios = [...new Set(grades.flatMap(g => g?.horarios?.map(h => h.horario) ?? []))]
  const hoje = new Date()

  if (carregando) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-7 bg-muted/70 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border p-3 sm:p-4 overflow-x-auto">
      <table className="border-collapse w-full min-w-[560px]">
        <thead>
          <tr>
            <td className="w-12" />
            {dias.map((dia, i) => {
              const ehHoje = mesmoDia(dia, hoje)
              const ehSelecionado = !ehHoje && mesmoDia(dia, dataSelecionada)
              return (
                <td key={i} className="text-center pb-2 px-1">
                  <button
                    onClick={() => { setDataSelecionada(dia); setVisao('diaria') }}
                    className={`w-full rounded-t-lg py-1.5 transition-colors hover:bg-accent ${
                      ehHoje ? 'border-t-2 border-turquesa bg-turquesa/10' : ehSelecionado ? 'border-t-2 border-primary bg-primary/5' : ''
                    }`}
                  >
                    <span className={`block text-[11px] font-medium ${
                      ehHoje ? 'text-turquesa' : ehSelecionado ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {DIAS_SEMANA[i]}
                    </span>
                    <span className={`block text-xs font-semibold [font-variant-numeric:tabular-nums] ${
                      ehHoje ? 'text-turquesa' : ehSelecionado ? 'text-primary' : 'text-foreground'
                    }`}>
                      {dia.getDate().toString().padStart(2, '0')}
                    </span>
                  </button>
                </td>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {horarios.map((horario) => (
            <tr key={horario}>
              <td className="text-xs text-muted-foreground [font-variant-numeric:tabular-nums] py-1.5 pr-2 whitespace-nowrap">
                {horario}
              </td>
              {dias.map((dia, i) => {
                const grade = grades[i]
                const slots = grade?.horarios.find((h) => h.horario === horario)?.slots ?? []
                const ehHoje = mesmoDia(dia, hoje)
                const ehSelecionado = !ehHoje && mesmoDia(dia, dataSelecionada)
                return (
                  <td key={i} className={`text-center py-1.5 px-1 ${ehHoje ? 'bg-turquesa/5' : ehSelecionado ? 'bg-primary/5' : ''}`}>
                    <div className="flex items-center justify-center gap-0.5">
                      {slots.map(({ slot, agendamento }) => {
                        if (!agendamento) {
                          return (
                            <button
                              key={slot}
                              onClick={() => setTriggerRapido({ data: dia, horario, slot })}
                              title={`Vaga ${slot} disponível`}
                              className="w-2.5 h-4 rounded-sm bg-border hover:bg-primary/40 transition-colors"
                            />
                          )
                        }
                        return (
                          <PopoverAgendamento
                            key={slot}
                            agendamento={agendamento}
                            horario={horario}
                            slot={slot}
                          >
                            <button
                              title={`${agendamento.paciente.nome} · Vaga ${slot}`}
                              className={`w-2.5 h-4 rounded-sm hover:opacity-70 transition-opacity ${corSegmentoStatus[agendamento.status]}`}
                            />
                          </PopoverAgendamento>
                        )
                      })}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {horarios.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhum horário configurado no expediente.</p>
      )}

      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
        {[
          { cor: 'bg-blue-600', label: 'Agendado' },
          { cor: 'bg-verde-claro', label: 'Compareceu' },
          { cor: 'bg-red-600', label: 'Faltou' },
          { cor: 'bg-border', label: 'Livre' },
        ].map(({ cor, label }) => (
          <span key={label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={`w-2 h-2 rounded-sm ${cor}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
})

export { VisaoSemanal }
