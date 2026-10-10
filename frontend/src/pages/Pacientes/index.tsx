import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, UserPlus, UserCheck, Users, ChevronRight, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import api from '@/services/api'
import { exibirErro } from '@/services/api'
import { formatarTelefone } from '@/lib/masks'

interface Paciente {
  id: string
  nome: string
  telefone: string | null
  ativo: boolean
  criado_em: string
}

export default function PacientesPage() {
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [busca, setBusca] = useState('')
  const [incluirInativos, setIncluirInativos] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const offsetRef = useRef(0)
  const [acabou, setAcabou] = useState(false)
  const limite = 30

  const carregar = useCallback(async (reset: boolean, offsetAtual?: number, signal?: AbortSignal) => {
    const off = reset ? 0 : (offsetAtual ?? offsetRef.current)
    if (reset) { setCarregando(true); offsetRef.current = 0; setAcabou(false) }
    else setCarregandoMais(true)
    try {
      const params = new URLSearchParams()
      if (busca) params.set('busca', busca)
      if (incluirInativos) params.set('incluirInativos', 'true')
      params.set('limit', String(limite))
      params.set('offset', String(off))
      const response = await api.get(`/pacientes?${params.toString()}`, { signal })
      if (reset) {
        setPacientes(response.data)
      } else {
        setPacientes((prev) => [...prev, ...response.data])
      }
      if (response.data.length < limite) setAcabou(true)
    } catch (err) {
      if (signal?.aborted) return
      toast.error(exibirErro(err, 'Erro ao carregar pacientes.'))
    } finally {
      if (!signal?.aborted) {
        setCarregando(false)
        setCarregandoMais(false)
      }
    }
  }, [busca, incluirInativos])

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => carregar(true, undefined, controller.signal), 300)
    return () => { controller.abort(); clearTimeout(timeout) }
  }, [busca, incluirInativos, carregar])

  return (
    <div className="space-y-5">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Pacientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pacientes.length} paciente{pacientes.length !== 1 ? 's' : ''} encontrado{pacientes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/pacientes/novo')} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Novo paciente
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="pl-9"
          />
        </div>
        <div className="inline-flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
          <button
            type="button"
            onClick={() => setIncluirInativos(false)}
            aria-pressed={!incluirInativos}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-all ${
              !incluirInativos
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Ativos
          </button>
          <button
            type="button"
            onClick={() => setIncluirInativos(true)}
            aria-pressed={incluirInativos}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-all ${
              incluirInativos
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            Todos
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-card rounded-xl border border-border divide-y divide-border">

        {/* Skeleton */}
        {carregando && (
          <>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-28 bg-muted/70 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </>
        )}

        {/* Vazio */}
        {!carregando && pacientes.length === 0 && (
          <div className="px-5 py-12 text-center">
            <UserPlus className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Nenhum paciente encontrado</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {busca ? 'Tente uma busca diferente.' : 'Cadastre o primeiro paciente.'}
            </p>
          </div>
        )}

        {/* Itens */}
        {!carregando && pacientes.map((paciente) => (
          <button
            key={paciente.id}
            onClick={() => navigate(`/pacientes/${paciente.id}`)}
            className="flex items-center gap-4 px-5 py-4 w-full hover:bg-accent transition-colors text-left"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
              paciente.ativo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {paciente.nome.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium truncate ${
                  paciente.ativo ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {paciente.nome}
                </span>
                {!paciente.ativo && (
                  <Badge variant="outline" className="text-muted-foreground border-border shrink-0">
                    Inativo
                  </Badge>
                )}
              </div>
              {paciente.telefone && (
                <p className="text-xs text-muted-foreground mt-0.5">{formatarTelefone(paciente.telefone)}</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
          </button>
        ))}
      </div>

      {/* Carregar mais */}
      {!carregando && !acabou && pacientes.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={carregandoMais}
            onClick={() => {
              const novoOffset = pacientes.length
              offsetRef.current = novoOffset
              carregar(false, novoOffset)
            }}
            className="gap-2"
          >
            {carregandoMais ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {carregandoMais ? 'Carregando...' : 'Carregar mais'}
          </Button>
        </div>
      )}
    </div>
  )
}
