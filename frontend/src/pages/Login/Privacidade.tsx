import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'
import logoKinevia from '@/assets/logo-kinevia-2.png'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao login
        </Link>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-8 space-y-6">
          <div className="flex items-center gap-3">
            <img src={logoKinevia} alt="Kinevia" className="h-8 w-auto" />
            <h1 className="font-logo text-xl font-bold text-foreground tracking-tight">Kinevia</h1>
          </div>

          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Política de Privacidade</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Última atualização: 23 de julho de 2026
              </p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
            <p>
              O Kinevia é um software de gestão fisioterapêutica. Os dados inseridos no sistema
              são de responsabilidade do profissional de saúde que o utiliza.
            </p>

            <h3 className="text-foreground font-semibold">Base Legal</h3>
            <p>
              O tratamento dos dados de saúde é realizado com base no art. 11, II, "a" da LGPD —
              tutela da saúde, procedimento executado por profissional de saúde.
            </p>

            <h3 className="text-foreground font-semibold">Dados Coletados</h3>
            <ul>
              <li>Dados cadastrais do paciente (nome, CPF, endereço, telefone, email)</li>
              <li>Dados de saúde (prontuário, evoluções, laudos, diagnósticos)</li>
              <li>Dados financeiros (pacotes, valores, status de pagamento)</li>
              <li>Dados do profissional (nome, email, CREFITO, assinatura)</li>
            </ul>

            <h3 className="text-foreground font-semibold">Compartilhamento</h3>
            <p>
              Os dados são armazenados na Supabase (banco de dados PostgreSQL e storage)
              e podem ser transmitidos via email para redefinição de senha e lembretes.
              Nenhum dado é vendido ou compartilhado para marketing.
            </p>

            <h3 className="text-foreground font-semibold">Retenção</h3>
            <p>
              Prontuários e laudos são mantidos por 20 anos conforme exigência do CFM.
              Após esse período, os dados são anonimizados ou eliminados.
            </p>

            <h3 className="text-foreground font-semibold">Direitos do Titular</h3>
            <p>
              O paciente pode solicitar ao profissional: acesso aos dados, correção,
              portabilidade, anonimização e informação sobre compartilhamento.
            </p>

            <h3 className="text-foreground font-semibold">Segurança</h3>
            <p>
              O sistema utiliza criptografia em repouso, HTTPS, autenticação JWT,
              cookies seguros, bucket privado com URLs assinadas e isolamento de dados
              entre profissionais.
            </p>

            <p className="text-xs text-muted-foreground pt-4 border-t border-border">
              Para exercer seus direitos, contate o profissional de saúde responsável pelo seu atendimento.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
