import { lazy, Suspense, type ReactNode } from 'react'

export const FinanceiroPage = lazy(() => import('@/pages/Financeiro'))
export const RelatoriosPage = lazy(() => import('@/pages/Relatorios'))
export const AdminDashboard = lazy(() => import('@/pages/Admin/Dashboard'))
export const ClinicaDetalhePage = lazy(() => import('@/pages/Admin/ClinicaDetalhe'))
export const AuditoriaPage = lazy(() => import('@/pages/Admin/Auditoria'))
export const UsuariosPage = lazy(() => import('@/pages/Admin/Usuarios'))

export function Lazy({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      {children}
    </Suspense>
  )
}