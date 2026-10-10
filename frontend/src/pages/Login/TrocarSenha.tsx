import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SenhaInput } from '@/components/SenhaInput'
import { useSenhaValida } from '@/lib/senha'
import api, { exibirErro, clearAccessToken, setAccessToken } from '@/services/api'
import { clearProfissionalCache } from '@/hooks/useProfissional'
import logoKinevia from '@/assets/logo-kinevia-2.png'

export default function TrocarSenhaPage() {
  const navigate = useNavigate()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [role, setRole] = useState<'ATENDENTE' | 'OUTRO'>('OUTRO')
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
      const response = await api.post('/auth/trocar-senha', { novaSenha })
      setAccessToken(response.data?.accessToken)
      clearProfissionalCache()
      try {
        const me = await api.get('/profissional/me')
        setRole(me.data?.role === 'ATENDENTE' ? 'ATENDENTE' : 'OUTRO')
      } catch {
        setRole('OUTRO')
      }
      setSucesso(true)
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao trocar senha.'))
    } finally {
      setCarregando(false)
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-700 mx-auto" />
            <h2 className="text-lg font-semibold">Senha alterada!</h2>
            <p className="text-sm text-muted-foreground">Sua senha foi alterada com sucesso.</p>
            <Button
              onClick={() => navigate(role === 'ATENDENTE' ? '/' : '/configuracoes?setup=true')}
              className="w-full"
            >
              {role === 'ATENDENTE' ? 'Continuar' : 'Completar cadastro'}
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
            <p className="text-sm text-muted-foreground mt-1">Trocar senha temporária</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-xs text-muted-foreground">
              Você está usando uma senha temporária. Crie uma nova senha para continuar.
            </p>

            <SenhaInput value={novaSenha} onChange={setNovaSenha} id="novaSenha" label="Nova senha" />

            <div className="space-y-1.5">
              <label htmlFor="confirmarSenha" className="text-sm font-medium">Confirmar senha</label>
              <div className="relative">
                <input
                  id="confirmarSenha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                  placeholder="Repita a senha"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pr-9"
                />
              </div>
              {confirmarSenha && novaSenha !== confirmarSenha && (
                <p className="text-xs text-red-500 mt-1">As senhas não conferem.</p>
              )}
            </div>

            <Button type="submit" disabled={carregando || !podeEnviar} className="w-full gap-2">
              {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {carregando ? 'Alterando...' : 'Alterar senha'}
            </Button>

            <button
              type="button"
              onClick={() => { clearAccessToken(); navigate('/login') }}
              className="block text-center text-sm text-primary hover:underline w-full"
            >
              <ArrowLeft className="w-3 h-3 inline mr-1" />Voltar para o login
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
