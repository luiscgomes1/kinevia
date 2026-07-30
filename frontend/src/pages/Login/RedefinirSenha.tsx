import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Lock, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SenhaInput } from '@/components/SenhaInput'
import { useSenhaValida } from '@/lib/senha'
import api, { exibirErro } from '@/services/api'
import logoKinevia from '@/assets/logo-kinevia-2.png'

export default function RedefinirSenhaPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const senhaValida = useSenhaValida(novaSenha)
  const podeEnviar = senhaValida && novaSenha === confirmarSenha

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!senhaValida) {
      toast.error('A senha não atende aos requisitos.')
      return
    }

    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não conferem.')
      return
    }

    setCarregando(true)

    try {
      await api.post('/auth/redefinir-senha', { email, token, novaSenha })
      window.history.replaceState(null, '', '/redefinir-senha')
      setSucesso(true)
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao redefinir senha.'))
    } finally {
      setCarregando(false)
    }
  }

  if (!email || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Link inválido. Solicite uma nova redefinição.</p>
          <Link to="/login" className="text-sm text-primary hover:underline">Ir para o login</Link>
        </div>
      </div>
    )
  }

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-700 mx-auto" />
            <h2 className="text-lg font-semibold">Senha redefinida!</h2>
            <p className="text-sm text-muted-foreground">Sua senha foi alterada com sucesso.</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Ir para o login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-2">
              <img src={logoKinevia} alt="Kinevia" className="h-9 w-auto" />
              <h1 className="font-logo text-2xl font-bold text-foreground tracking-tight">Kinevia</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Redefinir senha</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-xs text-muted-foreground">
              Redefinindo senha para: <strong>{email}</strong>
            </p>

            <SenhaInput value={novaSenha} onChange={setNovaSenha} id="novaSenha" label="Nova senha" />

            <div className="space-y-1.5">
              <Label htmlFor="confirmarSenha">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmarSenha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                  placeholder="Repita a senha"
                  className="pl-9"
                />
              </div>
              {confirmarSenha && novaSenha !== confirmarSenha && (
                <p className="text-xs text-red-500 mt-1">As senhas não conferem.</p>
              )}
            </div>

            <Button type="submit" disabled={carregando || !podeEnviar} className="w-full gap-2">
              {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {carregando ? 'Redefinindo...' : 'Redefinir senha'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
