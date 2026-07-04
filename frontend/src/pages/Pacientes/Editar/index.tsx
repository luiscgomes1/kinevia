import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatarTelefone } from '@/lib/masks'
import api from '@/services/api'

export default function EditarPacientePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [editandoEndereco, setEditandoEndereco] = useState(false)

  const [enderecoAtual, setEnderecoAtual] = useState('')
  const [form, setForm] = useState({
    nome: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado_civil: '',
    nacionalidade: '',
    telefone: '',
    email: '',
    observacoes: '',
  })

  useEffect(() => {
    async function carregar() {
      try {
        const response = await api.get(`/pacientes/${id}`)
        const p = response.data
        setEnderecoAtual(p.endereco || '')
        setForm({
          nome: p.nome || '',
          rua: '',
          numero: '',
          bairro: '',
          cidade: '',
          estado_civil: p.estado_civil || '',
          nacionalidade: p.nacionalidade || '',
          telefone: p.telefone ? formatarTelefone(p.telefone) : '',
          email: p.email || '',
          observacoes: p.observacoes || '',
        })
      } catch {
        toast.error('Não foi possível carregar os dados do paciente.')
        navigate('/pacientes')
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [id, navigate])

  function handleChange(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function handleCancelarEndereco() {
    setEditandoEndereco(false)
    setForm((prev) => ({ ...prev, rua: '', numero: '', bairro: '', cidade: '' }))
  }

  async function handleSalvar(e: React.SyntheticEvent) {
    e.preventDefault()
    setSalvando(true)

    const endereco = editandoEndereco
      ? [form.rua, form.numero && `nº ${form.numero}`, form.bairro, form.cidade]
          .filter(Boolean)
          .join(', ')
      : enderecoAtual

    try {
      await api.put(`/pacientes/${id}`, {
        nome: form.nome,
        endereco,
        estado_civil: form.estado_civil,
        nacionalidade: form.nacionalidade,
        telefone: form.telefone || undefined,
        email: form.email || undefined,
        observacoes: form.observacoes || undefined,
      })
      toast.success('Dados atualizados com sucesso!')
      navigate(`/pacientes/${id}`)
    } catch (err) {
      const error = err as { response?: { data?: { erro?: string } } }
      toast.error(error.response?.data?.erro || 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

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

      {/* Cabeçalho */}
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
              required
            />
          </div>

          {/* Endereço */}
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
                  <div className="col-span-2">
                    <Input
                      value={form.rua}
                      onChange={(e) => handleChange('rua', e.target.value)}
                      placeholder="Rua / Avenida"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      value={form.numero}
                      onChange={(e) => handleChange('numero', e.target.value)}
                      placeholder="Número"
                    />
                  </div>
                </div>

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
            )}
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
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <textarea
              id="observacoes"
              value={form.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
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
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/pacientes/${id}`)}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
