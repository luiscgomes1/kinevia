import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

describe('ErrorBoundary', () => {
  it('renderiza children quando não há erro', () => {
    render(
      <ErrorBoundary>
        <div>Conteúdo normal</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Conteúdo normal')).toBeInTheDocument()
  })

  it('captura erro e mostra fallback', () => {
    const ComponenteProblematico = () => {
      throw new Error('Erro de teste')
    }

    render(
      <ErrorBoundary>
        <ComponenteProblematico />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
  })

  it('não mostra detalhes do erro em produção', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const ComponenteProblematico = () => {
      throw new Error('Erro de produção')
    }

    render(
      <ErrorBoundary>
        <ComponenteProblematico />
      </ErrorBoundary>,
    )
    expect(screen.queryByText('Erro de produção')).not.toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })
})
