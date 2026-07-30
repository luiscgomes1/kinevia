import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/Login'
import EsqueciSenhaPage from '@/pages/Login/EsqueciSenha'
import RedefinirSenhaPage from '@/pages/Login/RedefinirSenha'
import Layout from '@/components/Layout'
import ConfiguracoesPage from '@/pages/Configuracoes'
import PacientesPage from '@/pages/Pacientes'
import NovoPacientePage from '@/pages/Pacientes/Novo'
import PerfilPacientePage from '@/pages/Pacientes/Perfil'
import EditarPacientePage from '@/pages/Pacientes/Editar'
import AgendaPage from '@/pages/Agenda'
import FinanceiroPage from '@/pages/Financeiro'
import RelatoriosPage from '@/pages/Relatorios'
import RotaProtegida from '@/components/RotaProtegida'
import { RouteError } from '@/components/RouteError'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
  { path: '/esqueci-senha', element: <EsqueciSenhaPage />, errorElement: <RouteError /> },
  { path: '/redefinir-senha', element: <RedefinirSenhaPage />, errorElement: <RouteError /> },
  {
    path: '/',
    element: <RotaProtegida><Layout /></RotaProtegida>,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/agenda" replace /> },
      { path: 'agenda', element: <AgendaPage />, errorElement: <RouteError /> },
      { path: 'pacientes', element: <PacientesPage />, errorElement: <RouteError /> },
      { path: 'pacientes/novo', element: <NovoPacientePage />, errorElement: <RouteError /> },
      { path: 'pacientes/:id', element: <PerfilPacientePage />, errorElement: <RouteError /> },
      { path: 'pacientes/:id/editar', element: <EditarPacientePage />, errorElement: <RouteError /> },
      { path: 'financeiro', element: <FinanceiroPage />, errorElement: <RouteError /> },
      { path: 'relatorios', element: <RelatoriosPage />, errorElement: <RouteError /> },
      { path: 'configuracoes', element: <ConfiguracoesPage />, errorElement: <RouteError /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
