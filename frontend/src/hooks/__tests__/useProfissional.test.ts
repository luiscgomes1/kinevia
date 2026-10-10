import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { Profissional } from '@/types/api'

vi.mock('@/services/api', () => ({
  default: { get: vi.fn() },
}))

import api from '@/services/api'
import { useProfissional, clearProfissionalCache } from '@/hooks/useProfissional'

const perfil: Profissional = {
  id: 'p1',
  nome: 'Ana',
  email: 'ana@cli.com',
  role: 'ADMIN',
  clinica_id: 'c1',
  crefito: '123',
  cidade: '',
  uf: '',
  horario_inicio: '07:00',
  horario_fim: '18:00',
  preco_sessao_individual: 100,
  preco_pacote_5: 450,
  preco_pacote_10: 800,
}

describe('useProfissional', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearProfissionalCache()
  })

  it('carrega o perfil e expõe profissional/carregando/error', async () => {
    ;(api.get as any).mockResolvedValue({ data: perfil })

    const { result } = renderHook(() => useProfissional())

    await waitFor(() => expect(result.current.profissional).toEqual(perfil))
    expect(api.get).toHaveBeenCalledWith('/profissional/me')
    expect(result.current.carregando).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('usa o cache e não refaz a requisição em um novo uso', async () => {
    ;(api.get as any).mockResolvedValue({ data: perfil })

    const primeiro = renderHook(() => useProfissional())
    await waitFor(() => expect(primeiro.result.current.profissional).toEqual(perfil))
    primeiro.unmount()

    const segundo = renderHook(() => useProfissional())
    await waitFor(() => expect(segundo.result.current.profissional).toEqual(perfil))

    expect(api.get).toHaveBeenCalledTimes(1)
  })

  it('clearProfissionalCache invalida o cache e refaz a requisição', async () => {
    ;(api.get as any).mockResolvedValue({ data: perfil })

    const primeiro = renderHook(() => useProfissional())
    await waitFor(() => expect(primeiro.result.current.profissional).toEqual(perfil))
    primeiro.unmount()

    clearProfissionalCache()

    const segundo = renderHook(() => useProfissional())
    await waitFor(() => expect(segundo.result.current.profissional).toEqual(perfil))

    expect(api.get).toHaveBeenCalledTimes(2)
  })

  it('em erro define error e carregando=false, e permite nova tentativa após limpar cache', async () => {
    ;(api.get as any).mockRejectedValue(new Error('boom'))

    const primeiro = renderHook(() => useProfissional())
    await waitFor(() => expect(primeiro.result.current.error).not.toBeNull())
    expect(primeiro.result.current.carregando).toBe(false)
    primeiro.unmount()

    clearProfissionalCache()
    ;(api.get as any).mockResolvedValue({ data: perfil })

    const segundo = renderHook(() => useProfissional())
    await waitFor(() => expect(segundo.result.current.profissional).toEqual(perfil))
    expect(segundo.result.current.error).toBeNull()
  })
})