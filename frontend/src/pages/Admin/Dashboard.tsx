import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Building2, Users, UserPlus, Loader2, Plus, Pencil, Trash2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import api, { exibirErro } from '@/services/api'
import { useProfissional } from '@/hooks/useProfissional'

interface Resumo {
  totalClinicas: number
  totalUsuarios: number
  totalPacientes: number
  usuariosPorPapel: { papel: string; quantidade: number }[]
}

interface DashboardClinica {
  totalPacientes: number
  totalProfissionais: number
  agendamentosMes: number
  usuariosPorPapel: { papel: string; quantidade: number }[]
}

interface Clinica {
  id: string
  nome: string
  criado_em: string
  _count: { profissionais: number }
}

const rotulosPapel: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Dono',
  PROFISSIONAL: 'Profissional',
  ATENDENTE: 'Atendente',
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { profissional } = useProfissional()
  const isSuperAdmin = profissional?.role === 'SUPER_ADMIN'
  const [carregando, setCarregando] = useState(true)

  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [clinicas, setClinicas] = useState<Clinica[]>([])
  const [dash, setDash] = useState<DashboardClinica | null>(null)

  // CRUD state
  const [showCriar, setShowCriar] = useState(false)
  const [nomeCriar, setNomeCriar] = useState('')
  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState<Clinica | null>(null)
  const [nomeEditar, setNomeEditar] = useState('')
  const [salvandoEditar, setSalvandoEditar] = useState(false)
  const [excluindo, setExcluindo] = useState<Clinica | null>(null)
  const [deletando, setDeletando] = useState(false)

  const carregarDados = useCallback(async () => {
    try {
      if (isSuperAdmin) {
        const [resumoRes, clinicasRes] = await Promise.all([
          api.get('/admin/resumo'),
          api.get('/admin/clinicas'),
        ])
        setResumo(resumoRes.data)
        setClinicas(clinicasRes.data)
      } else {
        const res = await api.get('/admin/dashboard-clinica')
        setDash(res.data)
      }
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao carregar dados.'))
      setResumo(null)
      setClinicas([])
      setDash(null)
    }
  }, [isSuperAdmin])

  useEffect(() => {
    async function carregar() {
      await carregarDados()
      setCarregando(false)
    }
    carregar()
  }, [carregarDados])

  async function handleCriar() {
    if (!nomeCriar.trim() || criando) return
    setCriando(true)
    try {
      await api.post('/admin/clinicas', { nome: nomeCriar.trim() })
      toast.success('Clínica criada!')
      setShowCriar(false)
      setNomeCriar('')
      await carregarDados()
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao criar clínica.'))
    } finally {
      setCriando(false)
    }
  }

  async function handleEditar() {
    if (!editando || !nomeEditar.trim() || salvandoEditar) return
    setSalvandoEditar(true)
    try {
      await api.put(`/admin/clinicas/${editando.id}`, { nome: nomeEditar.trim() })
      toast.success('Clínica atualizada!')
      setEditando(null)
      await carregarDados()
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao atualizar clínica.'))
    } finally {
      setSalvandoEditar(false)
    }
  }

  async function handleExcluir() {
    if (!excluindo || deletando) return
    setDeletando(true)
    try {
      await api.delete(`/admin/clinicas/${excluindo.id}`)
      toast.success('Clínica excluída!')
      setExcluindo(null)
      await carregarDados()
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao excluir clínica.'))
    } finally {
      setDeletando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isSuperAdmin ? 'Admin' : 'Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSuperAdmin ? 'Painel administrativo do sistema' : 'Métricas da sua clínica'}
          </p>
        </div>
        {isSuperAdmin && (
          <Button variant="outline" size="sm" onClick={() => setShowCriar(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Nova clínica
          </Button>
        )}
      </div>

      {isSuperAdmin ? (
        <>
          {/* Cards de resumo (SUPER_ADMIN) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{resumo?.totalClinicas}</p>
                  <p className="text-xs text-muted-foreground">Clínicas</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{resumo?.totalUsuarios}</p>
                  <p className="text-xs text-muted-foreground">Usuários</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{resumo?.totalPacientes}</p>
                  <p className="text-xs text-muted-foreground">Pacientes</p>
                </div>
              </div>
            </div>
          </div>

          {resumo && resumo.usuariosPorPapel.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-sm font-semibold mb-3">Usuários por papel</h2>
              <div className="space-y-2">
                {resumo.usuariosPorPapel.map((u) => (
                  <div key={u.papel} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{rotulosPapel[u.papel] || u.papel}</span>
                    <span className="font-medium">{u.quantidade}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clínicas */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Clínicas</h2>
            <div className="space-y-2">
              {clinicas.map((c) => (
                <div key={c.id} className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:bg-accent/50 transition-colors group">
                  <button onClick={() => navigate(`/admin/clinicas/${c.id}`)} className="flex items-center gap-3 flex-1 text-left">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.nome}</p>
                      <p className="text-xs text-muted-foreground">{c._count.profissionais} profissionais</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditando(c); setNomeEditar(c.nome) }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setExcluindo(c)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors" title="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button variant="outline" onClick={() => navigate('/admin/usuarios')} className="gap-2">
            <Users className="w-4 h-4" />
            Gerenciar usuários
          </Button>
        </>
      ) : (
        <>
          {/* Cards da clínica (ADMIN) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dash?.totalProfissionais ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">Profissionais</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dash?.totalPacientes ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">Pacientes</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dash?.agendamentosMes ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">Agendamentos (mês)</p>
                </div>
              </div>
            </div>
          </div>

          {dash && dash.usuariosPorPapel.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-sm font-semibold mb-3">Profissionais por papel</h2>
              <div className="space-y-2">
                {dash.usuariosPorPapel.map((u) => (
                  <div key={u.papel} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{rotulosPapel[u.papel] || u.papel}</span>
                    <span className="font-medium">{u.quantidade}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialogs CRUD clínicas */}
      {showCriar && isSuperAdmin && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl shadow-2xl border border-border p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-foreground">Nova clínica</h2>
            <div className="mt-4 space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nome da clínica</label>
              <Input value={nomeCriar} onChange={(e) => setNomeCriar(e.target.value)} placeholder="Ex: FisioCenter" autoFocus />
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={() => { setShowCriar(false); setNomeCriar('') }} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              <button onClick={handleCriar} disabled={criando || !nomeCriar.trim()} className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50">{criando ? 'Criando...' : 'Criar'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {editando && isSuperAdmin && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl shadow-2xl border border-border p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-foreground">Editar clínica</h2>
            <div className="mt-4 space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nome da clínica</label>
              <Input value={nomeEditar} onChange={(e) => setNomeEditar(e.target.value)} placeholder="Ex: FisioCenter" autoFocus />
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={() => setEditando(null)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              <button onClick={handleEditar} disabled={salvandoEditar || !nomeEditar.trim()} className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50">{salvandoEditar ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {excluindo && isSuperAdmin && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl shadow-2xl border border-border p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-foreground">Excluir clínica?</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Tem certeza que deseja excluir <strong>{excluindo.nome}</strong>?
              {excluindo._count.profissionais > 0 && (
                <span className="block mt-2 text-amber-600">Esta clínica possui {excluindo._count.profissionais} profissional(is) vinculado(s). Remova-os antes de excluir.</span>
              )}
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={() => setExcluindo(null)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              <button onClick={handleExcluir} disabled={deletando || excluindo._count.profissionais > 0} className="px-4 py-2 text-sm font-medium text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-colors disabled:opacity-50">{deletando ? 'Excluindo...' : 'Excluir'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
