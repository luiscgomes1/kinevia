# Contrato de Processamento de Dados (DPA)

> Entre **Kinevia** (operador) e o **Profissional de Saúde** (controlador)
> Baseado na Lei 13.709/2018 (LGPD)

---

## 1. Partes

**Operador:** Kinevia — software de gestão fisioterapêutica, disponível como
serviço online (SaaS). Responsável pelo tratamento técnico dos dados.

**Controlador:** O profissional de saúde ou clínica que utiliza o Kinevia
para gerenciar seus pacientes. Responsável pela coleta, finalidade e
consentimento junto aos titulares (pacientes).

---

## 2. Objeto

O Operador fornece ao Controlador uma plataforma de gestão fisioterapêutica
para armazenamento, consulta e geração de prontuários, laudos, agendamentos
e controle financeiro.

O Controlador utiliza a plataforma para prestar serviços de saúde aos seus
pacientes e, para isso, insere dados pessoais e dados sensíveis de saúde
dos titulares no sistema.

---

## 3. Papéis e Responsabilidades

| Atividade | Controlador | Operador |
|---|---|---|
| Coletar consentimento do titular | ✅ | ❌ |
| Definir finalidade do tratamento | ✅ | ❌ |
| Decidir quais dados coletar | ✅ | ❌ |
| Processar os dados conforme instrução | ❌ | ✅ |
| Manter registros de acesso | ✅ (via sistema) | ✅ |
| Notificar violação de dados | ✅ (à ANPD) | ✅ (ao controlador) |
| Atender direitos dos titulares | ✅ | ❌ (fornece a ferramenta) |

---

## 4. Dados Tratados

### 4.1 Categorias de dados

| Categoria | Dados |
|---|---|
| Identificação | Nome, CPF, data de nascimento, estado civil, nacionalidade |
| Contato | Endereço, telefone, email |
| Saúde | Histórico médico, diagnósticos, avaliações físicas, evoluções clínicas, laudos |
| Financeiro | Pacotes contratados, valores, status de pagamento |
| Profissional | Nome, email, CREFITO, assinatura, logo |

### 4.2 Origem dos dados

Os dados são inseridos diretamente no sistema pelo Controlador ou por
usuários autorizados (profissionais, atendentes). O Operador não coleta
dados de fontes externas.

---

## 5. Finalidade do Tratamento

O Operador trata os dados exclusivamente para:

- Armazenamento e disponibilização dos dados inseridos pelo Controlador
- Geração de prontuários, laudos e declarações
- Controle de agenda e sessões
- Controle financeiro de pacotes
- Envio de lembretes e comunicações transacionais (quando configurado)
- Cumprimento de obrigação legal de retenção de prontuários (20 anos — CFM)

---

## 6. Suboperadores

O Operador contrata os seguintes suboperadores para execução do serviço:

| Suboperador | Serviço | Dados acessados |
|---|---|---|
| **Supabase Inc.** | Hospedagem do banco de dados PostgreSQL e armazenamento de arquivos (storage) | Todos os dados armazenados |
| **Provedor de email** (SendGrid, Gmail ou outro configurado) | Envio de emails transacionais | Nome e email dos destinatários |

O Operador se responsabiliza por garantir que os suboperadores cumprem a
LGPD e mantêm níveis adequados de segurança.

---

## 7. Segurança

O Operador declara adotar as seguintes medidas técnicas:

- Criptografia em repouso (encryption at rest) no banco de dados
- Comunicação via HTTPS/TLS
- Autenticação com JWT de curta duração (15 min) + refresh token rotativo
- Senhas armazenadas com bcrypt (10 rounds)
- Cookies httpOnly + secure + sameSite=strict
- Bucket de arquivos privado com URLs temporárias assinadas
- Rate limiting em endpoints sensíveis
- Isolamento de dados entre clínicas/profissionais
- Registro de auditoria (audit log) de acessos a dados sensíveis
- Política de senha forte (mínimo 8 caracteres, maiúscula, minúscula, número, especial)

---

## 8. Retenção e Exclusão

| Tipo de dado | Prazo de retenção |
|---|---|
| Prontuários e laudos | 20 anos (exigência CFM) |
| Dados cadastrais de pacientes | Enquanto durar a relação contratual com o Controlador |
| Dados do Controlador | Enquanto a conta estiver ativa |
| Tokens de redefinição de senha | 1 hora ou até o uso |
| Registros de auditoria | 5 anos |

Após o fim da relação contratual, o Controlador pode solicitar a exportação
de todos os seus dados (art. 18, V — portabilidade). Findo o prazo legal de
retenção, os dados serão anonimizados ou eliminados.

---

## 9. Violação de Dados

Em caso de incidente de segurança que envolva dados pessoais tratados no
âmbito deste contrato, o Operador se compromete a:

1. Notificar o Controlador em até **48 horas** da ciência do incidente
2. Descrever a natureza dos dados envolvidos
3. Descrever as medidas tomadas ou propostas
4. Manter o Controlador informado sobre a investigação

O Controlador é responsável por notificar a ANPD e os titulares afetados
(art. 48 da LGPD).

---

## 10. Direitos dos Titulares

O Operador fornece ao Controlador as seguintes ferramentas para atender
aos direitos dos titulares:

| Direito | Ferramenta |
|---|---|
| Acesso/portabilidade | `GET /v1/pacientes/:id/exportar` |
| Correção | `PATCH /v1/pacientes/:id/identidade` + `PUT /v1/pacientes/:id` |
| Anonimização | `POST /v1/pacientes/:id/anonimizar` |
| Informação sobre compartilhamento | `GET /v1/privacidade` |

---

## 11. Vigência e Rescisão

Este DPA entra em vigor no momento em que o Controlador cria uma conta no
Kinevia e permanece vigente enquanto durar a relação contratual.

O Controlador pode rescindir este DPA a qualquer momento, desde que:

1. Exporte todos os dados que deseja preservar
2. Solicite a anonimização ou exclusão dos dados restantes (respeitados os
   prazos legais de retenção)

---

## 12. Disposições Gerais

- Este documento é regido pela Lei 13.709/2018 (LGPD)
- Qualquer alteração será comunicada com 30 dias de antecedência
- Em caso de dúvidas, o Controlador deve entrar em contato pelo email
  cadastrado no sistema

---

*Este documento é fornecido como modelo. Recomenda-se a revisão por um
advogado especializado em proteção de dados antes da utilização.*
