import { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import api, { exibirErro } from '@/services/api'
import FormAvaliacaoInicial from './FormAvaliacaoInicial'
import SecaoEvolucao from './SecaoEvolucao'

export interface Evolucao {
  id: string
  texto: string
  dor_eva: number | null
  criado_em: string
  correcao_texto: string | null
  correcao_em: string | null
}

interface Prontuario {
  id: string
  preenchido: boolean
  medico_solicitante: string | null
  diagnostico_medico: string | null
  queixa_principal: string | null
  hda: string | null
  hpp_has: boolean
  hpp_dm: boolean
  hpp_ca: boolean
  hpp_cardiopatia: boolean
  antecedentes_familiares: string | null
  medicacoes: string | null
  habitos_vida: string | null
  exames_medicos: string | null
  avaliacao_fisica: string | null
  diagnostico_fisio: string | null
  prognostico_fisio: string | null
  plano_terapeutico: string | null
  dor_eva: number | null
  pa: string | null
  fr: string | null
  fc: string | null
  ap: string | null
  evolucoes: Evolucao[]
}

interface Props {
  pacienteId: string
  onDirtyChange?: (dirty: boolean) => void
}

const ProntuarioTab = memo(function ProntuarioTab({ pacienteId, onDirtyChange }: Props) {
  const [prontuario, setProntuario] = useState<Prontuario | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const sucessoTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const [novaEvolucao, setNovaEvolucao] = useState('')
  const [novaEva, setNovaEva] = useState<number | null>(null)
  const [salvandoEvolucao, setSalvandoEvolucao] = useState(false)
  const [mostrarFormEvolucao, setMostrarFormEvolucao] = useState(false)
  const [confirmCancelEvo, setConfirmCancelEvo] = useState(false)

  const [form, setForm] = useState({
    medico_solicitante: '',
    diagnostico_medico: '',
    queixa_principal: '',
    hda: '',
    hpp_has: false,
    hpp_dm: false,
    hpp_ca: false,
    hpp_cardiopatia: false,
    antecedentes_familiares: '',
    medicacoes: '',
    habitos_vida: '',
    exames_medicos: '',
    avaliacao_fisica: '',
    diagnostico_fisio: '',
    prognostico_fisio: '',
    plano_terapeutico: '',
    dor_eva: null,
    pa: '',
    fr: '',
    fc: '',
    ap: '',
  })

  const initialSnapshotRef = useRef<string | null>(null)

  const isDirty = useMemo(() => {
    if (initialSnapshotRef.current === null) return false
    return JSON.stringify(form) !== initialSnapshotRef.current
  }, [form])

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const carregar = useCallback(async () => {
    try {
      const response = await api.get(`/pacientes/${pacienteId}/prontuario`)
      const data = response.data
      setProntuario(data)

      const novoForm = data.preenchido
        ? {
            medico_solicitante: data.medico_solicitante || '',
            diagnostico_medico: data.diagnostico_medico || '',
            queixa_principal: data.queixa_principal || '',
            hda: data.hda || '',
            hpp_has: data.hpp_has || false,
            hpp_dm: data.hpp_dm || false,
            hpp_ca: data.hpp_ca || false,
            hpp_cardiopatia: data.hpp_cardiopatia || false,
            antecedentes_familiares: data.antecedentes_familiares || '',
            medicacoes: data.medicacoes || '',
            habitos_vida: data.habitos_vida || '',
            exames_medicos: data.exames_medicos || '',
            avaliacao_fisica: data.avaliacao_fisica || '',
            diagnostico_fisio: data.diagnostico_fisio || '',
            prognostico_fisio: data.prognostico_fisio || '',
            plano_terapeutico: data.plano_terapeutico || '',
            dor_eva: data.dor_eva ?? null,
            pa: data.pa || '',
            fr: data.fr || '',
            fc: data.fc || '',
            ap: data.ap || '',
          }
        : {
            medico_solicitante: '',
            diagnostico_medico: '',
            queixa_principal: '',
            hda: '',
            hpp_has: false,
            hpp_dm: false,
            hpp_ca: false,
            hpp_cardiopatia: false,
            antecedentes_familiares: '',
            medicacoes: '',
            habitos_vida: '',
            exames_medicos: '',
            avaliacao_fisica: '',
            diagnostico_fisio: '',
            prognostico_fisio: '',
            plano_terapeutico: '',
            dor_eva: null,
            pa: '',
            fr: '',
            fc: '',
            ap: '',
          }

      setForm(novoForm)
      initialSnapshotRef.current = JSON.stringify(novoForm)
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao carregar prontuário.'))
    } finally {
      setCarregando(false)
    }
  }, [pacienteId])

  useEffect(() => {
    carregar()
    return () => clearTimeout(sucessoTimer.current)
  }, [carregar])

  function handleChange(campo: string, valor: string | boolean | number | null) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleSalvarProntuario(e: React.SyntheticEvent) {
    e.preventDefault()
    setSalvando(true)
    try {
      const response = await api.put(`/pacientes/${pacienteId}/prontuario`, form)
      const salvo = response.data as Prontuario
      setProntuario((prev) => ({
        ...(prev ?? { evolucoes: [] as Evolucao[] }),
        ...salvo,
        preenchido: true,
      }))
      setSucesso(true)
      clearTimeout(sucessoTimer.current)
      sucessoTimer.current = setTimeout(() => setSucesso(false), 3000)
      initialSnapshotRef.current = JSON.stringify(form)
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao salvar prontuário.'))
    } finally {
      setSalvando(false)
    }
  }

  async function handleSalvarEvolucao() {
    if (!novaEvolucao.trim()) return
    setSalvandoEvolucao(true)
    try {
      const response = await api.post(`/pacientes/${pacienteId}/evolucoes`, {
        texto: novaEvolucao,
        ...(novaEva !== null && { dor_eva: novaEva }),
      })
      setNovaEvolucao('')
      setNovaEva(null)
      setMostrarFormEvolucao(false)
      setProntuario((prev) =>
        prev
          ? { ...prev, preenchido: true, evolucoes: [...(prev.evolucoes ?? []), response.data as Evolucao] }
          : prev,
      )
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao salvar evolução.'))
    } finally {
      setSalvandoEvolucao(false)
    }
  }

  function handleCancelarEvolucao() {
    if (novaEvolucao.trim()) {
      setConfirmCancelEvo(true)
    } else {
      setNovaEvolucao('')
      setNovaEva(null)
      setMostrarFormEvolucao(false)
    }
  }

  async function handleCorrigirEvolucao(evolucaoId: string, correcaoTexto: string) {
    try {
      const response = await api.patch(`/evolucoes/${evolucaoId}/correcao`, { correcao_texto: correcaoTexto })
      setProntuario((prev) =>
        prev
          ? { ...prev, evolucoes: prev.evolucoes.map((ev) => (ev.id === evolucaoId ? (response.data as Evolucao) : ev)) }
          : prev,
      )
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao salvar correção.'))
      throw err
    }
  }

  function confirmarCancelEvolucao() {
    setNovaEvolucao('')
    setNovaEva(null)
    setMostrarFormEvolucao(false)
    setConfirmCancelEvo(false)
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
      <FormAvaliacaoInicial
        form={form}
        onChange={handleChange}
        onSalvar={handleSalvarProntuario}
        salvando={salvando}
        sucesso={sucesso}
        prontuarioPreenchido={prontuario?.preenchido ?? false}
      />
      <SecaoEvolucao
        evolucoes={prontuario?.evolucoes || []}
        novaEvolucao={novaEvolucao}
        onNovaEvolucaoChange={(valor) => setNovaEvolucao(valor)}
        novaEva={novaEva}
        onNovaEvaChange={(valor) => setNovaEva(valor)}
        salvandoEvolucao={salvandoEvolucao}
        mostrarForm={mostrarFormEvolucao}
        onToggleForm={() => setMostrarFormEvolucao((prev) => !prev)}
        onSalvarEvolucao={handleSalvarEvolucao}
        onCancelarEvolucao={handleCancelarEvolucao}
        onCorrigirEvolucao={handleCorrigirEvolucao}
      />
      {confirmCancelEvo && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl shadow-2xl border border-border p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-foreground">Descartar alterações?</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Você tem alterações não salvas na evolução. Deseja realmente descartá-las?
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmCancelEvo(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Continuar editando
              </button>
              <button
                type="button"
                onClick={confirmarCancelEvolucao}
                className="px-4 py-2 text-sm font-medium text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
})

export default ProntuarioTab
