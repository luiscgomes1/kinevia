import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { Profissional } from '@/types/api'

vi.mock('@/hooks/useProfissional', () => ({
  useProfissional: vi.fn(),
}))

vi.mock('@/pages/Configuracoes', () => ({
  default: () => <div>pagina-configuracoes</div>,
}))

import { useProfissional } from '@/hooks/useProfissional'
import RotaConfiguracoes from '../RotaConfiguracoes'

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
    <MemoryRouter initialEntries={['/configuracoes']}>
      <Routes>
        <Route path="/configuracoes" element={<RotaConfiguracoes />} />
        <Route path="/dashboard" element={<div>pagina-dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RotaConfiguracoes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('bloqueia ATENDENTE e redireciona para /dashboard', () => {
    ;(useProfissional as any).mockReturnValue({ profissional: basePerfil('ATENDENTE') })
    renderComRotas()
    expect(screen.getByText('pagina-dashboard')).toBeInTheDocument()
    expect(screen.queryByText('pagina-configuracoes')).not.toBeInTheDocument()
  })

  it('permite acesso para PROFISSIONAL', () => {
    ;(useProfissional as any).mockReturnValue({ profissional: basePerfil('PROFISSIONAL') })
    renderComRotas()
    expect(screen.getByText('pagina-configuracoes')).toBeInTheDocument()
  })

  it('permite acesso para ADMIN', () => {
    ;(useProfissional as any).mockReturnValue({ profissional: basePerfil('ADMIN') })
    renderComRotas()
    expect(screen.getByText('pagina-configuracoes')).toBeInTheDocument()
  })
})