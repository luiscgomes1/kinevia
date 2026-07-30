import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams, useBlocker } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Save, Loader2, User, Clock, DollarSign, Upload, Trash2, AlertTriangle, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SenhaInput } from '@/components/SenhaInput'
import { useSenhaValida } from '@/lib/senha'
import { profissionalSchema, type ProfissionalForm } from '@/lib/schemas/profissional'
import api, { exibirErro } from '@/services/api'

export default function ConfiguracoesPage() {
  const [searchParams] = useSearchParams()
  const isSetup = searchParams.get('setup') === 'true'

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfissionalForm>({
    resolver: zodResolver(profissionalSchema),
    defaultValues: {
      nome: '',
      crefito: '',
      cidade: '',
      uf: '',
      horario_inicio: '07:00',
      horario_fim: '18:00',
      preco_sessao_individual: 0,
      preco_pacote_5: 0,
      preco_pacote_10: 0,
    },
  })

  const [carregando, setCarregando] = useState(true)
  const dadosInicial = useRef('')

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [senhaAtualStatus, setSenhaAtualStatus] = useState<'idle' | 'verificando' | 'valida' | 'invalida'>('idle')
  const senhaValida = useSenhaValida(novaSenha)
  const verificarTimeout = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (verificarTimeout.current) clearTimeout(verificarTimeout.current)
    if (!senhaAtual) { setSenhaAtualStatus('idle'); return }
    setSenhaAtualStatus('verificando')
    verificarTimeout.current = setTimeout(async () => {
      try {
        const res = await api.post('/profissional/me/verificar-senha', { senha: senhaAtual })
        setSenhaAtualStatus(res.data.valida ? 'valida' : 'invalida')
      } catch {
        setSenhaAtualStatus('invalida')
      }
    }, 600)
    return () => { if (verificarTimeout.current) clearTimeout(verificarTimeout.current) }
  }, [senhaAtual])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [enviandoAssinatura, setEnviandoAssinatura] = useState(false)
  const [email, setEmail] = useState('')
  const [assinaturaUrl, setAssinaturaUrl] = useState<string | undefined>()

  function isDirty(): boolean {
    return JSON.stringify(watch()) !== dadosInicial.current || !!senhaAtual || !!novaSenha || !!confirmarSenha
  }

  const blocker = useBlocker(isDirty)

  useEffect(() => {
    if (!isDirty()) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  })

  useEffect(() => {
    async function carregarDados() {
      try {
        const response = await api.get('/profissional/me')
        const p = response.data
        setEmail(p.email || '')
        const valores = {
          nome: p.nome || '',
          crefito: p.crefito || '',
          cidade: p.cidade || '',
          uf: p.uf || '',
          horario_inicio: p.horario_inicio || '07:00',
          horario_fim: p.horario_fim || '18:00',
          preco_sessao_individual: Number(p.preco_sessao_individual) || 0,
          preco_pacote_5: Number(p.preco_pacote_5) || 0,
          preco_pacote_10: Number(p.preco_pacote_10) || 0,
        }
        reset(valores)
        dadosInicial.current = JSON.stringify(valores)
        setAssinaturaUrl(p.assinatura_url)
      } catch (err) {
        toast.error(exibirErro(err, 'Erro ao carregar dados. Tente novamente.'))
      } finally {
        setCarregando(false)
      }
    }
    carregarDados()
  }, [reset])

  async function onSubmit(data: ProfissionalForm) {
    try {
      await api.put('/profissional/me', data)
      toast.success('Dados salvos com sucesso!')
      dadosInicial.current = JSON.stringify(watch())
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao salvar. Tente novamente.'))
    }
  }

  async function handleUploadAssinatura(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setEnviandoAssinatura(true)
    try {
      const formData = new FormData()
      formData.append('imagem', file)
      const response = await api.post('/profissional/me/assinatura', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setAssinaturaUrl(response.data.url)
      toast.success('Assinatura salva com sucesso!')
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao enviar assinatura.'))
    } finally {
      setEnviandoAssinatura(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleTrocarSenha(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!senhaAtual || !novaSenha) return
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não conferem.')
      return
    }
    if (!senhaValida) {
      toast.error('A nova senha não atende aos requisitos.')
      return
    }
    setSalvandoSenha(true)

    try {
      await api.put('/profissional/me/senha', { senhaAtual, novaSenha })
      toast.success('Senha alterada com sucesso!')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao trocar senha.'))
    } finally {
      setSalvandoSenha(false)
    }
  }

  const Erro = ({ campo }: { campo: keyof ProfissionalForm }) =>
    errors[campo] ? <p className="text-xs text-red-500 mt-1">{errors[campo]?.message}</p> : null

  if (carregando) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted/70 animate-pulse rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="space-y-3">
        <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isSetup
            ? 'Antes de começar, preencha os campos obrigatórios abaixo.'
            : 'Gerencie seus dados profissionais e preferências do sistema'
          }
        </p>
        {isSetup && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Complete seu cadastro com CREFITO, cidade e UF para emitir laudos e agendar atendimentos.</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Dados profissionais</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" {...register('nome')} placeholder="Seu nome completo" />
              <Erro campo="nome" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={email} disabled className="bg-muted text-muted-foreground" />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="crefito">CREFITO</Label>
              <Input id="crefito" {...register('crefito')} placeholder="CREFITO-2/123456-F" />
              <Erro campo="crefito" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" {...register('cidade')} placeholder="Rio de Janeiro" />
                <Erro campo="cidade" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="uf">UF</Label>
                <Input id="uf" {...register('uf')} placeholder="RJ" maxLength={2} />
                <Erro campo="uf" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <Upload className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Assinatura digital</h2>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            A assinatura aparece no rodapé dos laudos. Envie uma imagem com fundo transparente (PNG) ou fundo branco.
          </p>

          {assinaturaUrl && (
            <div className="mb-4 p-3 bg-muted rounded-lg inline-block">
              <img src={assinaturaUrl} alt="Assinatura" className="max-h-16 object-contain" />
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={enviandoAssinatura}
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              {enviandoAssinatura ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {enviandoAssinatura ? 'Enviando...' : assinaturaUrl ? 'Trocar imagem' : 'Selecionar imagem'}
            </Button>

            {assinaturaUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await api.post('/profissional/me/assinatura', { remover: true })
                    setAssinaturaUrl(undefined)
                    toast.success('Assinatura removida.')
                  } catch (err) {
                    toast.error(exibirErro(err, 'Erro ao remover assinatura.'))
                  }
                }}
                className="gap-2 text-muted-foreground"
              >
                <Trash2 className="w-4 h-4" />
                Remover
              </Button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={handleUploadAssinatura}
            />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Horários da agenda</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="horario_inicio">Início do expediente</Label>
              <Input id="horario_inicio" type="time" {...register('horario_inicio')} />
              <Erro campo="horario_inicio" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="horario_fim">Fim do expediente</Label>
              <Input id="horario_fim" type="time" {...register('horario_fim')} />
              <Erro campo="horario_fim" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <DollarSign className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Preços padrão</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="preco_individual">Sessão individual (R$)</Label>
              <Input id="preco_individual" type="number" min={0} step={0.01} {...register('preco_sessao_individual', { valueAsNumber: true })} />
              <Erro campo="preco_sessao_individual" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="preco_pacote5">Pacote de 5 sessões (R$)</Label>
                <Input id="preco_pacote5" type="number" min={0} step={0.01} {...register('preco_pacote_5', { valueAsNumber: true })} />
                <Erro campo="preco_pacote_5" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="preco_pacote10">Pacote de 10 sessões (R$)</Label>
                <Input id="preco_pacote10" type="number" min={0} step={0.01} {...register('preco_pacote_10', { valueAsNumber: true })} />
                <Erro campo="preco_pacote_10" />
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </form>

      <form onSubmit={handleTrocarSenha}>
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">Trocar senha</h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="senhaAtual">Senha atual</Label>
              <div className="relative">
                <Input id="senhaAtual" type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required />
                {senhaAtualStatus === 'verificando' && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
                {senhaAtualStatus === 'valida' && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
                {senhaAtualStatus === 'invalida' && (
                  <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                )}
              </div>
              {senhaAtualStatus === 'invalida' && (
                <p className="text-xs text-red-500">Senha atual não confere.</p>
              )}
              {senhaAtualStatus === 'valida' && (
                <p className="text-xs text-green-500">Senha atual correta.</p>
              )}
            </div>
            <SenhaInput value={novaSenha} onChange={setNovaSenha} id="novaSenha" label="Nova senha" placeholder="Deixe em branco para manter" required={false} />
            {novaSenha && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
                <Input id="confirmarSenha" type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Repita a nova senha" />
                {confirmarSenha && novaSenha !== confirmarSenha && (
                  <p className="text-xs text-red-500">As senhas não conferem.</p>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="outline"
            disabled={salvandoSenha || senhaAtualStatus !== 'valida' || !novaSenha || !senhaValida || novaSenha !== confirmarSenha}
            className="gap-2 mt-5"
          >
            {salvandoSenha ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {salvandoSenha ? 'Salvando...' : 'Trocar senha'}
          </Button>
        </div>
      </form>

      {blocker.state === 'blocked' && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl shadow-2xl border border-border p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-foreground">Descartar alterações?</h2>
            <p className="text-sm text-muted-foreground mt-2">Você tem alterações não salvas. Deseja realmente descartá-las?</p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { if (blocker.state === 'blocked') blocker.reset() }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Continuar editando
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
