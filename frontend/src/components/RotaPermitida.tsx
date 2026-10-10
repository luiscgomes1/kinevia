import { Navigate } from 'react-router-dom'
import { useProfissional } from '@/hooks/useProfissional'

export default function RotaPermitida({
  roles,
  children,
}: {
  roles: string[]
  children: React.ReactNode
}) {
  const { profissional } = useProfissional()
  if (!profissional || !roles.includes(profissional.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}