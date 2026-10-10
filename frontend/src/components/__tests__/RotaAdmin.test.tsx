import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { Profissional } from '@/types/api'

vi.mock('@/hooks/useProfissional', () => ({
  useProfissional: vi.fn(),
}))

import { useProfissional } from '@/hooks/useProfissional'
import RotaAdmin from '../RotaAdmin'

function basePerfil(role: Profissional['role']): Profissional {
  return {
    id: 'p1',
    nome: 'Ana',
    email: 'ana@cli.com',
    role,
    clinica_id: 'c1',
    crefito: '123',
    cidade: 'SP',
    uf: 'SP',
    horario_inicio: '07:00',
    horario_fim: '18:00',
    preco_sessao_individual: 100,
    preco_pacote_5: 450,
    preco_pacote_10: 800,
  }
}

function renderComRotas() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route
          path="/admin"
          element={<RotaAdmin><div>conteudo-admin</div></RotaAdmin>}
        />
        <Route path="/dashboard" element={<div>pagina-dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RotaAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('permite acesso para ADMIN', () => {
    ;(useProfissional as any).mockReturnValue({ profissional: basePerfil('ADMIN') })
    renderComRotas()
    expect(screen.getByText('conteudo-admin')).toBeInTheDocument()
  })

  it('permite acesso para SUPER_ADMIN', () => {
    ;(useProfissional as any).mockReturnValue({ profissional: basePerfil('SUPER_ADMIN') })
    renderComRotas()
    expect(screen.getByText('conteudo-admin')).toBeInTheDocument()
  })

  it('redireciona PROFISSIONAL para /dashboard', () => {
    ;(useProfissional as any).mockReturnValue({ profissional: basePerfil('PROFISSIONAL') })
    renderComRotas()
    expect(screen.getByText('pagina-dashboard')).toBeInTheDocument()
    expect(screen.queryByText('conteudo-admin')).not.toBeInTheDocument()
  })

  it('redireciona ATENDENTE para /dashboard', () => {
    ;(useProfissional as any).mockReturnValue({ profissional: basePerfil('ATENDENTE') })
    renderComRotas()
    expect(screen.getByText('pagina-dashboard')).toBeInTheDocument()
    expect(screen.queryByText('conteudo-admin')).not.toBeInTheDocument()
  })

  it('renderiza o conteúdo enquanto o perfil ainda carrega (sem role)', () => {
    ;(useProfissional as any).mockReturnValue({ profissional: null })
    renderComRotas()
    expect(screen.getByText('conteudo-admin')).toBeInTheDocument()
  })
})