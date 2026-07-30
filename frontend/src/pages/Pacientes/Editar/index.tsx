import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams, useBlocker } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatarTelefone } from '@/lib/masks'
import { atualizarPacienteSchema, enderecoSchema, type AtualizarPacienteForm } from '@/lib/schemas/paciente'
import api, { exibirErro } from '@/services/api'

export default function EditarPacientePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [editandoEndereco, setEditandoEndereco] = useState(false)
  const [enderecoAtual, setEnderecoAtual] = useState('')

  const [addrRua, setAddrRua] = useState('')
  const [addrNumero, setAddrNumero] = useState('')
  const [addrBairro, setAddrBairro] = useState('')
  const [addrCidade, setAddrCidade] = useState('')
  const [erroEndereco, setErroEndereco] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    reset,
  } = useForm<AtualizarPacienteForm>({
    resolver: zodResolver(atualizarPacienteSchema),
    defaultValues: {
      nome: '',
      estado_civil: undefined,
      nacionalidade: '',
      telefone: '',
      email: '',
      observacoes: '',
    },
  })

  const valoresIniciais = useRef('')

  useEffect(() => {
    valoresIniciais.current = JSON.stringify({ ...watch(), addrRua, addrNumero, addrBairro, addrCidade, editandoEndereco })
  }, [])

  function serializarForm(): string {
    return JSON.stringify({ ...watch(), addrRua, addrNumero, addrBairro, addrCidade, editandoEndereco })
  }

  const blocker = useBlocker(() => serializarForm() !== valoresIniciais.current)

  useEffect(() => {
    if (serializarForm() === valoresIniciais.current) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  })

  useEffect(() => {
    async function carregar() {
      try {
        const response = await api.get(`/pacientes/${id}`)
        const p = response.data
        setEnderecoAtual(p.endereco || '')
        const valores = {
          nome: p.nome || '',
          estado_civil: p.estado_civil || undefined,
          nacionalidade: p.nacionalidade || '',
          telefone: p.telefone ? formatarTelefone(p.telefone) : '',
          email: p.email || '',
          observacoes: p.observacoes || '',
        }
        reset(valores)
        valoresIniciais.current = JSON.stringify({ ...valores, addrRua: '', addrNumero: '', addrBairro: '', addrCidade: '', editandoEndereco: false })
      } catch (err) {
        toast.error(exibirErro(err, 'Não foi possível carregar os dados do paciente.'))
        navigate('/pacientes')
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [id, navigate, reset])

  function handleCancelarEndereco() {
    setEditandoEndereco(false)
    setErroEndereco('')
    setAddrRua('')
    setAddrNumero('')
    setAddrBairro('')
    setAddrCidade('')
  }

  async function onSubmit(data: AtualizarPacienteForm) {
    setErroEndereco('')

    if (editandoEndereco) {
      const result = enderecoSchema.safeParse({ rua: addrRua, numero: addrNumero, bairro: addrBairro, cidade: addrCidade })
      if (!result.success) {
        setErroEndereco(result.error.errors[0].message)
        return
      }
    }

    setSalvando(true)

    const endereco = editandoEndereco
      ? [addrRua, addrNumero && `nº ${addrNumero}`, addrBairro, addrCidade]
          .filter(Boolean)
          .join(', ')
      : enderecoAtual

    try {
      await api.put(`/pacientes/${id}`, {
        nome: data.nome,
        endereco,
        estado_civil: data.estado_civil,
        nacionalidade: data.nacionalidade,
        telefone: data.telefone || undefined,
        email: data.email || undefined,
        observacoes: data.observacoes || undefined,
      })
      toast.success('Dados atualizados com sucesso!')
      navigate(`/pacientes/${id}`)
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao salvar.'))
    } finally {
      setSalvando(false)
    }
  }

  const Erro = ({ campo }: { campo: keyof AtualizarPacienteForm }) =>
    errors[campo] ? <p className="text-xs text-red-500 mt-1">{errors[campo]?.message}</p> : null

  if (carregando) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted/70 animate-pulse rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/pacientes/${id}`)}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Editar paciente</h1>
          <p className="text-sm text-muted-foreground mt-0.5">CPF e data de nascimento não podem ser alterados aqui</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Dados pessoais</h2>

          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input id="nome" {...register('nome')} />
            <Erro campo="nome" />
          </div>

          <div className="space-y-1.5">
            <Label>Endereço *</Label>

            {!editandoEndereco ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-muted text-sm text-muted-foreground min-h-10">
                  {enderecoAtual || <span className="text-muted-foreground/70">Nenhum endereço cadastrado</span>}
                </div>
                <button
                  type="button"
                  onClick={() => setEditandoEndereco(true)}
                  className="self-start sm:self-auto p-2 rounded-md border border-input bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  title="Editar endereço"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Preencha o novo endereço</p>
                  <button
                    type="button"
                    onClick={handleCancelarEndereco}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancelar alteração
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Input value={addrRua} onChange={e => setAddrRua(e.target.value)} placeholder="Rua / Avenida" />
                  </div>
                  <div className="space-y-1.5">
                    <Input value={addrNumero} onChange={e => setAddrNumero(e.target.value)} placeholder="Número" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Input value={addrBairro} onChange={e => setAddrBairro(e.target.value)} placeholder="Bairro" />
                  </div>
                  <div className="space-y-1.5">
                    <Input value={addrCidade} onChange={e => setAddrCidade(e.target.value)} placeholder="Cidade" />
                  </div>
                </div>

                {erroEndereco && <p className="text-xs text-red-500">{erroEndereco}</p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="estado_civil">Estado civil *</Label>
              <Select
                id="estado_civil"
                {...register('estado_civil')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
              >
                <option value="">Selecione...</option>
                <option value="Solteiro(a)">Solteiro(a)</option>
                <option value="Casado(a)">Casado(a)</option>
                <option value="Divorciado(a)">Divorciado(a)</option>
                <option value="Viúvo(a)">Viúvo(a)</option>
                <option value="União estável">União estável</option>
              </Select>
              <Erro campo="estado_civil" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nacionalidade">Nacionalidade *</Label>
              <Input id="nacionalidade" {...register('nacionalidade')} />
              <Erro campo="nacionalidade" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Contato</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                placeholder="(21) 99999-0000"
                inputMode="numeric"
                maxLength={15}
                onChange={(e) => setValue('telefone', formatarTelefone(e.target.value), { shouldValidate: true })}
              />
              <Erro campo="telefone" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register('email')} />
              <Erro campo="email" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button type="submit" disabled={salvando} className="gap-2">
            {salvando
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />
            }
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(`/pacientes/${id}`)}>
            Cancelar
          </Button>
        </div>
      </form>

      {blocker.state === 'blocked' && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl shadow-2xl border border-border p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-foreground">Descartar alterações?</h2>
            <p className="text-sm text-muted-foreground mt-2">As alterações feitas serão perdidas.</p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { if (blocker.state === 'blocked') blocker.reset() }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => { if (blocker.state === 'blocked') blocker.proceed() }}
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
}
