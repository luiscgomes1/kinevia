import { useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RouteError() {
  const error = useRouteError()

  let mensagem = 'Ocorreu um erro inesperado.'
  if (isRouteErrorResponse(error)) {
    mensagem = error.statusText || mensagem
  } else if (error instanceof Error) {
    mensagem = error.message
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-foreground">Algo deu errado</h1>
          <p className="text-sm text-muted-foreground">{mensagem}</p>
          {process.env.NODE_ENV === 'development' && error instanceof Error && (
            <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-muted p-4 text-left text-xs text-muted-foreground">
              {error.stack}
            </pre>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Recarregar
          </Button>
        </div>
      </div>
    </div>
  )
}
