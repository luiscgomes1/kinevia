import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  erro: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null }

  static getDerivedStateFromError(erro: Error) {
    return { erro }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', erro, info.componentStack)
  }

  handleReset = () => {
    this.setState({ erro: null })
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-lg font-semibold text-foreground">Algo deu errado</h1>
              <p className="text-sm text-muted-foreground">
                Ocorreu um erro inesperado. Tente recarregar a página.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-muted p-4 text-left text-xs text-muted-foreground">
                  {this.state.erro.message}
                </pre>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar página
              </Button>
              <Button onClick={this.handleReset}>
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
