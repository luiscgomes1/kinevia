import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { ProfissionalOpcao } from '@/hooks/useProfissionais'

vi.mock('@/services/api', () => ({
  default: { get: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

import api from '@/services/api'
import { useProfissionais } from '@/hooks/useProfissionais'

const lista = [
  { id: 'p1', nome: 'Ana', role: 'ADMIN' },
  { id: 'p2', nome: 'Bruno', role: 'PROFISSIONAL' },
  { id: 'p3', nome: 'Carlos', role: 'ATENDENTE' },
] as ProfissionalOpcao[]

describe('useProfissionais', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('carrega a lista e exclui ATENDENTE por padrão', async () => {
    ;(api.get as any).mockResolvedValue({ data: lista })

    const { result } = renderHook(() => useProfissionais())

    await waitFor(() => expect(result.current.profissionais).toHaveLength(2))
    expect(api.get).toHaveBeenCalledWith('/profissional')
    expect(result.current.profissionais.map((p) => p.id)).toEqual(['p1', 'p2'])
    expect(result.current.carregando).toBe(false)
  })

  it('mantém ATENDENTE quando excluirAtendentes é false', async () => {
    ;(api.get as any).mockResolvedValue({ data: lista })

    const { result } = renderHook(() => useProfissionais({ excluirAtendentes: false }))

    await waitFor(() => expect(result.current.profissionais).toHaveLength(3))
  })

  it('não busca quando habilitado é false', async () => {
    renderHook(() => useProfissionais({ habilitado: false }))

    expect(api.get).not.toHaveBeenCalled()
  })

  it('em erro limpa a lista e define carregando=false', async () => {
    ;(api.get as any).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useProfissionais())

    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(result.current.profissionais).toEqual([])
  })
})