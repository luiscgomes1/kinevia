import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Filter, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import api from '@/services/api'
import { useProfissionais } from '@/hooks/useProfissionais'

const rotulosAcao: Record<string, string> = {
  PRONTUARIO_VISUALIZADO: 'Visualizou prontuário',
  PRONTUARIO_ATUALIZADO: 'Atualizou avaliação inicial',
  EVOLUCAO_VISUALIZADA: 'Visualizou evolução',
  EVOLUCAO_CRIADA: 'Criou evolução',
  EVOLUCAO_CORRIGIDA: 'Corrigiu evolução',
  LAUDO_VISUALIZADO: 'Visualizou laudo',
  LAUDO_PDF_GERADO: 'Gerou PDF do laudo',
  LAUDO_CRIADO: 'Criou laudo',
  LAUDO_EDITADO: 'Editou laudo',
  LAUDO_EXCLUIDO: 'Excluiu laudo',
  PACOTE_CRIADO: 'Criou pacote',
  PACOTE_PAGAMENTO_ALTERADO: 'Alterou pagamento do pacote',
  SESSAO_AGENDADA: 'Agendou sessão',
  AGENDAMENTO_STATUS_ALTERADO: 'Alterou status do agendamento',
  PACIENTE_EXPORTADO: 'Exportou paciente',
  PACIENTE_ANONIMIZADO: 'Anonimizou paciente',
  PACIENTE_TRANSFERIDO: 'Transferiu paciente',
  PACIENTE_REMOVIDO: 'Removeu paciente',
  PACIENTE_REATIVADO: 'Reativou paciente',
}

const todasAcoes = Object.keys(rotulosAcao)

const labelsTipoPacote: Record<string, string> = {
  INDIVIDUAL: 'Sessão individual',
  PACOTE_5: 'Pacote 5',
  PACOTE_10: 'Pacote 10',
}

const labelsPagamento: Record<string, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
}

const labelsStatusAgendamento: Record<string, string> = {
  AGENDADO: 'Agendado',
  COMPARECEU: 'Compareceu',
  FALTOU: 'Faltou',
  DESMARCOU: 'Desmarcou',
}

const labelsTipoLaudo: Record<string, string> = {
  CLINICO: 'clínico',
  COMPLETO: 'completo (perícia)',
  REEMBOLSO: 'reembolso',
}

function formatarDetalhes(log: AuditLog, nomeMap: Map<string, string>): string {
  if (!log.metadata) return '-'
  if (log.acao === 'EVOLUCAO_CRIADA' || log.acao === 'EVOLUCAO_CORRIGIDA' || log.acao === 'LAUDO_PDF_GERADO') return '-'
  const m = log.metadata as Record<string, string | number>
  if (
    log.acao === 'LAUDO_CRIADO' ||
    log.acao === 'LAUDO_EDITADO' ||
    log.acao === 'LAUDO_EXCLUIDO' ||
    log.acao === 'LAUDO_PDF_GERADO'
  ) {
    const tipo = labelsTipoLaudo[String(m.tipo)] ?? ''
    return tipo ? `Laudo ${tipo}` : '-'
  }
  if (log.acao === 'PACIENTE_TRANSFERIDO' && typeof m.de === 'string') {
    const de = (m.de_nome as string) || nomeMap.get(m.de) || m.de
    const para = (m.para_nome as string) || nomeMap.get(m.para as string) || String(m.para ?? '')
    const partes = [`De: ${de}`, `Para: ${para}`]
    if (typeof m.agendamentos === 'number') partes.push(`${m.agendamentos} agendamentos`)
    if (typeof m.pacotes === 'number') partes.push(`${m.pacotes} pacotes`)
    if (typeof m.laudos === 'number') partes.push(`${m.laudos} laudos`)
    return partes.join(' · ')
  }
  if (log.acao === 'PACOTE_CRIADO') {
    const tipo = labelsTipoPacote[String(m.tipo)] || String(m.tipo)
    const valor = typeof m.valor_cobrado === 'number'
      ? `R$ ${m.valor_cobrado.toFixed(2).replace('.', ',')}`
      : ''
    return `Pacote ${tipo}${valor ? ` · ${valor}` : ''}`
  }
  if (log.acao === 'PACOTE_PAGAMENTO_ALTERADO') {
    return `Pagamento: ${labelsPagamento[String(m.status_pagamento)] || String(m.status_pagamento)}`
  }
  if (log.acao === 'SESSAO_AGENDADA' && typeof m.data === 'string') {
    const data = m.data.split('-')
    const dataFmt = data.length === 3 ? `${data[2]}/${data[1]}/${data[0]}` : m.data
    return `Sessão em ${dataFmt}${m.horario ? ` às ${m.horario}` : ''}`
  }
  if (log.acao === 'AGENDAMENTO_STATUS_ALTERADO') {
    return `Status: ${labelsStatusAgendamento[String(m.status)] || String(m.status)}`
  }
  return JSON.stringify(log.metadata)
}

interface AuditLog {
  id: string
  profissional_id: string
  profissional_nome: string
  paciente_id: string | null
  paciente_nome: string | null
  acao: string
  metadata: Record<string, unknown> | null
  criado_em: string
}

export default function AuditoriaPage() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [pagina, setPagina] = useState(0)
  const limite = 50

  // Filtros
  const [filtroProfissional, setFiltroProfissional] = useState('')
  const [filtroAcao, setFiltroAcao] = useState('')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')

  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const { profissionais } = useProfissionais({ excluirAtendentes: false })

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const params = new URLSearchParams({ limit: String(limite), offset: String(pagina * limite) })
      if (filtroProfissional) params.set('profissional_id', filtroProfissional)
      if (filtroAcao) params.set('acao', filtroAcao)
      if (filtroDataInicio) params.set('data_inicio', filtroDataInicio)
      if (filtroDataFim) params.set('data_fim', filtroDataFim)
      const res = await api.get(`/admin/auditoria?${params}`)
      setLogs(res.data.logs)
      setTotal(res.data.total)
    } catch {
      navigate('/admin')
    } finally {
      setCarregando(false)
    }
  }, [pagina, filtroProfissional, filtroAcao, filtroDataInicio, filtroDataFim, navigate])

  useEffect(() => {
    async function inicial() {
      await carregar()
    }
    void inicial()
  }, [carregar])

  async function exportarCsv() {
    const params = new URLSearchParams()
    if (filtroProfissional) params.set('profissional_id', filtroProfissional)
    if (filtroAcao) params.set('acao', filtroAcao)
    if (filtroDataInicio) params.set('data_inicio', filtroDataInicio)
    if (filtroDataFim) params.set('data_fim', filtroDataFim)
    try {
      const res = await api.get(`/admin/auditoria/exportar?${params}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(res.data)
      const link = document.createElement('a')
      link.href = url
      link.download = 'auditoria.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Não foi possível exportar o CSV.')
    }
  }

  const nomeMap = new Map(profissionais.map((p) => [p.id, p.nome]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Auditoria</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Histórico de ações dos profissionais
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={filtroProfissional}
          onChange={(e) => { setFiltroProfissional(e.target.value); setPagina(0) }}
          className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">Todos os profissionais</option>
          {profissionais.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={() => setMostrarFiltros(!mostrarFiltros)} className="gap-1.5">
          <Filter className="w-4 h-4" />
          Filtros
        </Button>
        <Button variant="outline" size="sm" onClick={exportarCsv} className="gap-1.5">
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      {mostrarFiltros && (
        <div className="bg-card rounded-xl border border-border p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Tipo de ação</label>
            <select
              value={filtroAcao}
              onChange={(e) => { setFiltroAcao(e.target.value); setPagina(0) }}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Todas</option>
              {todasAcoes.map((acao) => (
                <option key={acao} value={acao}>{rotulosAcao[acao]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Data início</label>
            <Input type="date" value={filtroDataInicio} onChange={(e) => { setFiltroDataInicio(e.target.value); setPagina(0) }} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Data fim</label>
            <Input type="date" value={filtroDataFim} onChange={(e) => { setFiltroDataFim(e.target.value); setPagina(0) }} />
          </div>
        </div>
      )}

      {carregando ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Nenhum registro encontrado.</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{total} registro{total !== 1 ? 's' : ''}</p>
          <div className="bg-card rounded-xl border border-border overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-muted/50 text-sm text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Data</th>
                  <th className="text-left px-4 py-3 font-medium">Profissional</th>
                  <th className="text-left px-4 py-3 font-medium">Ação</th>
                  <th className="text-left px-4 py-3 font-medium">Paciente</th>
                  <th className="text-left px-4 py-3 font-medium">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {new Date(log.criado_em).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">{log.profissional_nome}</td>
                    <td className="px-4 py-3">{rotulosAcao[log.acao] || log.acao}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.paciente_nome || (log.paciente_id ? log.paciente_id.slice(0, 8) + '...' : '-')}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[320px] truncate">
                      {formatarDetalhes(log, nomeMap)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > limite && (
            <div className="flex items-center justify-center gap-2">
              <button
                disabled={pagina === 0}
                onClick={() => setPagina((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-muted-foreground">
                {pagina + 1} de {Math.ceil(total / limite)}
              </span>
              <button
                disabled={(pagina + 1) * limite >= total}
                onClick={() => setPagina((p) => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
