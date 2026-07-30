import { Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useSetupCheck } from '@/hooks/useSetupCheck'
import { getAccessToken, clearAccessToken, tentarRestaurarSessao } from '@/services/api'

type Estado = 'carregando' | 'valido' | 'invalido'

export default function RotaProtegida({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>('carregando')
  const { completo, carregando } = useSetupCheck()

  useEffect(() => {
    ;(async () => {
      if (!getAccessToken()) {
        await tentarRestaurarSessao()
      }
      const token = getAccessToken()
      if (!token) {
        clearAccessToken()
        setEstado('invalido')
        return
      }
      try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(base64))
        if (payload.exp * 1000 < Date.now()) {
          clearAccessToken()
          setEstado('invalido')
          return
        }
      } catch {
        clearAccessToken()
        setEstado('invalido')
        return
      }
      setEstado('valido')
    })()
  }, [])

  if (estado === 'carregando') return null
  if (estado === 'invalido') return <Navigate to="/login" replace />
  if (estado !== 'valido') return null
  if (carregando) return null
  if (!completo) return <Navigate to="/configuracoes?setup=true" replace />

  return <>{children}</>
}
