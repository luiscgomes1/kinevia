import { describe, it, expect } from 'vitest'
import { labelTipoPacote, precoPadraoParaTipo, LIMITE_SESSOES_POR_TIPO } from '../pacotes'

describe('LIMITE_SESSOES_POR_TIPO', () => {
  it('define limites corretos', () => {
    expect(LIMITE_SESSOES_POR_TIPO.INDIVIDUAL).toBe(1)
    expect(LIMITE_SESSOES_POR_TIPO.PACOTE_5).toBe(5)
    expect(LIMITE_SESSOES_POR_TIPO.PACOTE_10).toBe(10)
  })
})

describe('labelTipoPacote', () => {
  it('retorna label para cada tipo', () => {
    expect(labelTipoPacote('INDIVIDUAL')).toBe('Individual')
    expect(labelTipoPacote('PACOTE_5')).toBe('Pacote 5')
    expect(labelTipoPacote('PACOTE_10')).toBe('Pacote 10')
  })
})

describe('precoPadraoParaTipo', () => {
  const precos = { preco_sessao_individual: 100, preco_pacote_5: 450, preco_pacote_10: 800 }

  it('retorna preço formatado', () => {
    expect(precoPadraoParaTipo('INDIVIDUAL', precos)).toBe('100')
    expect(precoPadraoParaTipo('PACOTE_5', precos)).toBe('450')
    expect(precoPadraoParaTipo('PACOTE_10', precos)).toBe('800')
  })

  it('retorna vazio para preço zero', () => {
    expect(precoPadraoParaTipo('INDIVIDUAL', { preco_sessao_individual: 0, preco_pacote_5: 0, preco_pacote_10: 0 })).toBe('')
  })

  it('retorna vazio quando precos é null', () => {
    expect(precoPadraoParaTipo('INDIVIDUAL', null)).toBe('')
  })
})
