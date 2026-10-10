import { useState, useEffect, memo } from 'react'
import { Plus, Clock } from 'lucide-react'
import { PopoverAgendamento } from './PopoverAgendamento'
import { useAgenda } from './AgendaContext'

type StatusAgendamento = 'AGENDADO' | 'COMPARECEU' | 'FALTOU' | 'DESMARCOU'

const corFaixaStatus: Record<StatusAgendamento, string> = {
  AGENDADO: '#2563EB',
  COMPARECEU: '#63D391',
  FALTOU: '#DC2626',
  DESMARCOU: '#9CA3AF',
}

const corBadgeStatus: Record<StatusAgendamento, string> = {
  AGENDADO: 'text-blue-700 bg-blue-50',
  COMPARECEU: 'text-green-700 bg-verde-claro/15',
  FALTOU: 'text-red-700 bg-red-50',
  DESMARCOU: 'text-muted-foreground bg-muted',
}

function horarioEmMinutos(horario: string): number {
  const [h, m] = horario.split(':').map(Number)
  return h * 60 + m
}

function AgoraMarker({ horaAtualFormatada, semEspinha }: { horaAtualFormatada: string; semEspinha: boolean }) {
  return (
    <div className="relative flex gap-4 pb-3 -mt-2">
      <div className="relative w-9 shrink-0 flex justify-center">
        {semEspinha ? null : (
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-border" />
        )}
      </div>
      <div className="flex-1 flex items-center gap-2 pt-2">
        <div className="flex-1 h-px bg-turquesa" />
        <span className="flex items-center gap-1 text-[11px] font-medium text-turquesa bg-turquesa/10 px-2 py-0.5 rounded-full whitespace-nowrap [font-variant-numeric:tabular-nums]">
          <Clock className="w-3 h-3" />
          agora, {horaAtualFormatada}
        </span>
      </div>
    </div>
  )
}

/**
 * Visão diária da Agenda em formato de linha do tempo — redesign de
 * 06/07/2026 (ver decisoes-design.md). Substitui a grade/tabela anterior.
 *
 * Ajustes de 06/07 após testes reais (ver pendencias-pos-mvp.md):
 * - Linha/bolinhas usam `left-1/2 -translate-x-1/2` pra alinhamento exato
 * - Vagas vazias do mesmo horário viram UM chip compacto
 * - "agora" mostra a hora atual e se atualiza sozinho a cada minuto (sem F5)
 * - Espinha agora continua por trás do marcador "agora" — antes tinha um
 *   gap ali, porque o marcador era um bloco separado sem segmento próprio
 */
const TimelineDia = memo(function TimelineDia() {
  const { grade, carregando, ehHoje, dataSelecionada, setTriggerRapido, profissionalFiltroId } = useAgenda()
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const intervalo = setInterval(() => setAgora(new Date()), 60_000)
    return () => clearInterval(intervalo)
  }, [])

  if (carregando) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 space-y-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="w-3 h-3 rounded-full bg-muted animate-pulse shrink-0 mt-1" />
            <div className="flex-1 h-9 bg-muted/70 animate-pulse rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  const minutosAgora = agora.getHours() * 60 + agora.getMinutes()
  const horaAtualFormatada = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`

  const primeiroHorario = grade?.horarios[0]?.horario
  const ultimoHorario = grade?.horarios[grade.horarios.length - 1]?.horario
  const antesDoPrimeiro = ehHoje && primeiroHorario && minutosAgora < horarioEmMinutos(primeiroHorario)
  const depoisDoUltimo = ehHoje && ultimoHorario && minutosAgora > horarioEmMinutos(ultimoHorario)

  return (
    <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
      {profissionalFiltroId && grade?.profissional_nome && (
        <div className="mb-3 text-xs text-muted-foreground">
          Agenda de: <span className="font-medium text-foreground">{grade.profissional_nome}</span>
        </div>
      )}
      <div>
        {/* Marcador "agora" antes do primeiro horário */}
        {antesDoPrimeiro && <AgoraMarker horaAtualFormatada={horaAtualFormatada} semEspinha />}

        {grade?.horarios.map(({ horario, slots }, index) => {
          const ehUltimo = index === grade.horarios.length - 1
          const proximoHorario = grade.horarios[index + 1]?.horario
          const mostrarAgoraDepoisDeste =
            ehHoje &&
            minutosAgora >= horarioEmMinutos(horario) &&
            (!proximoHorario || minutosAgora < horarioEmMinutos(proximoHorario))

          const preenchidos = slots.filter((s) => s.agendamento)
          const vazios = slots.filter((s) => !s.agendamento)
          const algumOcupado = preenchidos.length > 0

          return (
            <div key={horario}>
              <div className="relative flex gap-4 pb-5">
                <div className="relative flex flex-col items-center w-9 shrink-0">
                  {/* Segmento da espinha, atrás do nó — centralizado do mesmo jeito que o nó, garante alinhamento exato */}
                  {!ehUltimo && (
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-border" />
                  )}
                  <div
                    className={`relative w-3 h-3 rounded-full mt-1 ${
                      algumOcupado ? 'bg-primary' : 'bg-card border-2 border-primary/40'
                    }`}
                  />
                  <span className="relative text-xs font-medium text-foreground mt-1.5 [font-variant-numeric:tabular-nums] bg-card px-0.5">
                    {horario}
                  </span>
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-1.5 pt-0.5">
                    {preenchidos.map(({ slot, agendamento }) => (
                    <PopoverAgendamento
                      key={slot}
                      agendamento={agendamento!}
                      horario={horario}
                      slot={slot}
                    >
                      <button
                        className="flex items-center justify-between gap-2 w-full sm:w-auto sm:min-w-[220px] bg-card border border-border py-2 pl-3 pr-2.5 text-left transition-colors hover:bg-accent"
                        style={{ borderLeft: `3px solid ${corFaixaStatus[agendamento!.status]}`, borderRadius: '0 0.5rem 0.5rem 0' }}
                      >
                        <span className="text-sm font-medium text-foreground truncate">
                          {agendamento!.paciente.nome}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${corBadgeStatus[agendamento!.status]}`}>
                          {agendamento!.status === 'AGENDADO' && 'Agendado'}
                          {agendamento!.status === 'COMPARECEU' && 'Compareceu'}
                          {agendamento!.status === 'FALTOU' && 'Faltou'}
                          {agendamento!.status === 'DESMARCOU' && 'Desmarcou'}
                        </span>
                      </button>
                    </PopoverAgendamento>
                  ))}

                  {/* Vagas vazias do horário — um único chip compacto, não um botão por vaga */}
                  {vazios.length > 0 && (
                    <button
                      onClick={() => setTriggerRapido({ data: dataSelecionada, horario, slot: vazios[0].slot })}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-border text-muted-foreground/70 hover:border-primary hover:text-primary transition-colors text-xs w-fit"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {vazios.length === 1 ? '1 vaga disponível' : `${vazios.length} vagas disponíveis`}
                    </button>
                  )}
                </div>
              </div>

              {mostrarAgoraDepoisDeste && !(ehUltimo && depoisDoUltimo) && <AgoraMarker horaAtualFormatada={horaAtualFormatada} semEspinha={false} />}

              {/* Depois do último horário da grade */}
              {ehUltimo && depoisDoUltimo && <AgoraMarker horaAtualFormatada={horaAtualFormatada} semEspinha />}
            </div>
          )
        })}

        {grade?.horarios.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum horário configurado no expediente.</p>
        )}
      </div>
    </div>
  )
})

export { TimelineDia }
