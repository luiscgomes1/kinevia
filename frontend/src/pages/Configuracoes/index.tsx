import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Save, Loader2, User, Clock, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/services/api'

interface DadosProfissional {
  nome: string
  email: string
  crefito: string
  cidade: string
  uf: string
  horario_inicio: string
  horario_fim: string
  preco_sessao_individual: number
  preco_pacote_5: number
  preco_pacote_10: number
}

export default function ConfiguracoesPage() {
  const [dados, setDados] = useState<DadosProfissional>({
    nome: '',
    email: '',
    crefito: '',
    cidade: '',
    uf: '',
    horario_inicio: '07:00', // horários padrões que podem ser alterados pelo usuário
    horario_fim: '18:00', // horários padrões que podem ser alterados pelo usuário
    preco_sessao_individual: 0,
    preco_pacote_5: 0,
    preco_pacote_10: 0,
  })
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  // Seção de senha separada
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  // Carrega os dados do profissional ao abrir a tela
  useEffect(() => {
    async function carregarDados() {
      try {
        const response = await api.get('/profissional/me')
        setDados(response.data)
      } catch {
        toast.error('Erro ao carregar dados. Tente novamente.')
      } finally {
        setCarregando(false)
      }
    }
    carregarDados()
  }, [])

  function handleChange(campo: keyof DadosProfissional, valor: string | number) {
    setDados((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleSalvar(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSalvando(true)

    try {
      await api.put('/profissional/me', {
        nome: dados.nome,
        crefito: dados.crefito,
        cidade: dados.cidade,
        uf: dados.uf,
        horario_inicio: dados.horario_inicio,
        horario_fim: dados.horario_fim,
        preco_sessao_individual: Number(dados.preco_sessao_individual),
        preco_pacote_5: Number(dados.preco_pacote_5),
        preco_pacote_10: Number(dados.preco_pacote_10),
      })
      toast.success('Dados salvos com sucesso!')
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  async function handleTrocarSenha(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSalvandoSenha(true)

    try {
      await api.put('/profissional/me/senha', { senhaAtual, novaSenha })
      toast.success('Senha alterada com sucesso!')
      setSenhaAtual('')
      setNovaSenha('')
    } catch (err) {
      const erro = err as { response?: { data?: { erro?: string } } }
      toast.error(erro.response?.data?.erro || 'Erro ao trocar senha.')
    } finally {
      setSalvandoSenha(false)
    }
  }

  // Skeleton de carregamento
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

      {/* Título da página */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerencie seus dados profissionais e preferências do sistema
        </p>
      </div>

      {/* ── Seção: Dados profissionais ─────────────────── */}
      <form onSubmit={handleSalvar} className="space-y-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Dados profissionais</h2>
          </div>

          <div className="space-y-4">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                value={dados.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>

            {/* E-mail (somente leitura) */}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                value={dados.email}
                disabled
                className="bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
            </div>

            {/* CREFITO */}
            <div className="space-y-1.5">
              <Label htmlFor="crefito">CREFITO</Label>
              <Input
                id="crefito"
                value={dados.crefito}
                onChange={(e) => handleChange('crefito', e.target.value)}
                placeholder="CREFITO-2/123456-F"
                required
              />
            </div>

            {/* Cidade e UF */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={dados.cidade}
                  onChange={(e) => handleChange('cidade', e.target.value)}
                  placeholder="Rio de Janeiro"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="uf">UF</Label>
                <Input
                  id="uf"
                  value={dados.uf}
                  onChange={(e) => handleChange('uf', e.target.value.toUpperCase())}
                  placeholder="RJ"
                  maxLength={2}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Seção: Agenda ──────────────────────────────── */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Horários da agenda</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="horario_inicio">Início do expediente</Label>
              <Input
                id="horario_inicio"
                type="time"
                value={dados.horario_inicio}
                onChange={(e) => handleChange('horario_inicio', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="horario_fim">Fim do expediente</Label>
              <Input
                id="horario_fim"
                type="time"
                value={dados.horario_fim}
                onChange={(e) => handleChange('horario_fim', e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* ── Seção: Preços ──────────────────────────────── */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <DollarSign className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Preços padrão</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="preco_individual">Sessão individual (R$)</Label>
              <Input
                id="preco_individual"
                type="number"
                min={0}
                step={0.01}
                value={dados.preco_sessao_individual}
                onChange={(e) => handleChange('preco_sessao_individual', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="preco_pacote5">Pacote de 5 sessões (R$)</Label>
                <Input
                  id="preco_pacote5"
                  type="number"
                  min={0}
                  step={0.01}
                  value={dados.preco_pacote_5}
                  onChange={(e) => handleChange('preco_pacote_5', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="preco_pacote10">Pacote de 10 sessões (R$)</Label>
                <Input
                  id="preco_pacote10"
                  type="number"
                  min={0}
                  step={0.01}
                  value={dados.preco_pacote_10}
                  onChange={(e) => handleChange('preco_pacote_10', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={salvando} className="gap-2">
          {salvando
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />
          }
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </form>

      {/* ── Seção: Trocar senha ────────────────────────── */}
      <form onSubmit={handleTrocarSenha}>
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">Trocar senha</h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="senhaAtual">Senha atual</Label>
              <Input
                id="senhaAtual"
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="novaSenha">Nova senha</Label>
              <Input
                id="novaSenha"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                minLength={6}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="outline"
            disabled={salvandoSenha}
            className="gap-2 mt-5"
          >
            {salvandoSenha
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : null
            }
            {salvandoSenha ? 'Salvando...' : 'Trocar senha'}
          </Button>
        </div>
      </form>
    </div>
  )
}
