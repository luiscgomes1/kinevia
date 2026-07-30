import { useState, useEffect } from 'react'
import type { Profissional } from '@/types/api'
import api from '@/services/api'

let cache: Profissional | null = null
let promise: Promise<Profissional> | null = null

export function clearProfissionalCache() {
  cache = null
  promise = null
}

export function useProfissional() {
  const [profissional, setProfissional] = useState<Profissional | null>(cache)
  const [carregando, setCarregando] = useState(!cache)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cache) return

    if (!promise) {
      promise = api.get<Profissional>('/profissional/me').then((res) => {
        cache = res.data
        return cache
      })
    }

    let cancelado = false

    promise
      .then((data) => {
        if (!cancelado) {
          setProfissional(data)
          setCarregando(false)
        }
      })
      .catch((err: unknown) => {
        promise = null
        if (!cancelado) {
          const mensagem =
            err && typeof err === 'object' && 'response' in err
              ? ((err as { response?: { data?: { erro?: string } } }).response?.data?.erro ?? 'Erro ao carregar dados do profissional.')
              : 'Erro ao carregar dados do profissional.'
          setError(mensagem)
          setCarregando(false)
        }
      })

    return () => {
      cancelado = true
    }
  }, [])

  return { profissional, carregando, error }
}
