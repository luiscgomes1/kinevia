import { Navigate } from 'react-router-dom'
import { useProfissional } from '@/hooks/useProfissional'

export default function RotaAdmin({ children }: { children: React.ReactNode }) {
  const { profissional } = useProfissional()
  if (profissional && profissional.role !== 'ADMIN' && profissional.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}