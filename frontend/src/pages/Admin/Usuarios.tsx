import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, KeyRound, Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge, badgeVariants } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import api, { exibirErro } from '@/services/api'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/api'

interface Usuario {
  id: string
  nome: string
  email: string
  role: Role
  crefito: string
  cidade: string
  uf: string
  senha_temporaria: boolean
  criado_em: string
}

const rotulosPapel: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Dono',
  PROFISSIONAL: 'Profissional',
  ATENDENTE: 'Atendente',
}

const coresPapel: Record<Role, 'destructive' | 'default' | 'success' | 'warning' | 'secondary'> = {
  SUPER_ADMIN: 'destructive',
  ADMIN: 'default',
  PROFISSIONAL: 'success',
  ATENDENTE: 'secondary',
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtroPapel, setFiltroPapel] = useState<string>('')
  const [criando, setCriando] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const params = filtroPapel ? { papel: filtroPapel } : {}
      const res = await api.get('/usuarios', { params })
      setUsuarios(res.data)
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao carregar usuários.'))
    } finally {
      setCarregando(false)
    }
  }, [filtroPapel])

  useEffect(() => {
    async function inicial() {
      await carregar()
    }
    void inicial()
  }, [carregar])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerenciar profissionais da clínica</p>
        </div>
        <Button onClick={() => setCriando(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo usuário
        </Button>
      </div>

      <div className="flex gap-2">
        <Select value={filtroPapel} onValueChange={(v) => setFiltroPapel(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos os papéis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos os papéis</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="PROFISSIONAL">Profissional</SelectItem>
            <SelectItem value="ATENDENTE">Atendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {carregando ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-muted/50 text-sm text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Papel</th>
                <th className="text-left px-4 py-3 font-medium">CREFITO</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {usuarios.map((u) => (
                <LinhaUsuario
                  key={u.id}
                  usuario={u}
                  onAtualizar={carregar}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {criando && (
        <DialogCriarUsuario
          onClose={() => setCriando(false)}
          onCriado={() => { setCriando(false); carregar() }}
        />
      )}
    </div>
  )
}

function LinhaUsuario({ usuario, onAtualizar }: { usuario: Usuario; onAtualizar: () => void }) {
  const [editando, setEditando] = useState(false)
  const [confirmandoRemover, setConfirmandoRemover] = useState(false)
  const [confirmandoResetSenha, setConfirmandoResetSenha] = useState(false)
  const [gerandoSenha, setGerandoSenha] = useState(false)
  const [credenciais, setCredenciais] = useState<{ email: string; senha: string } | null>(null)

  async function handleReenviarConvite() {
    setGerandoSenha(true)
    try {
      const res = await api.post(`/usuarios/${usuario.id}/reenviar-convite`)
      if (typeof res.data.senha_temporaria === 'string') {
        setCredenciais({ email: res.data.email, senha: res.data.senha_temporaria })
      }
      toast.success(res.data.email_enviado ? 'Email de convite enviado!' : 'Nova senha temporária gerada!')
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao gerar senha.'))
    } finally {
      setGerandoSenha(false)
    }
  }

  function handlePedirNovaSenha() {
    if (usuario.senha_temporaria) {
      handleReenviarConvite()
    } else {
      setConfirmandoResetSenha(true)
    }
  }

  async function handleRemover() {
    try {
      await api.delete(`/usuarios/${usuario.id}`)
      toast.success('Usuário removido.')
      onAtualizar()
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao remover usuário.'))
    }
    setConfirmandoRemover(false)
  }

  return (
    <>
      <tr className="hover:bg-muted/30 transition-colors">
        <td className="px-4 py-3 font-medium">{usuario.nome}</td>
        <td className="px-4 py-3 text-muted-foreground">{usuario.email}</td>
        <td className="px-4 py-3">
          <Badge variant={coresPapel[usuario.role]}>
            {rotulosPapel[usuario.role]}
          </Badge>
        </td>
        <td className="px-4 py-3 text-muted-foreground">{usuario.crefito || '-'}</td>
        <td className="px-4 py-3">
          {usuario.senha_temporaria ? (
            <button
              type="button"
              onClick={handleReenviarConvite}
              disabled={gerandoSenha}
              title="Ver / gerar senha temporária"
              className={cn(
                badgeVariants({ variant: 'warning' }),
                'cursor-pointer hover:opacity-80 transition-opacity'
              )}
            >
              {gerandoSenha ? 'Gerando...' : 'Senha temporária'}
            </button>
          ) : (
            <Badge variant="success">Ativo</Badge>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => setEditando(true)} title="Editar">
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePedirNovaSenha} disabled={gerandoSenha} title="Nova senha temporária">
              {gerandoSenha ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setConfirmandoRemover(true)} title="Remover">
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </td>
      </tr>

      {editando && (
        <DialogEditarUsuario
          usuario={usuario}
          onClose={() => setEditando(false)}
          onAtualizado={() => { setEditando(false); onAtualizar() }}
        />
      )}

      {confirmandoRemover && (
        <Dialog open onOpenChange={() => setConfirmandoRemover(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Remover usuário</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja remover <strong>{usuario.nome}</strong>? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setConfirmandoRemover(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleRemover}>
                Remover
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {confirmandoResetSenha && (
        <Dialog open onOpenChange={() => setConfirmandoResetSenha(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Redefinir senha</DialogTitle>
              <DialogDescription>
                <strong>{usuario.nome}</strong> já possui senha própria. Gerar uma nova senha
                temporária vai <strong>substituir a senha atual</strong> — o usuário precisará
                entrar com a nova senha. Deseja continuar?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setConfirmandoResetSenha(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => { setConfirmandoResetSenha(false); handleReenviarConvite() }}>
                Gerar nova senha
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {credenciais && (
        <Dialog open onOpenChange={() => setCredenciais(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Credenciais de acesso</DialogTitle>
              <DialogDescription>
                Compartilhe as credenciais abaixo com o usuário.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 bg-muted rounded-lg p-4 text-sm">
              <div>
                <span className="text-muted-foreground">Email:</span>{' '}
                <span className="font-medium">{credenciais.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Senha temporária:</span>{' '}
                <span className="font-mono font-medium text-primary">{credenciais.senha}</span>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <Button onClick={() => setCredenciais(null)}>Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

function DialogCriarUsuario({ onClose, onCriado }: { onClose: () => void; onCriado: () => void }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [papel, setPapel] = useState<Role>('PROFISSIONAL')
  const [crefito, setCrefito] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ email: string; senha: string } | null>(null)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    try {
      const res = await api.post('/usuarios', { nome, email, papel, crefito, cidade, uf })
      if (typeof res.data.senha_temporaria === 'string') {
        setResultado({ email: res.data.email, senha: res.data.senha_temporaria })
      }
      toast.success(res.data.email_enviado ? 'Usuário criado e convite enviado por email!' : 'Usuário criado com sucesso!')
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao criar usuário.'))
    } finally {
      setEnviando(false)
    }
  }

  if (resultado) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Usuário criado</DialogTitle>
            <DialogDescription>
              Compartilhe as credenciais abaixo com o usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 bg-muted rounded-lg p-4 text-sm">
            <div>
              <span className="text-muted-foreground">Email:</span>{' '}
              <span className="font-medium">{resultado.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Senha temporária:</span>{' '}
              <span className="font-mono font-medium text-primary">{resultado.senha}</span>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <Button onClick={onCriado}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>Preencha os dados para criar um novo usuário.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Nome completo" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@exemplo.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="papel">Papel</Label>
            <Select value={papel} onValueChange={(v) => setPapel(v as Role)}>
              <SelectTrigger id="papel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROFISSIONAL">Profissional</SelectItem>
                <SelectItem value="ATENDENTE">Atendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="crefito">CREFITO (opcional)</Label>
            <Input id="crefito" value={crefito} onChange={(e) => setCrefito(e.target.value)} placeholder="000000-F" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="cidade">Cidade (opcional)</Label>
              <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="São Paulo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uf">UF</Label>
              <Input id="uf" value={uf} onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))} maxLength={2} placeholder="SP" />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-1">
            <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={enviando} className="gap-2">
              {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
              {enviando ? 'Criando...' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DialogEditarUsuario({ usuario, onClose, onAtualizado }: { usuario: Usuario; onClose: () => void; onAtualizado: () => void }) {
  const [nome, setNome] = useState(usuario.nome)
  const [email, setEmail] = useState(usuario.email)
  const [papel, setPapel] = useState<Role>(usuario.role)
  const [crefito, setCrefito] = useState(usuario.crefito)
  const [cidade, setCidade] = useState(usuario.cidade)
  const [uf, setUf] = useState(usuario.uf)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    try {
      await api.put(`/usuarios/${usuario.id}`, { nome, email, papel, crefito, cidade, uf })
      toast.success('Usuário atualizado.')
      onAtualizado()
    } catch (err) {
      toast.error(exibirErro(err, 'Erro ao atualizar.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>Altere os dados do usuário.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="edit-nome">Nome</Label>
            <Input id="edit-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-papel">Papel</Label>
            <Select value={papel} onValueChange={(v) => setPapel(v as Role)}>
              <SelectTrigger id="edit-papel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROFISSIONAL">Profissional</SelectItem>
                <SelectItem value="ATENDENTE">Atendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-crefito">CREFITO</Label>
            <Input id="edit-crefito" value={crefito} onChange={(e) => setCrefito(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="edit-cidade">Cidade</Label>
              <Input id="edit-cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-uf">UF</Label>
              <Input id="edit-uf" value={uf} onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))} maxLength={2} />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-1">
            <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={enviando} className="gap-2">
              {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
              {enviando ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
