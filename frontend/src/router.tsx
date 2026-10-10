import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/Login'
import EsqueciSenhaPage from '@/pages/Login/EsqueciSenha'
import RedefinirSenhaPage from '@/pages/Login/RedefinirSenha'
import TrocarSenhaPage from '@/pages/Login/TrocarSenha'
import PrivacidadePage from '@/pages/Login/Privacidade'
import Layout from '@/components/Layout'
import PacientesPage from '@/pages/Pacientes'
import NovoPacientePage from '@/pages/Pacientes/Novo'
import PerfilPacientePage from '@/pages/Pacientes/Perfil'
import EditarPacientePage from '@/pages/Pacientes/Editar'
import AgendaPage from '@/pages/Agenda'
import DashboardPage from '@/pages/Dashboard'
import RotaProtegida from '@/components/RotaProtegida'
import RotaConfiguracoes from '@/components/RotaConfiguracoes'
import RotaPermitida from '@/components/RotaPermitida'
import RotaAdmin from '@/components/RotaAdmin'
import { RouteError } from '@/components/RouteError'
import { FinanceiroPage, RelatoriosPage, AdminDashboard, ClinicaDetalhePage, AuditoriaPage, UsuariosPage, Lazy } from '@/lazyPages'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
  { path: '/esqueci-senha', element: <EsqueciSenhaPage />, errorElement: <RouteError /> },
  { path: '/redefinir-senha', element: <RedefinirSenhaPage />, errorElement: <RouteError /> },
  { path: '/trocar-senha', element: <TrocarSenhaPage />, errorElement: <RouteError /> },
  { path: '/privacidade', element: <PrivacidadePage />, errorElement: <RouteError /> },
  {
    path: '/',
    element: <RotaProtegida><Layout /></RotaProtegida>,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage />, errorElement: <RouteError /> },
      { path: 'agenda', element: <AgendaPage />, errorElement: <RouteError /> },
      { path: 'pacientes', element: <PacientesPage />, errorElement: <RouteError /> },
      { path: 'pacientes/novo', element: <NovoPacientePage />, errorElement: <RouteError /> },
      { path: 'pacientes/:id', element: <PerfilPacientePage />, errorElement: <RouteError /> },
      { path: 'pacientes/:id/editar', element: <EditarPacientePage />, errorElement: <RouteError /> },
      { path: 'financeiro', element: <RotaPermitida roles={['ADMIN', 'SUPER_ADMIN']}><Lazy><FinanceiroPage /></Lazy></RotaPermitida>, errorElement: <RouteError /> },
      { path: 'relatorios', element: <RotaPermitida roles={['ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN']}><Lazy><RelatoriosPage /></Lazy></RotaPermitida>, errorElement: <RouteError /> },
      { path: 'configuracoes', element: <RotaConfiguracoes />, errorElement: <RouteError /> },
      { path: 'admin', element: <RotaAdmin><Lazy><AdminDashboard /></Lazy></RotaAdmin>, errorElement: <RouteError /> },
      { path: 'admin/auditoria', element: <RotaAdmin><Lazy><AuditoriaPage /></Lazy></RotaAdmin>, errorElement: <RouteError /> },
      { path: 'admin/usuarios', element: <RotaAdmin><Lazy><UsuariosPage /></Lazy></RotaAdmin>, errorElement: <RouteError /> },
      { path: 'admin/clinicas/:id', element: <RotaAdmin><Lazy><ClinicaDetalhePage /></Lazy></RotaAdmin>, errorElement: <RouteError /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])