import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '../button'

describe('Button', () => {
  it('renderiza com texto', () => {
    render(<Button>Clique aqui</Button>)
    expect(screen.getByRole('button', { name: /clique aqui/i })).toBeInTheDocument()
  })

  it('aplica classe variant default', () => {
    render(<Button>Default</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toMatch(/bg-primary/)
  })

  it('aplica variant destructive', () => {
    render(<Button variant="destructive">Excluir</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toMatch(/bg-destructive/)
  })

  it('aplica variant outline', () => {
    render(<Button variant="outline">Cancelar</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toMatch(/border-input/)
  })

  it('aplica size sm', () => {
    render(<Button size="sm">Pequeno</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toMatch(/h-9/)
  })

  it('renderiza como disabled', () => {
    render(<Button disabled>Desabilitado</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renderiza como asChild', () => {
    render(
      <Button asChild>
        <a href="/teste">Link</a>
      </Button>,
    )
    expect(screen.getByRole('link')).toBeInTheDocument()
  })
})
