import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
    ArrowLeft, Phone, Mail, MapPin, Calendar,
    UserX, UserCheck, Pencil, Loader2
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import api from '@/services/api'
import ProntuarioTab from './abas/Prontuario'
import SessoesTab from './abas/Sessoes'
import LaudosTab from './abas/Laudos'
import FinanceiroTab from './abas/Financeiro'
import { formatarTelefone } from '@/lib/masks'

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
    return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export default function PerfilPacientePage() {
    const { id } = useParams<{ id: string }>()
    const [searchParams, setSearchParams] = useSearchParams()
    const abaValida = ['prontuario', 'sessoes', 'laudos', 'financeiro']
    const abaDaUrl = searchParams.get('aba')
    const abaInicial = abaValida.includes(abaDaUrl || '') ? abaDaUrl! : 'prontuario'
    const navigate = useNavigate()
    const [paciente, setPaciente] = useState<Paciente | null>(null)
    const [carregando, setCarregando] = useState(true)
    const [alterandoStatus, setAlterandoStatus] = useState(false)

    function handleMudarAba(novaAba: string) {
        setSearchParams({ aba: novaAba })
    }

    useEffect(() => {
        async function carregar() {
            try {
                const response = await api.get(`/pacientes/${id}`)
                setPaciente(response.data)
            } catch {
                navigate('/pacientes')
            } finally {
                setCarregando(false)
            }
        }
        carregar()
    }, [id, navigate])

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
        } catch {
            // silencioso
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
                    <div className="flex items-center gap-2 shrink-0">
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
                    </div>
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

            {/* Abas */}
            <div className="bg-card rounded-xl border border-border">
                <Tabs value={abaInicial} onValueChange={handleMudarAba}>
                    <div className="px-4 sm:px-6 pt-4">
                        <TabsList>
                            <TabsTrigger value="prontuario">Prontuário</TabsTrigger>
                            <TabsTrigger value="sessoes">Sessões</TabsTrigger>
                            <TabsTrigger value="laudos">Laudos</TabsTrigger>
                            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="px-4 sm:px-6 pb-6">
                        <TabsContent value="prontuario">
                            <ProntuarioTab pacienteId={paciente.id} />
                        </TabsContent>

                        <TabsContent value="sessoes">
                            <SessoesTab pacienteId={paciente.id} />
                        </TabsContent>

                        <TabsContent value="laudos">
                            <LaudosTab pacienteId={paciente.id} />
                        </TabsContent>

                        <TabsContent value="financeiro">
                            <FinanceiroTab pacienteId={paciente.id} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    )
}
