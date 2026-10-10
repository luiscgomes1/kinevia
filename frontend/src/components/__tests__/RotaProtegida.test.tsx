import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('@/services/api', () => ({
  getAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
  tentarRestaurarSessao: vi.fn(),
}))

vi.mock('@/hooks/useSetupCheck', () => ({
  useSetupCheck: vi.fn(),
}))

import { getAccessToken, clearAccessToken, tentarRestaurarSessao } from '@/services/api'
import { useSetupCheck } from '@/hooks/useSetupCheck'
import RotaProtegida from '../RotaProtegida'

function tokenCom(payload: Record<string, unknown>): string {
  const b64 = btoa(JSON.stringify(payload))
  return `header.${b64}.assinatura`
}

function renderComRotas() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<RotaProtegida><div>conteudo-protegido</div></RotaProtegida>} />
        <Route path="/login" element={<div>pagina-login</div>} />
        <Route path="/trocar-senha" element={<div>pagina-trocar-senha</div>} />
        <Route path="/configuracoes" element={<div>pagina-configuracoes</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RotaProtegida', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useSetupCheck as any).mockReturnValue({ completo: true, carregando: false })
  })

  it('redireciona para /login se não há token nem sessão restaurada', async () => {
    ;(getAccessToken as any).mockReturnValue(null)
    ;(tentarRestaurarSessao as any).mockResolvedValue(false)

    renderComRotas()
    await waitFor(() => expect(screen.getByText('pagina-login')).toBeInTheDocument())
    expect(screen.queryByText('conteudo-protegido')).not.toBeInTheDocument()
  })

  it('aceita token válido e renderiza o conteúdo', async () => {
    ;(getAccessToken as any).mockReturnValue(tokenCom({ exp: Math.floor(Date.now() / 1000) + 3600 }))

    renderComRotas()
    await waitFor(() => expect(screen.getByText('conteudo-protegido')).toBeInTheDocument())
  })

  it('redireciona para /login se o token expirou', async () => {
    ;(getAccessToken as any).mockReturnValue(tokenCom({ exp: Math.floor(Date.now() / 1000) - 10 }))

    renderComRotas()
    await waitFor(() => expect(screen.getByText('pagina-login')).toBeInTheDocument())
    expect(clearAccessToken).toHaveBeenCalled()
  })

  it('redireciona para /trocar-senha se senha_temporaria', async () => {
    ;(getAccessToken as any).mockReturnValue(tokenCom({ exp: Math.floor(Date.now() / 1000) + 3600, senha_temporaria: true }))

    renderComRotas()
    await waitFor(() => expect(screen.getByText('pagina-trocar-senha')).toBeInTheDocument())
  })

  it('não renderiza o conteúdo enquanto o JWT for inválido', async () => {
    ;(getAccessToken as any).mockReturnValue('token-invalido')

    renderComRotas()
    await waitFor(() => expect(screen.getByText('pagina-login')).toBeInTheDocument())
  })

  it('redireciona para /configuracoes?setup=true se o setup está incompleto', async () => {
    ;(getAccessToken as any).mockReturnValue(tokenCom({ exp: Math.floor(Date.now() / 1000) + 3600 }))
    ;(useSetupCheck as any).mockReturnValue({ completo: false, carregando: false })

    renderComRotas()
    await waitFor(() => expect(screen.getByText('pagina-configuracoes')).toBeInTheDocument())
    expect(screen.queryByText('conteudo-protegido')).not.toBeInTheDocument()
  })
})