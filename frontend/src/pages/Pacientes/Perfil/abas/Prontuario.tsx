import { useState, useEffect, useCallback } from 'react'
import { Save, Loader2, Plus, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import api from '@/services/api'

interface Evolucao {
  id: string
  texto: string
  criado_em: string
  correcao_texto: string | null
  correcao_em: string | null
}

interface Prontuario {
  id: string
  preenchido: boolean
  medico_solicitante: string | null
  diagnostico_medico: string | null
  hda: string | null
  hpp_has: boolean
  hpp_dm: boolean
  hpp_ca: boolean
  hpp_cardiopatia: boolean
  medicacoes: string | null
  habitos_vida: string | null
  exames_medicos: string | null
  avaliacao_fisica: string | null
  diagnostico_fisio: string | null
  pa: string | null
  fr: string | null
  fc: string | null
  ap: string | null
  evolucoes: Evolucao[]
}

function formatarDataHora(data: string): string {
  return new Date(data).toLocaleString('pt-BR', { timeZone: 'UTC' })
}

interface Props {
  pacienteId: string
}

export default function ProntuarioTab({ pacienteId }: Props) {
  const [prontuario, setProntuario] = useState<Prontuario | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  // Estado da nova evolução
  const [novaEvolucao, setNovaEvolucao] = useState('')
  const [salvandoEvolucao, setSalvandoEvolucao] = useState(false)
  const [mostrarFormEvolucao, setMostrarFormEvolucao] = useState(false)

  const [form, setForm] = useState({
    medico_solicitante: '',
    diagnostico_medico: '',
    hda: '',
    hpp_has: false,
    hpp_dm: false,
    hpp_ca: false,
    hpp_cardiopatia: false,
    medicacoes: '',
    habitos_vida: '',
    exames_medicos: '',
    avaliacao_fisica: '',
    diagnostico_fisio: '',
    pa: '',
    fr: '',
    fc: '',
    ap: '',
  })

  const carregar = useCallback(async () => {
    try {
      const response = await api.get(`/pacientes/${pacienteId}/prontuario`)
      const data = response.data
      setProntuario(data)

      if (data.preenchido) {
        setForm({
          medico_solicitante: data.medico_solicitante || '',
          diagnostico_medico: data.diagnostico_medico || '',
          hda: data.hda || '',
          hpp_has: data.hpp_has || false,
          hpp_dm: data.hpp_dm || false,
          hpp_ca: data.hpp_ca || false,
          hpp_cardiopatia: data.hpp_cardiopatia || false,
          medicacoes: data.medicacoes || '',
          habitos_vida: data.habitos_vida || '',
          exames_medicos: data.exames_medicos || '',
          avaliacao_fisica: data.avaliacao_fisica || '',
          diagnostico_fisio: data.diagnostico_fisio || '',
          pa: data.pa || '',
          fr: data.fr || '',
          fc: data.fc || '',
          ap: data.ap || '',
        })
      }
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

  function handleChange(campo: string, valor: string | boolean) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleSalvarProntuario(e: React.SyntheticEvent) {
    e.preventDefault()
    setSalvando(true)
    try {
      await api.put(`/pacientes/${pacienteId}/prontuario`, form)
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
      carregar()
    } catch {
      // silencioso
    } finally {
      setSalvando(false)
    }
  }

  async function handleSalvarEvolucao() {
    if (!novaEvolucao.trim()) return
    setSalvandoEvolucao(true)
    try {
      await api.post(`/pacientes/${pacienteId}/evolucoes`, { texto: novaEvolucao })
      setNovaEvolucao('')
      setMostrarFormEvolucao(false)
      carregar()
    } catch {
      // silencioso
    } finally {
      setSalvandoEvolucao(false)
    }
  }

  if (carregando) {
    return (
      <div className="space-y-3 py-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-muted/70 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Avaliação inicial */}
      <form onSubmit={handleSalvarProntuario} className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Avaliação inicial</h3>
          {prontuario?.preenchido && (
            <span className="text-xs text-green-700 bg-verde-claro/15 px-2 py-0.5 rounded-full border border-verde-claro/40">
              ✓ Preenchida
            </span>
          )}
        </div>

        {/* Dados clínicos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Médico solicitante</Label>
            <Input
              value={form.medico_solicitante}
              onChange={(e) => handleChange('medico_solicitante', e.target.value)}
              placeholder="Nome do médico"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Diagnóstico médico</Label>
            <Input
              value={form.diagnostico_medico}
              onChange={(e) => handleChange('diagnostico_medico', e.target.value)}
              placeholder="CID ou descrição"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Histórico da doença atual (HDA)</Label>
          <textarea
            value={form.hda}
            onChange={(e) => handleChange('hda', e.target.value)}
            rows={3}
            placeholder="Descreva o histórico da doença atual..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>

        {/* HPP — toggles */}
        <div className="space-y-2">
          <Label>Histórico de patologia pregressa (HPP)</Label>
          <div className="flex flex-wrap gap-3">
            {[
              { campo: 'hpp_has', label: 'HAS' },
              { campo: 'hpp_dm', label: 'DM' },
              { campo: 'hpp_ca', label: 'CA' },
              { campo: 'hpp_cardiopatia', label: 'Cardiopatia' },
            ].map(({ campo, label }) => (
              <button
                key={campo}
                type="button"
                onClick={() => handleChange(campo, !form[campo as keyof typeof form])}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                  form[campo as keyof typeof form]
                    ? 'bg-primary text-white border-primary'
                    : 'bg-card text-muted-foreground border-border hover:bg-accent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Medicações</Label>
            <textarea
              value={form.medicacoes}
              onChange={(e) => handleChange('medicacoes', e.target.value)}
              rows={2}
              placeholder="Medicamentos em uso..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Hábitos de vida</Label>
            <textarea
              value={form.habitos_vida}
              onChange={(e) => handleChange('habitos_vida', e.target.value)}
              rows={2}
              placeholder="Atividade física, alimentação..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Exames médicos</Label>
          <textarea
            value={form.exames_medicos}
            onChange={(e) => handleChange('exames_medicos', e.target.value)}
            rows={2}
            placeholder="Exames realizados e resultados relevantes..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Avaliação física</Label>
            <textarea
              value={form.avaliacao_fisica}
              onChange={(e) => handleChange('avaliacao_fisica', e.target.value)}
              rows={2}
              placeholder="Achados do exame físico..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Diagnóstico fisioterapêutico</Label>
            <textarea
              value={form.diagnostico_fisio}
              onChange={(e) => handleChange('diagnostico_fisio', e.target.value)}
              rows={2}
              placeholder="Diagnóstico funcional..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
        </div>

        {/* Sinais vitais */}
        <div className="space-y-2">
          <Label>Sinais vitais</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { campo: 'pa', label: 'PA' },
              { campo: 'fr', label: 'FR' },
              { campo: 'fc', label: 'FC' },
              { campo: 'ap', label: 'AP' },
            ].map(({ campo, label }) => (
              <div key={campo} className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <Input
                  value={form[campo as keyof typeof form] as string}
                  onChange={(e) => handleChange(campo, e.target.value)}
                  placeholder={label}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {sucesso && (
          <p className="text-sm text-green-700 bg-verde-claro/15 border border-verde-claro/40 rounded-lg px-3 py-2">
            ✓ Prontuário salvo com sucesso!
          </p>
        )}

        <Button type="submit" disabled={salvando} className="gap-2">
          {salvando
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />
          }
          {salvando ? 'Salvando...' : 'Salvar avaliação'}
        </Button>
      </form>

      {/* Divisor */}
      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">Evolução</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarFormEvolucao(!mostrarFormEvolucao)}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova entrada
          </Button>
        </div>

        {/* Form nova evolução */}
        {mostrarFormEvolucao && (
          <div className="mb-5 space-y-3 p-4 bg-muted rounded-lg border border-border">
            <Label>Registro de evolução</Label>
            <textarea
              value={novaEvolucao}
              onChange={(e) => setNovaEvolucao(e.target.value)}
              rows={4}
              placeholder="Descreva a evolução da sessão de hoje..."
              className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              autoFocus
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                size="sm"
                disabled={salvandoEvolucao || !novaEvolucao.trim()}
                onClick={handleSalvarEvolucao}
                className="gap-1.5"
              >
                {salvandoEvolucao
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Save className="w-3.5 h-3.5" />
                }
                {salvandoEvolucao ? 'Salvando...' : 'Salvar entrada'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => { setMostrarFormEvolucao(false); setNovaEvolucao('') }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de evoluções */}
        {prontuario?.evolucoes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma evolução registrada ainda.
          </p>
        )}

        <div className="space-y-3">
          {[...(prontuario?.evolucoes || [])].reverse().map((ev) => (
            <div key={ev.id} className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {formatarDataHora(ev.criado_em)}
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {ev.texto}
              </p>
              {ev.correcao_texto && (
                <div className="mt-2 pt-2 border-t border-amber-200 bg-amber-50 rounded px-2 py-1.5">
                  <p className="text-xs text-amber-600 font-medium mb-0.5">
                    Correção — {formatarDataHora(ev.correcao_em!)}
                  </p>
                  <p className="text-xs text-amber-700">{ev.correcao_texto}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
