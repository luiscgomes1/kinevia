import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import LoginPage from '@/pages/Login'
import Layout from '@/components/Layout'
import ConfiguracoesPage from '@/pages/Configuracoes'
import PacientesPage from '@/pages/Pacientes'
import NovoPacientePage from '@/pages/Pacientes/Novo'
import PerfilPacientePage from '@/pages/Pacientes/Perfil'
import EditarPacientePage from '@/pages/Pacientes/Editar'
import AgendaPage from '@/pages/Agenda'
import FinanceiroPage from '@/pages/Financeiro'

function RotaProtegida({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('accessToken')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <>
      {/* Toaster fica montado uma única vez na raiz.
          Qualquer tela pode disparar toast.success(...) / toast.error(...)
          importando { toast } de 'sonner', sem precisar passar por aqui. */}
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            fontFamily: 'Inter, system-ui, sans-serif',
          },
          duration: 10000,
        }}
      />

      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas protegidas */}
        <Route
          path="/"
          element={
            <RotaProtegida>
              <Layout />
            </RotaProtegida>
          }
        >
          <Route index element={<Navigate to="/agenda" replace />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="pacientes" element={<PacientesPage />} />
          <Route path="pacientes/novo" element={<NovoPacientePage />} />
          <Route path="pacientes/:id" element={<PerfilPacientePage />} />
          <Route path="pacientes/:id/editar" element={<EditarPacientePage />} />
          <Route path="financeiro" element={<FinanceiroPage />} />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
