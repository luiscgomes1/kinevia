# Política de Privacidade — Kinevia

Última atualização: 23 de julho de 2026

## 1. Quem somos

Kinevia é um software de gestão fisioterapêutica que auxilia profissionais
de fisioterapia no gerenciamento de pacientes, agendamentos, prontuários,
laudos e financeiro.

## 2. Dados coletados

### 2.1 Dados do profissional

- Nome completo, e-mail, CREFITO, cidade e UF
- Senha de acesso (armazenada como hash bcrypt — nunca em texto puro)
- Imagem de assinatura e logo (armazenadas em bucket privado)

### 2.2 Dados do paciente

- Nome completo, CPF, data de nascimento, endereço, estado civil,
  nacionalidade, telefone, e-mail
- Histórico médico (queixa principal, HDA, HPP, diagnósticos, exames,
  avaliações físicas, evoluções clínicas)
- Agendamentos e registro de comparecimento a sessões
- Informações financeiras (pacotes contratados, valores e status de
  pagamento)
- Laudos fisioterapêuticos (armazenados como PDF em bucket privado)

## 3. Base legal

O tratamento dos dados de saúde é realizado com base no **art. 11, II,
"a" da Lei 13.709/2018 (LGPD)** — tutela da saúde, procedimento executado
por profissional de saúde.

## 4. Finalidade do tratamento

Os dados são utilizados exclusivamente para:

- Prestação do serviço fisioterapêutico
- Gestão de agenda e sessões
- Elaboração de prontuários e laudos
- Controle financeiro de pacotes e pagamentos
- Envio de lembretes de consulta (quando SMTP configurado)
- Cumprimento de obrigações legais (retenção de prontuários)

## 5. Compartilhamento de dados

| Operador | Finalidade | Dados compartilhados |
|---|---|---|
| **Supabase** | Hospedagem do banco de dados e armazenamento de arquivos | Todos os dados armazenados |
| **Provedor de email** | Envio de emails transacionais (redefinição de senha, lembretes) | Nome e e-mail do profissional/paciente |

Nenhum dado é vendido, alugado ou compartilhado com terceiros para
finalidades de marketing ou publicidade.

## 6. Retenção e eliminação

- **Prontuários e laudos:** 20 anos (conforme exigência do CFM)
- **Dados cadastrais:** enquanto durar a relação contratual
- **Tokens de redefinição de senha:** 1 hora ou até o uso, o que ocorrer
  primeiro
- Após o prazo legal, os dados são anonimizados ou eliminados

## 7. Direitos do titular (LGPD)

O paciente titular dos dados pode, a qualquer momento:

| Direito | Como exercer |
|---|---|
| Confirmar a existência de tratamento | Solicitar ao profissional |
| Acessar os dados | Solicitar ao profissional |
| Corrigir dados incompletos ou incorretos | Solicitar ao profissional |
| Anonimizar ou eliminar dados desnecessários | Solicitar ao profissional |
| Portabilidade | Solicitar ao profissional |
| Saber com quem os dados foram compartilhados | Solicitar ao profissional |

O profissional de saúde é o **controlador** dos dados do paciente. O
Kinevia atua como **operador**. Para exercer seus direitos, o paciente
deve contatar diretamente o profissional que o atende.

## 8. Segurança

As medidas técnicas adotadas incluem:

- Criptografia em repouso no banco de dados (encryption at rest)
- Comunicação via HTTPS/TLS
- Autenticação com JWT de curta duração (15 min) + refresh token rotativo
- Senhas armazenadas com bcrypt (10 rounds)
- Cookies httpOnly + secure + sameSite=strict para refresh tokens
- Bucket de arquivos privado com URLs temporárias assinadas
- Rate limiting em endpoints sensíveis (login, registro, refresh)
- Isolamento de dados entre profissionais (cada profissional vê apenas
  seus próprios pacientes)

## 9. Encarregado (DPO)

O encarregado pelo tratamento de dados pessoais é o profissional de saúde
que utiliza o Kinevia. Para questões técnicas relacionadas ao software,
entre em contato pelo email cadastrado no sistema.

## 10. Alterações

Esta política pode ser atualizada periodicamente. A data da última
alteração está no topo do documento.
