import { useCallback, useEffect, useRef, useState } from 'react'
import api from '@/services/api'
import { toast } from 'sonner'

export interface ProfissionalOpcao {
  id: string
  nome: string
  role: string
}

interface UseProfissionaisOpcoes {
  habilitado?: boolean
  excluirAtendentes?: boolean
}

export function useProfissionais({ habilitado = true, excluirAtendentes = true }: UseProfissionaisOpcoes = {}) {
  const [profissionais, setProfissionais] = useState<ProfissionalOpcao[]>([])
  const [carregando, setCarregando] = useState(false)
  const desmontado = useRef(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await api.get<ProfissionalOpcao[]>('/profissional')
      if (!desmontado.current) {
        setProfissionais(excluirAtendentes ? res.data.filter((p) => p.role !== 'ATENDENTE') : res.data)
      }
    } catch {
      if (!desmontado.current) {
        toast.error('Não foi possível carregar os profissionais.')
        setProfissionais([])
      }
    } finally {
      if (!desmontado.current) setCarregando(false)
    }
  }, [excluirAtendentes])

  useEffect(() => {
    desmontado.current = false
    if (!habilitado) return
    let cancelado = false
    ;(async () => {
      await Promise.resolve()
      if (cancelado) return
      await carregar()
    })()
    return () => { cancelado = true; desmontado.current = true }
  }, [habilitado, carregar])

  return { profissionais, carregando, recarregar: carregar }
}