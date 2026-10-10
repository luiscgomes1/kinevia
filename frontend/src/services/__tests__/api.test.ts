import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toast } from 'sonner'

const { mockAxios, mockCreate, requestHandlers, responseHandlers } = vi.hoisted(() => {
  const requestHandlers: Array<(config: any) => any> = []
  const responseHandlers: Array<{ ok: (r: any) => any; err: (e: any) => any }> = []
  const mockAxios = vi.fn()
  ;(mockAxios as any).defaults = { baseURL: 'http://localhost:3333/v1' }
  ;(mockAxios as any).interceptors = {
    request: { use: (fn: (c: any) => any) => { requestHandlers.push(fn); return 0 } },
    response: { use: (ok: (r: any) => any, err: (e: any) => any) => { responseHandlers.push({ ok, err }); return 0 } },
  }
  ;(mockAxios as any).get = vi.fn()
  ;(mockAxios as any).post = vi.fn()
  ;(mockAxios as any).put = vi.fn()
  ;(mockAxios as any).patch = vi.fn()
  ;(mockAxios as any).delete = vi.fn()
  const mockCreate = vi.fn(() => mockAxios)
  return { mockAxios, mockCreate, requestHandlers, responseHandlers }
})

const axiosMock = mockAxios as any

vi.mock('axios', () => ({
  default: { create: mockCreate },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import {
  setAccessToken,
  getAccessToken,
  clearAccessToken,
  tentarRestaurarSessao,
} from '@/services/api'

describe('services/api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearAccessToken()
    vi.stubGlobal('location', { href: 'http://localhost:3000/' })
  })

  it('adiciona o header Authorization no request quando há token', () => {
    setAccessToken('meu-token')
    const config = { headers: {} as Record<string, unknown> }
    requestHandlers[0](config)
    expect(config.headers.Authorization).toBe('Bearer meu-token')
  })

  it('não adiciona Authorization sem token', () => {
    const config = { headers: {} as Record<string, unknown> }
    requestHandlers[0](config)
    expect(config.headers.Authorization).toBeUndefined()
  })

  it('em 401 dispara refresh e reexecuta a requisição original', async () => {
    setAccessToken('token-antigo')
    ;(axiosMock.post as any).mockResolvedValue({ data: { accessToken: 'token-novo' } })

    const errHandler = responseHandlers[0].err
    const originalConfig = { url: '/pacientes', headers: {} as Record<string, unknown>, _retry: false }
    const erro = { response: { status: 401 }, config: originalConfig }

    await errHandler(erro)

    expect(axiosMock.post).toHaveBeenCalledWith('/auth/refresh')
    expect(getAccessToken()).toBe('token-novo')
    expect(originalConfig._retry).toBe(true)
    expect(mockAxios).toHaveBeenCalledWith(originalConfig)
  })

  it('não tenta refresh em 401 do próprio /auth/login ou /auth/refresh', async () => {
    setAccessToken('token-antigo')

    const errHandler = responseHandlers[0].err
    for (const url of ['/auth/login', '/auth/refresh']) {
      const erro = { response: { status: 401 }, config: { url, headers: {} as Record<string, unknown>, _retry: false } }
      await expect(errHandler(erro)).rejects.toBeTruthy()
    }
    expect(axiosMock.post).not.toHaveBeenCalled()
  })

  it('em falha do refresh limpa o token, avisa e redireciona para /login', async () => {
    setAccessToken('token-antigo')
    ;(axiosMock.post as any).mockRejectedValue(new Error('expirado'))

    const errHandler = responseHandlers[0].err
    const erro = { response: { status: 401 }, config: { url: '/pacientes', headers: {} as Record<string, unknown>, _retry: false } }

    await errHandler(erro).catch(() => {})

    expect(getAccessToken()).toBeNull()
    expect(toast.error).toHaveBeenCalledWith('Sua sessão expirou. Faça login novamente.')
    expect((globalThis as any).location.href).toBe('/login')
  })

  it('deixa passar erros que não são 401', async () => {
    setAccessToken('token-antigo')
    const errHandler = responseHandlers[0].err
    const erro = { response: { status: 500 }, config: { url: '/pacientes', headers: {} as Record<string, unknown>, _retry: false } }
    await expect(errHandler(erro)).rejects.toBe(erro)
    expect(axiosMock.post).not.toHaveBeenCalled()
  })

  it('tentarRestaurarSessao restaura sessão com sucesso', async () => {
    ;(axiosMock.post as any).mockResolvedValue({ data: { accessToken: 'token-restaurado' } })
    const ok = await tentarRestaurarSessao()
    expect(ok).toBe(true)
    expect(getAccessToken()).toBe('token-restaurado')
  })

  it('tentarRestaurarSessao falha e limpa token', async () => {
    ;(axiosMock.post as any).mockRejectedValue(new Error('expirado'))
    const ok = await tentarRestaurarSessao()
    expect(ok).toBe(false)
    expect(getAccessToken()).toBeNull()
  })
})
