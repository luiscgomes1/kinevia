import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatarCPF, formatarTelefone } from '@/lib/masks'
import api from '@/services/api'

export default function NovoPacientePage() {
  const navigate = useNavigate()
  const [salvando, setSalvando] = useState(false)

  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    data_nascimento: '',
    // Endereço separado — montado antes de enviar para a API
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado_civil: '',
    nacionalidade: 'Brasileira',
    telefone: '',
    email: '',
    observacoes: '',
  })

  function handleChange(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleSalvar(e: React.SyntheticEvent) {
    e.preventDefault()
    setSalvando(true)

    // Monta o endereço como string única antes de enviar
    const endereco = [
      form.rua,
      form.numero && `nº ${form.numero}`,
      form.bairro,
      form.cidade,
    ]
      .filter(Boolean)
      .join(', ')

    try {
      const response = await api.post('/pacientes', {
        nome: form.nome,
        cpf: form.cpf,
        data_nascimento: form.data_nascimento,
        endereco,
        estado_civil: form.estado_civil,
        nacionalidade: form.nacionalidade,
        telefone: form.telefone || undefined,
        email: form.email || undefined,
        observacoes: form.observacoes || undefined,
      })
      toast.success('Paciente cadastrado com sucesso!')
      navigate(`/pacientes/${response.data.id}`)
    } catch (err) {
      const error = err as { response?: { data?: { erro?: string } } }
      toast.error(error.response?.data?.erro || 'Erro ao cadastrar paciente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Cabeçalho */}
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

      <form onSubmit={handleSalvar} className="space-y-5">
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Dados pessoais</h2>

          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              placeholder="Nome completo do paciente"
              required
            />
          </div>

          {/* CPF e Data de nascimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={form.cpf}
                onChange={(e) => handleChange('cpf', formatarCPF(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                maxLength={14}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data_nascimento">Data de nascimento *</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={form.data_nascimento}
                onChange={(e) => handleChange('data_nascimento', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Endereço separado */}
          <div className="space-y-3">
            <Label>Endereço *</Label>

            {/* Rua e Número */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Input
                  value={form.rua}
                  onChange={(e) => handleChange('rua', e.target.value)}
                  placeholder="Rua / Avenida"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Input
                  value={form.numero}
                  onChange={(e) => handleChange('numero', e.target.value)}
                  placeholder="Número"
                />
              </div>
            </div>

            {/* Bairro e Cidade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                value={form.bairro}
                onChange={(e) => handleChange('bairro', e.target.value)}
                placeholder="Bairro"
                required
              />
              <Input
                value={form.cidade}
                onChange={(e) => handleChange('cidade', e.target.value)}
                placeholder="Cidade"
                required
              />
            </div>
          </div>

          {/* Estado civil e Nacionalidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="estado_civil">Estado civil *</Label>
              <select
                id="estado_civil"
                value={form.estado_civil}
                onChange={(e) => handleChange('estado_civil', e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
              >
                <option value="">Selecione...</option>
                <option value="Solteiro(a)">Solteiro(a)</option>
                <option value="Casado(a)">Casado(a)</option>
                <option value="Divorciado(a)">Divorciado(a)</option>
                <option value="Viúvo(a)">Viúvo(a)</option>
                <option value="União estável">União estável</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nacionalidade">Nacionalidade *</Label>
              <Input
                id="nacionalidade"
                value={form.nacionalidade}
                onChange={(e) => handleChange('nacionalidade', e.target.value)}
                placeholder="Brasileira"
                required
              />
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Contato</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(e) => handleChange('telefone', formatarTelefone(e.target.value))}
                placeholder="(21) 99999-0000"
                inputMode="numeric"
                maxLength={15}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="paciente@email.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <textarea
              id="observacoes"
              value={form.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              placeholder="Informações adicionais relevantes..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button type="submit" disabled={salvando} className="gap-2">
            {salvando
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />
            }
            {salvando ? 'Salvando...' : 'Cadastrar paciente'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/pacientes')}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
