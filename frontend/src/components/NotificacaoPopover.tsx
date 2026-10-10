import { Bell, CheckCheck, GripVertical, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useNotificacoes } from '@/hooks/useNotificacoes'

interface Props {
  abreParaDireita?: boolean
  abreParaCima?: boolean
  mostrarLabel?: boolean
}

export default function NotificacaoPopover({ abreParaDireita = false, abreParaCima = false, mostrarLabel = false }: Props) {
  const {
    naoLidas, notificacoes, aberto, abrir, fechar,
    marcarLida, marcarTodasLidas, iniciarPolling, pararPolling,
  } = useNotificacoes()
  const [carregando, setCarregando] = useState(false)
  const [deslocamento, setDeslocamento] = useState({ x: 0, y: 0 })
  const arrastando = useRef(false)
  const arrastarInicio = useRef({ px: 0, py: 0, dx: 0, dy: 0 })

  useEffect(() => {
    iniciarPolling()
    return () => pararPolling()
  }, [iniciarPolling, pararPolling])

  useEffect(() => {
    if (!aberto) return
    function mover(e: PointerEvent) {
      if (!arrastando.current) return
      setDeslocamento({
        x: arrastarInicio.current.dx + (e.clientX - arrastarInicio.current.px),
        y: arrastarInicio.current.dy + (e.clientY - arrastarInicio.current.py),
      })
    }
    function parar() {
      arrastando.current = false
    }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', parar)
    return () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', parar)
    }
  }, [aberto])

  async function handleAbrir() {
    setCarregando(true)
    await abrir()
    setCarregando(false)
  }

  function handleInicioArrastar(e: React.PointerEvent) {
    if (e.button !== 0) return
    arrastando.current = true
    arrastarInicio.current = { px: e.clientX, py: e.clientY, dx: deslocamento.x, dy: deslocamento.y }
  }

  return (
    <div className="relative">
      <button
        onClick={aberto ? fechar : handleAbrir}
        className={cn(
          'relative transition-colors',
          mostrarLabel
            ? 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground w-full'
            : 'p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
        title="Notificações"
      >
        <span className="relative shrink-0">
          <Bell className="w-4 h-4" />
          {naoLidas > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
        </span>
        {mostrarLabel && <span>Notificações</span>}
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-30" onClick={fechar} />
          <div
            className={cn(
              'absolute w-80 bg-card border border-border rounded-xl shadow-xl z-40 max-h-96 flex flex-col',
              abreParaDireita ? 'left-0' : 'right-0',
              abreParaCima ? 'bottom-full mb-2' : 'top-full mt-2',
            )}
            style={deslocamento.x || deslocamento.y
              ? { transform: `translate(${deslocamento.x}px, ${deslocamento.y}px)` }
              : undefined}
          >
            <div
              onPointerDown={handleInicioArrastar}
              title="Arraste para reposicionar"
              className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
                Notificações
              </span>
              {notificacoes.some((n) => !n.lida) && (
                <button
                  onClick={marcarTodasLidas}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {carregando ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : notificacoes.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                </div>
              ) : (
                notificacoes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => marcarLida(n.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-accent transition-colors',
                      !n.lida && 'bg-primary/[0.03]'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        'w-2 h-2 rounded-full mt-1.5 shrink-0',
                        n.lida ? 'bg-transparent' : 'bg-primary'
                      )} />
                      <div className="min-w-0">
                        <p className={cn('text-sm', n.lida ? 'text-muted-foreground' : 'text-foreground font-medium')}>
                          {n.titulo}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.mensagem}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
