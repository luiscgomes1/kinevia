import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/services/api'
import logoKinevia from '@/assets/logo-kinevia-2.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setCarregando(true)

    try {
      const response = await api.post('/auth/login', { email, senha })
      const { accessToken, refreshToken } = response.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)

      navigate('/')
    } catch (err) {
      const erro = err as { response?: { status?: number; data?: { erro?: string } } }
      // Rate limiting (429) tem mensagem própria vinda do backend — mostramos ela
      // Credenciais erradas (401) sempre mostram a mesma mensagem genérica, por segurança
      const mensagem = erro.response?.status === 429
        ? erro.response.data?.erro || 'Muitas tentativas. Aguarde um momento.'
        : 'E-mail ou senha incorretos.'
      toast.error(mensagem)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">

          {/* Cabeçalho */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-2">
              <img
                src={logoKinevia}
                alt="Kinevia"
                className="h-9 w-auto"
              />
              <h1 className="font-logo text-2xl font-bold text-foreground tracking-tight">
                Kinevia
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Sistema de gestão fisioterapêutica
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Campo e-mail */}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Campo senha */}
            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  autoComplete="current-password"
                />
                {/* Botão mostrar/ocultar senha */}
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>

            {/* Botão entrar */}
            <Button
              type="submit"
              disabled={carregando}
              className="w-full gap-2"
            >
              {carregando
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <LogIn className="w-4 h-4" />
              }
              {carregando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>

        {/* Rodapé discreto */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Kinevia · Gestão fisioterapêutica
        </p>
      </div>
    </div>
  )
}
