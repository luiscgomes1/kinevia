import { useState, useCallback, useRef } from 'react'
import api from '@/services/api'

interface Notificacao {
  id: string
  tipo: string
  titulo: string
  mensagem: string
  lida: boolean
  criado_em: string
}

export function useNotificacoes() {
  const [naoLidas, setNaoLidas] = useState(0)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [aberto, setAberto] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const carregarNaoLidas = useCallback(async () => {
    try {
      const res = await api.get<{ total: number }>('/notificacoes/nao-lidas')
      setNaoLidas(res.data.total)
    } catch {
      // polling continua na próxima tentativa
    }
  }, [])

  const carregarLista = useCallback(async () => {
    try {
      const res = await api.get<Notificacao[]>('/notificacoes')
      setNotificacoes(res.data)
    } catch {
      // erro silencioso: listagem será tentada novamente ao abrir
    }
  }, [])

  const iniciarPolling = useCallback(() => {
    carregarNaoLidas()
    if (!intervalRef.current) {
      intervalRef.current = setInterval(carregarNaoLidas, 30000)
    }
  }, [carregarNaoLidas])

  const pararPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const abrir = useCallback(async () => {
    setAberto(true)
    await carregarLista()
  }, [carregarLista])

  const fechar = useCallback(() => {
    setAberto(false)
  }, [])

  const marcarLida = useCallback(async (id: string) => {
    try {
      await api.patch(`/notificacoes/${id}/ler`)
      setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
      setNaoLidas((prev) => Math.max(0, prev - 1))
    } catch {
      // erro silencioso: status será tentado novamente
    }
  }, [])

  const marcarTodasLidas = useCallback(async () => {
    try {
      await api.patch('/notificacoes/ler-todas')
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
      setNaoLidas(0)
    } catch {
      // erro silencioso: marcação será tentada novamente
    }
  }, [])

  return {
    naoLidas,
    notificacoes,
    aberto,
    abrir,
    fechar,
    marcarLida,
    marcarTodasLidas,
    iniciarPolling,
    pararPolling,
    carregarNaoLidas,
  }
}
