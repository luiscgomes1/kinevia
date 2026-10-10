import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { esqueciSenhaSchema, type EsqueciSenhaForm } from '@/lib/schemas/auth'
import api, { exibirErro } from '@/services/api'
import logoKinevia from '@/assets/logo-kinevia-2.png'
import type { FieldErrors } from 'react-hook-form'

function Erro({ errors }: { errors: FieldErrors<EsqueciSenhaForm> }) {
  return errors.email ? <p className="text-xs text-red-500 mt-1">{errors.email?.message}</p> : null
}

export default function EsqueciSenhaPage() {
  const [enviado, setEnviado] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EsqueciSenhaForm>({
    resolver: zodResolver(esqueciSenhaSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: EsqueciSenhaForm) {
    try {
      await api.post('/auth/esqueci-senha', data)
      setEnviado(true)
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao solicitar redefinição.'))
    }
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
          </div>

          {enviado ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-verde-claro/15 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6 text-green-700" />
              </div>
              <p className="text-sm text-muted-foreground">
                Se o email existir, você receberá um link para redefinir sua senha.
              </p>
              <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <p className="text-sm text-muted-foreground text-center">
                Digite seu email cadastrado e enviaremos um link para redefinir sua senha.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" {...register('email')} placeholder="seu@email.com" className="pl-9" />
                </div>
                <Erro errors={errors} />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSubmitting ? 'Enviando...' : 'Enviar link de redefinição'}
              </Button>

              <Link to="/login" className="block text-center text-sm text-primary hover:underline">
                Voltar para o login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
