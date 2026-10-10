import { Navigate } from 'react-router-dom'
import ConfiguracoesPage from '@/pages/Configuracoes'
import { useProfissional } from '@/hooks/useProfissional'

export default function RotaConfiguracoes() {
  const { profissional } = useProfissional()
  if (profissional?.role === 'ATENDENTE') {
    return <Navigate to="/dashboard" replace />
  }
  return <ConfiguracoesPage />
}
