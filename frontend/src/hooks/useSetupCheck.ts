import { useProfissional } from './useProfissional'

export function useSetupCheck() {
  const { profissional, carregando } = useProfissional()

  const completo = !!(profissional?.crefito && profissional?.cidade && profissional?.uf)

  return { completo, carregando }
}
