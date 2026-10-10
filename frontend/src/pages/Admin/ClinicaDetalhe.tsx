import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import api from '@/services/api'
import type { Role } from '@/types/api'

interface ProfissionalResumo {
  id: string
  nome: string
  email: string
  role: Role
  senha_temporaria: boolean
  criado_em: string
}

interface ClinicaDetalhe {
  id: string
  nome: string
  criado_em: string
  profissionais: ProfissionalResumo[]
}

const rotulosPapel: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Dono',
  PROFISSIONAL: 'Profissional',
  ATENDENTE: 'Atendente',
}

const coresPapel: Record<Role, 'destructive' | 'default' | 'success' | 'warning' | 'secondary'> = {
  SUPER_ADMIN: 'destructive',
  ADMIN: 'default',
  PROFISSIONAL: 'success',
  ATENDENTE: 'secondary',
}

export default function ClinicaDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [clinica, setClinica] = useState<ClinicaDetalhe | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        const res = await api.get(`/admin/clinicas/${id}`)
        setClinica(res.data)
      } catch {
        navigate('/admin')
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [id, navigate])

  if (carregando) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!clinica) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{clinica.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {clinica.profissionais.length} profissionais
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 text-sm text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Nome</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Papel</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {clinica.profissionais.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{p.nome}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={coresPapel[p.role]}>{rotulosPapel[p.role]}</Badge>
                </td>
                <td className="px-4 py-3">
                  {p.senha_temporaria ? (
                    <Badge variant="warning">Senha temporária</Badge>
                  ) : (
                    <Badge variant="success">Ativo</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
