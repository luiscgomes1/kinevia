import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginSchema, type LoginForm } from '@/lib/schemas/auth'
import api, { exibirErro, setAccessToken } from '@/services/api'
import logoKinevia from '@/assets/logo-kinevia-2.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', senha: '' },
  })

  async function onSubmit(data: LoginForm) {
    try {
      const response = await api.post('/auth/login', data)
      setAccessToken(response.data?.accessToken)
      navigate('/')
    } catch (err) {
      toast.error(exibirErro(err, 'E-mail ou senha incorretos.'))
    }
  }

  const Erro = ({ campo }: { campo: keyof LoginForm }) =>
    errors[campo] ? <p className="text-xs text-red-500 mt-1">{errors[campo]?.message}</p> : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-2">
              <img src={logoKinevia} alt="Kinevia" className="h-9 w-auto" />
              <h1 className="font-logo text-2xl font-bold text-foreground tracking-tight">Kinevia</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Sistema de gestão fisioterapêutica</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" {...register('email')} placeholder="seu@email.com" className="pl-9" autoComplete="email" />
              </div>
              <Erro campo="email" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  {...register('senha')}
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Erro campo="senha" />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>

            <Link to="/esqueci-senha" className="block text-center text-sm text-primary hover:underline">
              Esqueci minha senha
            </Link>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">Kinevia · Gestão fisioterapêutica</p>
      </div>
    </div>
  )
}
