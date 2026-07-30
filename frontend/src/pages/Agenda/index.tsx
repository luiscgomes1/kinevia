import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TimelineDia } from './TimelineDia'
import { VisaoSemanal } from './VisaoSemanal'
import { VisaoMensal } from './VisaoMensal'
import { ModalAgendamentoRapido } from './ModalAgendamentoRapido'
import { ModalMarcarSessao } from './ModalMarcarSessao'
import 'react-day-picker/dist/style.css'
import { AgendaProvider, useAgenda } from './AgendaContext'

function formatarDataExibicao(data: Date): string {
  return data.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function AgendaContent() {
  const { dataSelecionada, setDataSelecionada, visao, setVisao } = useAgenda()
  const [mostrarCalendarioMobile, setMostrarCalendarioMobile] = useState(false)

  function avancarDia(direcao: 1 | -1) {
    const nova = new Date(dataSelecionada)
    nova.setDate(nova.getDate() + direcao)
    setDataSelecionada(nova)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full">
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

      <div className="flex-1 min-w-0 space-y-4">
        {visao !== 'mensal' && (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <button onClick={() => avancarDia(-1)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </button>
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
              <button onClick={() => setDataSelecionada(new Date())} className="text-xs text-primary hover:underline shrink-0 ml-2">
                Hoje
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2">
          {visao === 'mensal' ? <div /> : null}
          <div className="flex items-center bg-muted rounded-lg p-0.5 ml-auto">
            <button
              onClick={() => setVisao('diaria')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${visao === 'diaria' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Diária
            </button>
            <button
              onClick={() => setVisao('semanal')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${visao === 'semanal' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Semanal
            </button>
            <button
              onClick={() => setVisao('mensal')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${visao === 'mensal' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Mês
            </button>
          </div>
        </div>

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

        {visao === 'mensal' ? <VisaoMensal /> : visao === 'semanal' ? <VisaoSemanal /> : <TimelineDia />}
      </div>

      <ModalAgendamentoRapido />
      <ModalMarcarSessao />
    </div>
  )
}

export default function AgendaPage() {
  return (
    <AgendaProvider>
      <AgendaContent />
    </AgendaProvider>
  )
}
