import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, useSearchParams, useBlocker } from 'react-router-dom'
import {
    ArrowLeft, Phone, Mail, MapPin, Calendar,
    UserX, UserCheck, Pencil, Loader2,
    Download, Trash2, ArrowRightFromLine,
} from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import api, { exibirErro } from '@/services/api'
import { useProfissional } from '@/hooks/useProfissional'
import ProntuarioTab from './abas/Prontuario'
import SessoesTab from './abas/Sessoes'
import LaudosTab from './abas/Laudos'
import FinanceiroTab from './abas/Financeiro'
import { formatarTelefone } from '@/lib/masks'
import type { Role } from '@/types/api'

interface Paciente {
    id: string
    nome: string
    cpf: string
    data_nascimento: string
    endereco: string
    estado_civil: string
    nacionalidade: string
    telefone: string | null
    email: string | null
    observacoes: string | null
    ativo: boolean
    criado_em: string
}

function calcularIdade(dataNascimento: string): number {
    const hoje = new Date()
    const nasc = new Date(dataNascimento)
    let idade = hoje.getFullYear() - nasc.getFullYear()
    const mes = hoje.getMonth() - nasc.getMonth()
    if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--
    return idade
}

function formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export default function PerfilPacientePage() {
    const { id } = useParams<{ id: string }>()
    const [searchParams, setSearchParams] = useSearchParams()
    const { profissional } = useProfissional()
    const role = profissional?.role

    const rolesComAcoes: Role[] = ['ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN']
    const podeAcoes = profissional && rolesComAcoes.includes(role!)
    const podeVerSessoes = podeAcoes || role === 'ATENDENTE'

    const abas = useMemo(() => {
        const todas = [
            { valor: 'prontuario', rotulo: 'Prontuário' },
            { valor: 'sessoes', rotulo: 'Sessões' },
            { valor: 'laudos', rotulo: 'Laudos' },
            { valor: 'financeiro', rotulo: 'Financeiro' },
        ] as const
        if (!podeAcoes && !podeVerSessoes) return [] as const
        if (role === 'ATENDENTE') return todas.filter(a => a.valor === 'sessoes')
        return todas
    }, [podeAcoes, podeVerSessoes, role])

    const abaValida: string[] = abas.map((a) => a.valor)
    const abaDaUrl = searchParams.get('aba')
    const abaInicial = abaValida.includes(abaDaUrl || '') ? abaDaUrl! : (abaValida[0] ?? 'prontuario')
    const navigate = useNavigate()
    const [paciente, setPaciente] = useState<Paciente | null>(null)
    const [carregando, setCarregando] = useState(true)
    const [alterandoStatus, setAlterandoStatus] = useState(false)
    const [exportando, setExportando] = useState(false)
    const [showAnonimizarConfirm, setShowAnonimizarConfirm] = useState(false)
    const [anonimizando, setAnonimizando] = useState(false)
    const [showTransferir, setShowTransferir] = useState(false)
    const [transferindo, setTransferindo] = useState(false)
    const [profissionais, setProfissionais] = useState<{ id: string, nome: string }[]>([])
    const [profissionalSelecionado, setProfissionalSelecionado] = useState('')
    const [historico, setHistorico] = useState<{ criado_em: string; de: { id: string; nome: string } | null; para: { id: string; nome: string } | null }[]>([])
    const [prontuarioDirty, setProntuarioDirty] = useState(false)
    const [prontuarioKey, setProntuarioKey] = useState(0)
    const [showTabConfirm, setShowTabConfirm] = useState(false)
    const [pendingTab, setPendingTab] = useState<string | null>(null)
    const navBlocker = useBlocker(
      ({ currentLocation, nextLocation }) =>
        prontuarioDirty && currentLocation.pathname !== nextLocation.pathname
    )

    const showNavConfirm = navBlocker.state === 'blocked'

    function handleMudarAba(novaAba: string) {
        const abaAtual = searchParams.get('aba') || 'prontuario'
        if (prontuarioDirty && abaAtual === 'prontuario' && novaAba !== 'prontuario') {
            setPendingTab(novaAba)
            setShowTabConfirm(true)
            return
        }
        setSearchParams({ aba: novaAba })
    }

    useEffect(() => {
        async function carregar() {
            try {
                const response = await api.get(`/pacientes/${id}`)
                setPaciente(response.data)
            } catch {
                navigate('/pacientes')
                return
            }
            try {
                const res = await api.get(`/pacientes/${id}/historico`)
                setHistorico(res.data)
            } catch {
                // histórico não disponível
            } finally {
                setCarregando(false)
            }
        }
        carregar()
    }, [id, navigate])

    async function handleAbrirTransferir() {
      try {
        const res = await api.get('/profissional')
        const lista = res.data as { id: string; nome: string; role: string }[]
        const alvos = lista.filter((p) => p.role !== 'ATENDENTE')
        // O dono pode ser também um profissional que atende — deixá-lo como
        // alvo possível, mesmo que seja o próprio usuário logado.
        if (profissional && !alvos.some((p) => p.id === profissional.id)) {
          alvos.push({ id: profissional.id, nome: profissional.nome, role: profissional.role })
        }
        setProfissionais(alvos)
      } catch {
        toast.error('Erro ao carregar profissionais.')
        return
      }
      setProfissionalSelecionado('')
      setShowTransferir(true)
    }

    async function handleTransferir() {
      if (!paciente || !profissionalSelecionado || transferindo) return
      setTransferindo(true)
      try {
        await api.post(`/pacientes/${paciente.id}/transferir`, {
          novo_profissional_id: profissionalSelecionado,
        })
        toast.success('Paciente transferido com sucesso!')
        setShowTransferir(false)
        navigate('/pacientes')
      } catch (err) {
        toast.error(exibirErro(err, 'Erro ao transferir paciente.'))
      } finally {
        setTransferindo(false)
      }
    }

    async function handleExportar() {
        if (!paciente || exportando) return
        setExportando(true)
        try {
            const res = await api.get(`/pacientes/${paciente.id}/exportar`)
            const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `paciente-${paciente.nome.replace(/\s+/g, '_')}.json`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('Dados exportados com sucesso.')
        } catch (err) {
            toast.error(exibirErro(err, 'Erro ao exportar dados.'))
        } finally {
            setExportando(false)
        }
    }

    async function handleAnonimizar() {
        if (!paciente || anonimizando) return
        setAnonimizando(true)
        try {
            await api.post(`/pacientes/${paciente.id}/anonimizar`)
            toast.success('Paciente anonimizado.')
            navigate('/pacientes')
        } catch (err) {
            toast.error(exibirErro(err, 'Erro ao anonimizar paciente.'))
        } finally {
            setAnonimizando(false)
            setShowAnonimizarConfirm(false)
        }
    }

    async function handleToggleStatus() {
        if (!paciente) return
        setAlterandoStatus(true)
        try {
            if (paciente.ativo) {
                await api.delete(`/pacientes/${paciente.id}`)
                setPaciente({ ...paciente, ativo: false })
            } else {
                await api.patch(`/pacientes/${paciente.id}/reativar`)
                setPaciente({ ...paciente, ativo: true })
            }
        } catch (err) {
            toast.error(exibirErro(err, 'Erro ao alterar status do paciente.'))
        } finally {
            setAlterandoStatus(false)
        }
    }

    // Skeleton
    if (carregando) {
        return (
            <div className="max-w-3xl mx-auto space-y-5">
                <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
                <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                    <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                    <div className="h-6 w-56 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-40 bg-muted/70 animate-pulse rounded" />
                </div>
            </div>
        )
    }

    if (!paciente) return null

    return (
        <div className="max-w-3xl mx-auto space-y-5">

            {/* Cabeçalho */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/pacientes')}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-semibold text-foreground">Perfil do paciente</h1>
            </div>

            {/* Card de identificação */}
            <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0 ${paciente.ativo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                            }`}>
                            {paciente.nome.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg font-semibold text-foreground truncate">{paciente.nome}</h2>
                                {!paciente.ativo && (
                                    <Badge variant="outline" className="text-muted-foreground border-border shrink-0">
                                        Inativo
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {calcularIdade(paciente.data_nascimento)} anos · {paciente.estado_civil} · {paciente.nacionalidade}
                            </p>
                        </div>
                    </div>

                    {/* Ações */}
                    {podeAcoes && (
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/pacientes/${paciente.id}/editar`)}
                                className="gap-1.5 flex-1 sm:flex-none"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                Editar
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportar}
                                disabled={exportando}
                                className="gap-1.5 flex-1 sm:flex-none"
                            >
                                {exportando
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Download className="w-3.5 h-3.5" />
                                }
                                Exportar
                            </Button>
                            {!paciente.ativo && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAnonimizarConfirm(true)}
                                    className="gap-1.5 flex-1 sm:flex-none text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Anonimizar
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleToggleStatus}
                                disabled={alterandoStatus}
                                className={`gap-1.5 flex-1 sm:flex-none ${paciente.ativo
                                    ? 'text-red-600 border-red-200 hover:bg-red-50'
                                    : 'text-green-600 border-green-200 hover:bg-green-50'
                                    }`}
                            >
                                {alterandoStatus
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : paciente.ativo
                                        ? <UserX className="w-3.5 h-3.5" />
                                        : <UserCheck className="w-3.5 h-3.5" />
                                }
                                {paciente.ativo ? 'Desativar' : 'Reativar'}
                            </Button>
                            {(profissional?.role === 'ADMIN' || profissional?.role === 'SUPER_ADMIN') && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAbrirTransferir}
                                    className="gap-1.5 flex-1 sm:flex-none"
                                >
                                    <ArrowRightFromLine className="w-3.5 h-3.5" />
                                    Transferir
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Dados rápidos */}
                <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-border">
                    <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground">Nascimento</p>
                            <p className="text-sm text-foreground">{formatarData(paciente.data_nascimento)}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Endereço</p>
                            <p className="text-sm text-foreground leading-snug [overflow-wrap:anywhere]">{paciente.endereco}</p>
                        </div>
                    </div>
                    {paciente.telefone && (
                        <div className="flex items-start gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground">Telefone</p>
                                <p className="text-sm text-foreground">{formatarTelefone(paciente.telefone)}</p>
                            </div>
                        </div>
                    )}
                    {paciente.email && (
                        <div className="flex items-start gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">E-mail</p>
                                <p className="text-sm text-foreground leading-snug whitespace-normal [overflow-wrap:anywhere]">{paciente.email}</p>
                            </div>
                        </div>
                    )}
                </div>

                {paciente.observacoes && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">Observações</p>
                        <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{paciente.observacoes}</p>
                    </div>
                )}
            </div>

            {/* Histórico de transferências */}
            {historico.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold mb-3">Histórico de transferências</h3>
                <div className="space-y-2">
                  {historico.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-xs shrink-0">{new Date(h.criado_em).toLocaleDateString('pt-BR')}</span>
                      {h.de && <span className="truncate">{h.de.nome}</span>}
                      <span className="text-muted-foreground/50">→</span>
                      {h.para && <span className="truncate font-medium text-foreground">{h.para.nome}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Abas */}
            {abas.length > 0 && (
                <div className="bg-card rounded-xl border border-border">
                    <Tabs value={abaInicial} onValueChange={handleMudarAba}>
                        <div className="px-4 sm:px-6 pt-4">
                            <TabsList>
                                {abas.map((a) => (
                                    <TabsTrigger key={a.valor} value={a.valor}>{a.rotulo}</TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <div className="px-4 sm:px-6 pb-6">
                            {abas.map((a) => (
                                <TabsContent key={a.valor} value={a.valor}>
                                    {a.valor === 'prontuario' && (
                                        <ProntuarioTab key={prontuarioKey} pacienteId={paciente.id} onDirtyChange={setProntuarioDirty} />
                                    )}
                                    {a.valor === 'sessoes' && (
                                        <SessoesTab pacienteId={paciente.id} />
                                    )}
                                    {a.valor === 'laudos' && (
                                        <LaudosTab pacienteId={paciente.id} />
                                    )}
                                    {a.valor === 'financeiro' && (
                                        <FinanceiroTab pacienteId={paciente.id} />
                                    )}
                                </TabsContent>
                            ))}
                        </div>
                    </Tabs>
                </div>
            )}

            {showTabConfirm && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
                    <div className="bg-card rounded-xl shadow-2xl border border-border p-6 max-w-sm w-full mx-4">
                        <h2 className="text-lg font-semibold text-foreground">Descartar alterações?</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            Você tem alterações não salvas no prontuário. Deseja realmente descartá-las?
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowTabConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Continuar editando
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (pendingTab) setSearchParams({ aba: pendingTab })
                                    setShowTabConfirm(false)
                                    setPendingTab(null)
                                    setProntuarioDirty(false)
                                    setProntuarioKey((k) => k + 1)
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-colors"
                            >
                                Descartar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showAnonimizarConfirm && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
                    <div className="bg-card rounded-xl shadow-2xl border border-border p-6 max-w-sm w-full mx-4">
                        <h2 className="text-lg font-semibold text-foreground">Anonimizar paciente?</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            Esta ação é <strong>irreversível</strong>. Os dados identificáveis (nome, CPF, endereço)
                            serão substituídos por "[ANONIMIZADO]". Os registros clínicos serão mantidos
                            para cumprimento de obrigação legal (CFM exige 20 anos de retenção).
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowAnonimizarConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleAnonimizar}
                                disabled={anonimizando}
                                className="px-4 py-2 text-sm font-medium text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {anonimizando ? 'Anonimizando...' : 'Sim, anonimizar'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showTransferir && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
                    <div className="bg-card rounded-xl shadow-2xl border border-border p-6 max-w-sm w-full mx-4">
                        <h2 className="text-lg font-semibold text-foreground">Transferir paciente</h2>
                        <p className="text-sm text-muted-foreground mt-2 mb-4">
                            Selecione o profissional para quem este paciente será transferido. Todos os registros (laudos, pacotes, agendamentos) serão migrados.
                        </p>
                        <select
                            value={profissionalSelecionado}
                            onChange={(e) => setProfissionalSelecionado(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="">Selecione um profissional...</option>
                            {profissionais.map((p) => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                        </select>
                        <div className="mt-6 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowTransferir(false)}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleTransferir}
                                disabled={transferindo || !profissionalSelecionado}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {transferindo ? 'Transferindo...' : 'Transferir'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showNavConfirm && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
                    <div className="bg-card rounded-xl shadow-2xl border border-border p-6 max-w-sm w-full mx-4">
                        <h2 className="text-lg font-semibold text-foreground">Descartar alterações?</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            Você tem alterações não salvas no prontuário. Deseja realmente sair?
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => { if (navBlocker.state === 'blocked') navBlocker.reset() }}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Continuar editando
                            </button>
                            <button
                                type="button"
                                onClick={() => { if (navBlocker.state === 'blocked') navBlocker.proceed() }}
                                className="px-4 py-2 text-sm font-medium text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-colors"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
