import { useProfissional } from './useProfissional'

export function useSetupCheck() {
  const { profissional, carregando } = useProfissional()

  // ATENDENTE não emite laudos e não agenda atendimentos próprios,
  // então não passa pelo setup de CREFITO/CIDADE/UF.
  const completo =
    profissional?.role === 'ATENDENTE' ||
    !!(profissional?.crefito && profissional?.cidade && profissional?.uf)

  return { completo, carregando }
}
