import { memo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAgenda } from './AgendaContext'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function formatarDataISO(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export const VisaoMensal = memo(function VisaoMensal() {
  const {
    mesSelecionado, navegarMes,
    diasComAgendamento, carregandoResumo,
    dataSelecionada, setDataSelecionada, setVisao,
  } = useAgenda()

  const ano = mesSelecionado.getFullYear()
  const mes = mesSelecionado.getMonth()

  const primeiroDia = new Date(ano, mes, 1)
  const ultimoDia = new Date(ano, mes + 1, 0)
  const diasNoMes = ultimoDia.getDate()
  const inicioSemana = primeiroDia.getDay()
  const hoje = new Date()

  function handleDiaClick(dia: number) {
    const data = new Date(ano, mes, dia)
    setDataSelecionada(data)
    setVisao('diaria')
  }

  const celulas: (number | null)[] = []
  for (let i = 0; i < inicioSemana; i++) celulas.push(null)
  for (let d = 1; d <= diasNoMes; d++) celulas.push(d)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navegarMes(-1)}
          aria-label="Mês anterior"
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold text-foreground">
          {MESES[mes]} {ano}
        </h2>
        <button
          onClick={() => navegarMes(1)}
          aria-label="Próximo mês"
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {carregandoResumo && (
        <div className="flex gap-1">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 h-8 bg-muted/70 animate-pulse rounded" />
          ))}
        </div>
      )}

      <div className="grid grid-cols-7 gap-0.5">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
        {celulas.map((dia, i) => {
          if (dia === null) return <div key={`e-${i}`} />

          const dataAtual = new Date(ano, mes, dia)
          const selecionado = formatarDataISO(dataAtual) === formatarDataISO(dataSelecionada)
          const ehHoje = formatarDataISO(dataAtual) === formatarDataISO(hoje)
          const temAgenda = diasComAgendamento.includes(dia)

          return (
            <button
              key={dia}
              onClick={() => handleDiaClick(dia)}
              className={`
                relative flex flex-col items-center justify-center py-1.5 rounded-lg text-sm transition-colors
                ${selecionado ? 'bg-primary text-white font-bold' : 'hover:bg-accent text-foreground'}
                ${ehHoje && !selecionado ? 'ring-1 ring-primary/40' : ''}
              `}
            >
              {dia}
              {temAgenda && (
                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${selecionado ? 'bg-white' : 'bg-primary'}`} />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full ring-1 bg-primary" />
          Datas com agendamento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full ring-1 ring-primary/40" />
          Dia selecionado
        </span>
      </div>
    </div>
  )
})
