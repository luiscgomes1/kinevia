import { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useBlocker } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatarCPF, formatarTelefone } from '@/lib/masks'
import { criarPacienteSchema, type CriarPacienteForm } from '@/lib/schemas/paciente'
import api, { exibirErro } from '@/services/api'

export default function NovoPacientePage() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<CriarPacienteForm>({
    resolver: zodResolver(criarPacienteSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      data_nascimento: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado_civil: undefined,
      nacionalidade: 'Brasileira',
      telefone: '',
      email: '',
      observacoes: '',
    },
  })

  const valoresIniciais = useRef(JSON.stringify(watch()))

  function isDirty(): boolean {
    return JSON.stringify(watch()) !== valoresIniciais.current
  }

  const blocker = useBlocker(isDirty)

  useEffect(() => {
    if (!isDirty()) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  })

  async function onSubmit(data: CriarPacienteForm) {
    const endereco = [
      data.rua,
      data.numero && `nº ${data.numero}`,
      data.bairro,
      data.cidade,
    ]
      .filter(Boolean)
      .join(', ')

    try {
      const response = await api.post('/pacientes', {
        nome: data.nome,
        cpf: data.cpf,
        data_nascimento: data.data_nascimento,
        endereco,
        estado_civil: data.estado_civil,
        nacionalidade: data.nacionalidade,
        telefone: data.telefone || undefined,
        email: data.email || undefined,
        observacoes: data.observacoes || undefined,
      })
      toast.success('Paciente cadastrado com sucesso!')
      navigate(`/pacientes/${response.data.id}`)
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao cadastrar paciente.'))
    }
  }

  const Erro = ({ campo }: { campo: keyof CriarPacienteForm }) =>
    errors[campo] ? <p className="text-xs text-red-500 mt-1">{errors[campo]?.message}</p> : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/pacientes')}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Novo paciente</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Preencha os dados do paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Dados pessoais</h2>

          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input id="nome" {...register('nome')} placeholder="Nome completo do paciente" />
            <Erro campo="nome" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                inputMode="numeric"
                maxLength={14}
                onChange={(e) => setValue('cpf', formatarCPF(e.target.value), { shouldValidate: true })}
              />
              <Erro campo="cpf" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data_nascimento">Data de nascimento *</Label>
              <Input id="data_nascimento" type="date" {...register('data_nascimento')} />
              <Erro campo="data_nascimento" />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Endereço *</Label>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Input {...register('rua')} placeholder="Rua / Avenida" />
                <Erro campo="rua" />
              </div>
              <div className="space-y-1.5">
                <Input {...register('numero')} placeholder="Número" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Input {...register('bairro')} placeholder="Bairro" />
                <Erro campo="bairro" />
              </div>
              <div className="space-y-1.5">
                <Input {...register('cidade')} placeholder="Cidade" />
                <Erro campo="cidade" />
              </div>
            </div>
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
              <Input id="nacionalidade" {...register('nacionalidade')} placeholder="Brasileira" />
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
              <Input id="email" type="email" {...register('email')} placeholder="paciente@email.com" />
              <Erro campo="email" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Informações adicionais relevantes..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />
            }
            {isSubmitting ? 'Salvando...' : 'Cadastrar paciente'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/pacientes')}>
            Cancelar
          </Button>
        </div>
      </form>

      {blocker.state === 'blocked' && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl shadow-2xl border border-border p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-foreground">Descartar alterações?</h2>
            <p className="text-sm text-muted-foreground mt-2">Os dados preenchidos serão perdidos.</p>
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
