import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Users,
  DollarSign,
  Settings,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  ClipboardList,
  LayoutDashboard,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import logoKinevia from '@/assets/logo-kinevia-2.png'
import api, { clearAccessToken } from '@/services/api'
import { clearProfissionalCache, useProfissional } from '@/hooks/useProfissional'
import { useTheme } from '@/components/ThemeProvider'
import NotificacaoPopover from '@/components/NotificacaoPopover'
import type { Role } from '@/types/api'

const itensNav = [
  { label: 'Dashboard', icone: LayoutDashboard, href: '/dashboard' },
  { label: 'Agenda', icone: CalendarDays, href: '/agenda' },
  { label: 'Pacientes', icone: Users, href: '/pacientes' },
  { label: 'Financeiro', icone: DollarSign, href: '/financeiro' },
  { label: 'Relatórios', icone: BarChart3, href: '/relatorios' },
  { label: 'Configurações', icone: Settings, href: '/configuracoes' },
] as const

const rolesAdmin: Role[] = ['ADMIN', 'SUPER_ADMIN']

const rotulosRole: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Dono',
  PROFISSIONAL: 'Profissional',
  ATENDENTE: 'Atendente',
}

export default function Layout() {
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { profissional } = useProfissional()

  const itensNavCompletos = useMemo(() => {
    let base: readonly typeof itensNav[number][] = itensNav
    if (profissional?.role === 'ATENDENTE') {
      base = itensNav.filter((i) => i.href === '/dashboard' || i.href === '/agenda' || i.href === '/pacientes')
    }
    if (profissional?.role === 'PROFISSIONAL') {
      base = itensNav.filter((i) => i.href !== '/financeiro')
    }
    if (profissional?.role === 'SUPER_ADMIN') {
      return [
        ...base,
        { label: 'Auditoria', icone: ClipboardList, href: '/admin/auditoria' },
        { label: 'Admin', icone: Shield, href: '/admin' },
      ]
    }
    if (profissional && rolesAdmin.includes(profissional.role)) {
      return [
        ...base,
        { label: 'Auditoria', icone: ClipboardList, href: '/admin/auditoria' },
        { label: 'Painel do Dono', icone: Shield, href: '/admin' },
        { label: 'Usuários', icone: Shield, href: '/admin/usuarios' },
      ]
    }
    return base
  }, [profissional])

  async function handleLogout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // falha no logout remoto não impede logout local
    }
    clearAccessToken()
    clearProfissionalCache()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Sidebar desktop ─────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 bg-card border-r border-border fixed h-full z-10">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <img
              src={logoKinevia}
              alt="Kinevia"
              className="h-8 w-auto shrink-0"
            />
            <span className="font-logo font-bold text-foreground text-sm tracking-tight">Kinevia</span>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {itensNavCompletos.map(({ label, icone: Icone, href }) => (
            <NavLink
              key={href}
              to={href}
              end={href === '/admin'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )
              }
            >
              <Icone className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Rodapé da sidebar — usuário, notificações, tema + logout */}
        <div className="px-3 pt-4 pb-2 border-t border-border space-y-1">
          {profissional && (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                {profissional.nome.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{profissional.nome}</p>
                <p className="text-xs text-muted-foreground truncate">{rotulosRole[profissional.role]}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1 px-3 pt-2 pb-2">
            <NotificacaoPopover abreParaDireita abreParaCima mostrarLabel />
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full"
            title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4 shrink-0" /> : <Sun className="w-4 h-4 shrink-0" />}
            {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Header mobile ───────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={logoKinevia}
            alt="Kinevia"
            className="h-7 w-auto"
          />
          <span className="font-logo font-bold text-foreground text-sm">Kinevia</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificacaoPopover />
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
          >
            {menuAberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── Menu mobile (drawer) ─────────────────────────── */}
      {menuAberto && (
        <div className="md:hidden fixed inset-0 z-10 bg-black/30" onClick={() => setMenuAberto(false)}>
          <div
            className="absolute top-[57px] left-0 right-0 bg-card border-b border-border p-3 space-y-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {itensNavCompletos.map(({ label, icone: Icone, href }) => (
              <NavLink
                key={href}
                to={href}
                end={href === '/admin'}
                onClick={() => setMenuAberto(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent'
                  )
                }
              >
                <Icone className="w-4 h-4 shrink-0" />
                {label}
              </NavLink>
            ))}
            <div className="pt-2 border-t border-border mt-2 space-y-1">
              {profissional && (
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                    {profissional.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{profissional.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{rotulosRole[profissional.role]}</p>
                  </div>
                </div>
              )}
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors w-full"
              >
                {theme === 'light' ? <Moon className="w-4 h-4 shrink-0" /> : <Sun className="w-4 h-4 shrink-0" />}
                {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors w-full"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Conteúdo principal ──────────────────────────── */}
      <main className="flex-1 md:ml-56 pt-0 md:pt-0 min-w-0">
        {/* Espaço para o header mobile */}
        <div className="md:hidden h-[57px]" />
        {/* pb-24 no mobile reserva espaço para a bottom navigation fixa não cobrir o final do conteúdo */}
        <div className="p-6 pb-24 md:pb-6">
          <Outlet />
          {/* Outlet renderiza a página filha da rota atual */}
        </div>
      </main>

      {/* ── Bottom navigation mobile ─────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-10">
        <div className="flex items-center overflow-x-auto px-2 py-2 gap-1 scrollbar-none">
          {itensNavCompletos.map(({ label, icone: Icone, href }) => (
            <NavLink
              key={href}
              to={href}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors shrink-0',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              <Icone className="w-5 h-5" />
              <span className="text-[10px] font-medium whitespace-nowrap">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
