import { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2, FileText, Download, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import api from '@/services/api'

interface Laudo {
  id: string
  tipo_assinatura: 'DIGITAL' | 'MANUSCRITA'
  criado_em: string
}

interface ConteudoLaudo {
  quadro_clinico: string
  achados_exame: string
  diagnostico_funcional: string
  conclusao: string
  diagnostico_medico: string
  medico_solicitante: string
  data_inicio: string
  frequencia_semanal: string
}

function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

interface Props {
  pacienteId: string
}

export default function LaudosTab({ pacienteId }: Props) {
  const [laudos, setLaudos] = useState<Laudo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gerando, setGerando] = useState(false)

  // Modal de edição
  const [modalAberto, setModalAberto] = useState(false)
  const [laudoEditando, setLaudoEditando] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [conteudo, setConteudo] = useState<ConteudoLaudo>({
    quadro_clinico: '',
    achados_exame: '',
    diagnostico_funcional: '',
    conclusao: '',
    diagnostico_medico: '',
    medico_solicitante: '',
    data_inicio: '',
    frequencia_semanal: '',
  })
  const [tipoAssinatura, setTipoAssinatura] = useState<'DIGITAL' | 'MANUSCRITA'>('MANUSCRITA')

  const carregar = useCallback(async () => {
    try {
      const response = await api.get(`/pacientes/${pacienteId}/laudos`)
      setLaudos(response.data)
    } catch {
      // silencioso
    } finally {
      setCarregando(false)
    }
  }, [pacienteId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar()
  }, [carregar])

  async function handleGerarLaudo() {
    setGerando(true)
    try {
      const response = await api.post(`/pacientes/${pacienteId}/laudos`, {
        tipo_assinatura: 'MANUSCRITA',
      })
      // Abre o modal de edição já com o laudo criado
      await handleAbrirEdicao(response.data.id)
      carregar()
    } catch {
      // silencioso
    } finally {
      setGerando(false)
    }
  }

  async function handleAbrirEdicao(laudoId: string) {
    try {
      const response = await api.get(`/laudos/${laudoId}`)
      const c = response.data.conteudo as ConteudoLaudo
      setConteudo(c)
      setTipoAssinatura(response.data.tipo_assinatura)
      setLaudoEditando(laudoId)
      setModalAberto(true)
    } catch {
      // silencioso
    }
  }

  async function handleSalvarEdicao() {
    if (!laudoEditando) return
    setSalvando(true)
    try {
      await api.put(`/laudos/${laudoEditando}`, {
        conteudo,
        tipo_assinatura: tipoAssinatura,
      })
      setModalAberto(false)
      carregar()
    } catch {
      // silencioso
    } finally {
      setSalvando(false)
    }
  }

  function handleBaixarPDF(laudoId: string) {
    const token = localStorage.getItem('accessToken')
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3333'}/laudos/${laudoId}/pdf`

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = `laudo-${laudoId}.pdf`
        a.click()
        URL.revokeObjectURL(objectUrl)
      })
  }

  if (carregando) {
    return (
      <div className="space-y-3 py-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-16 bg-muted/70 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {laudos.length} laudo{laudos.length !== 1 ? 's' : ''} gerado{laudos.length !== 1 ? 's' : ''}
        </p>
        <Button
          size="sm"
          onClick={handleGerarLaudo}
          disabled={gerando}
          className="gap-1.5"
        >
          {gerando
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Plus className="w-3.5 h-3.5" />
          }
          {gerando ? 'Gerando...' : 'Gerar laudo'}
        </Button>
      </div>

      {/* Lista vazia */}
      {laudos.length === 0 && (
        <div className="text-center py-10">
          <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum laudo gerado ainda.</p>
        </div>
      )}

      {/* Lista de laudos */}
      <div className="space-y-2">
        {laudos.map((laudo) => (
          <div
            key={laudo.id}
            className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Laudo fisioterapêutico
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatarData(laudo.criado_em)} ·{' '}
                  {laudo.tipo_assinatura === 'DIGITAL' ? 'Assinatura digital' : 'Assinatura manuscrita'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAbrirEdicao(laudo.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                title="Editar laudo"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBaixarPDF(laudo.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
                title="Baixar PDF"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de edição */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar laudo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Médico solicitante</Label>
                <input
                  value={conteudo.medico_solicitante}
                  onChange={(e) => setConteudo((p) => ({ ...p, medico_solicitante: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Diagnóstico médico</Label>
                <input
                  value={conteudo.diagnostico_medico}
                  onChange={(e) => setConteudo((p) => ({ ...p, diagnostico_medico: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Início do tratamento</Label>
                <input
                  value={conteudo.data_inicio}
                  onChange={(e) => setConteudo((p) => ({ ...p, data_inicio: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Frequência semanal</Label>
                <input
                  value={conteudo.frequencia_semanal}
                  onChange={(e) => setConteudo((p) => ({ ...p, frequencia_semanal: e.target.value }))}
                  placeholder="Ex: 3x semanais"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>

            {[
              { campo: 'quadro_clinico', label: 'Quadro clínico' },
              { campo: 'achados_exame', label: 'Achados ao exame físico' },
              { campo: 'diagnostico_funcional', label: 'Diagnóstico funcional' },
              { campo: 'conclusao', label: 'Conclusão' },
            ].map(({ campo, label }) => (
              <div key={campo} className="space-y-1.5">
                <Label>{label}</Label>
                <textarea
                  value={conteudo[campo as keyof ConteudoLaudo]}
                  onChange={(e) => setConteudo((p) => ({ ...p, [campo]: e.target.value }))}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>
            ))}

            <div className="space-y-1.5">
              <Label>Tipo de assinatura</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['MANUSCRITA', 'DIGITAL'] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoAssinatura(tipo)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      tipoAssinatura === tipo
                        ? 'bg-primary text-white border-primary'
                        : 'bg-card text-muted-foreground border-border hover:bg-accent'
                    }`}
                  >
                    {tipo === 'MANUSCRITA' ? 'Manuscrita (espaço em branco)' : 'Digital (imagem)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 gap-2"
                onClick={handleSalvarEdicao}
                disabled={salvando}
              >
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {salvando ? 'Salvando...' : 'Salvar laudo'}
              </Button>
              <Button
                variant="outline"
                onClick={() => laudoEditando && handleBaixarPDF(laudoEditando)}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
