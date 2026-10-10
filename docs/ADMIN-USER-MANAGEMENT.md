# Administração de Usuários — Implementação

> **Status:** ✅ Implementado (Julho/2026)
> Este documento descreve o modelo de gestão de usuários do Kinevia: hierarquia de papéis,
> seed de SUPER_ADMIN, senha temporária com troca obrigatória, CRUD de usuários pelo ADMIN,
> painel administrativo e auditoria de operações críticas.

---

## 1. Hierarquia de Papéis (Roles)

```
SUPER_ADMIN (3)
  └── ADMIN (2) — dono da clínica / gestor responsável
        ├── PROFISSIONAL (1) — fisioterapeuta
        └── ATENDENTE (0) — recepcionista / auxiliar administrativo
```

Valor numérico = nível na hierarquia (`roleHierarchy()` em `usuario.controller.ts`).
Regras de autorização usam esse nível: um usuário **nunca pode atribuir** um papel de nível
superior ao seu.

### 1.1 SUPER_ADMIN

- **Quem é:** O mantenedor do sistema
- **Criado por:** Setup inicial (seed) — SEM endpoint público
- **Pode:**
  - Criar/editar/excluir clínicas (`/v1/admin/clinicas`)
  - Ver todas as clínicas e métricas globais (`/v1/admin/resumo`)
  - CRUD de usuários de qualquer clínica (inclusive ADMIN)
  - Acessar auditoria de todas as clínicas

### 1.2 ADMIN

- **Quem é:** O dono ou gestor responsável por uma clínica
- **Criado por:** SUPER_ADMIN
- **Pode:**
  - Criar/editar/remover **profissionais** e **atendentes** da própria clínica
  - Acessar todos os dados da clínica (pacientes, agenda, financeiro, prontuário)
  - Ver dashboard da clínica (`/v1/admin/dashboard-clinica`)
  - Ver audit log da própria clínica
  - **Não pode:** criar outro ADMIN, acessar outras clínicas, alterar próprio papel

### 1.3 PROFISSIONAL

- **Quem é:** O fisioterapeuta que presta atendimento
- **Pode:** fluxo clínico completo — pacientes, agenda, prontuário, evoluções, laudos, financeiro
- **Não pode:** criar usuários, alterar configurações da clínica, acessar painel admin

### 1.4 ATENDENTE

- **Quem é:** Recepcionista / auxiliar que gerencia a ponta administrativa
- **Pode:** cadastrar pacientes, gerenciar agenda, registrar pagamentos
- **Não pode:** acessar `/configuracoes` (bloqueado por `RotaConfiguracoes` no frontend),
  painel admin, emitir laudos clínicos

---

## 2. Setup Inicial (Seed)

```bash
cd backend
npm run seed   # só funciona em desenvolvimento
```

O seed aborta se `NODE_ENV === 'production'`. Ele faz `upsert` de:

| Dado | Valor |
|------|-------|
| Clínica | `id: clinica-padrao`, `nome: "Clínica Padrão"` |
| Usuário | `admin@fisiogest.com`, role `SUPER_ADMIN`, vinculado à clínica padrão |
| Senha | `123456` (hash bcrypt) |

> Credenciais de acesso: **admin@fisiogest.com / 123456**.
> O seed NUNCA é exposto como endpoint REST.

---

## 3. Criação de Usuário por ADMIN

### Endpoint: `POST /v1/usuarios` (ADMIN/SUPER_ADMIN)

```json
{
  "nome": "Dr. João Silva",
  "email": "joao@clinica.com",
  "crefito": "123456-F",
  "cidade": "São Paulo",
  "uf": "SP",
  "papel": "PROFISSIONAL"
}
```

### Regras aplicadas:

- ADMIN **não pode** criar com papel `SUPER_ADMIN` nem `ADMIN` (403)
- ADMIN só cria usuários vinculados à própria clínica (`req.clinicaId`)
- Email duplicado → 409
- Senha temporária gerada: `crypto.randomUUID().slice(0, 12) + 'Ab1!'` (14+ chars,
  minúscula + maiúscula + número + especial) — sempre com `senha_temporaria: true`

### Resposta — fluxo de senha:

- **Com SMTP configurado** (`isEmailConfigured()`): envia email de convite
  (`montarHtmlConvite`) e retorna `email_enviado: true` (senha NÃO aparece na resposta)
- **Sem SMTP**: retorna a senha temporária na resposta, para o admin copiar e entregar

### Reenvio de convite: `POST /v1/usuarios/:id/reenviar-convite`

- Gera nova senha temporária, incrementa `token_version` (invalida sessões ativas)
- Envia email se SMTP configurado; senão retorna a senha na resposta
- `token_version++` força o usuário a refazer login

---

## 4. Primeiro Login — Troca Obrigatória de Senha

### Backend: middleware de verificação (`auth.middleware.ts`)

- **Login** (`POST /v1/auth/login`) → resposta inclui `senha_temporaria` no payload do token
- **Qualquer request** com `senha_temporaria == true` → 403 com `{ erro, precisaTrocarSenha: true }`
- A **única** rota permitida nesse estado é `POST /v1/auth/trocar-senha`

### Troca: `POST /v1/auth/trocar-senha`

1. Verifica a senha atual (bcrypt)
2. Requer senha temporária ativa (se `senha_temporaria == false` → 400)
3. Atualiza `senha_hash`, seta `senha_temporaria = false`
4. Incrementa `token_version` (invalida sessões existentes)

### Frontend: fluxo forçado

- Login → resposta indica senha temporária → redireciona para `/trocar-senha`
- Página sem sidebar/header, com `SenhaInput` e requisitos de senha em tempo real
- Guard: `RotaProtegida` + verificação de `senha_temporaria` redireciona para `/trocar-senha`

### Regras de segurança:

- Nova senha não pode ser igual à temporária
- Após trocar, todas as sessões existentes são invalidadas (`token_version++`)

---

## 5. Painel de Administração (Frontend)

### 5.1 SUPER_ADMIN: `/admin` (AdminDashboard)

- **Métricas globais** (`GET /v1/admin/resumo`): total de clínicas, usuários, pacientes,
  usuários por papel
- **CRUD de clínicas** (`GET/POST/PUT/DELETE /v1/admin/clinicas`): listar, criar, editar,
  excluir
- **Detalhe da clínica** (`/admin/clinicas/:id`): usuários vinculados, papel, senha pendente
- **Dashboard da clínica** (`GET /v1/admin/dashboard-clinica`): pacientes, profissionais,
  agendamentos do mês

### 5.2 ADMIN: `/admin/usuarios`

- **Listagem** (`GET /v1/usuarios`): nome, email, papel, crefito, cidade/UF, senha pendente —
  escopo = própria clínica (ADMIN) ou todas (SUPER_ADMIN); filtro opcional por `?papel=`
- **Criar** (`POST`): modal com nome, email, papel, crefito, cidade, UF
- **Editar** (`PUT /v1/usuarios/:id`): nome, email, crefito, cidade, UF, papel
- **Reenviar convite** (`POST /v1/usuarios/:id/reenviar-convite`)
- **Remover** (`DELETE /v1/usuarios/:id`): proibido remover a si mesmo; ADMIN não remove ADMIN

### 5.3 Auditoria: `/admin/auditoria` (ADMIN/SUPER_ADMIN)

- **Listagem** (`GET /v1/admin/auditoria`): logs com filtros (ação, paciente, período,
  profissional), paginação `limit`/`offset` (máx. 200), nome do profissional resolvido
- **Exportar CSV** (`GET /v1/admin/auditoria/exportar`): UTF-8 com BOM, delimitador `;`
- ADMIN vê apenas logs da própria clínica; SUPER_ADMIN vê tudo

**Ações registradas** (`AuditLog.acao`):

| Ação | Significado |
|------|-------------|
| `PRONTUARIO_VISUALIZADO` | Visualizou prontuário |
| `EVOLUCAO_VISUALIZADA` | Visualizou evolução |
| `LAUDO_VISUALIZADO` | Visualizou laudo |
| `LAUDO_PDF_GERADO` | Gerou PDF do laudo |
| `PACIENTE_EXPORTADO` | Exportou paciente (LGPD) |
| `PACIENTE_ANONIMIZADO` | Anonimizou paciente (LGPD) |
| `PACIENTE_TRANSFERIDO` | Transferiu paciente |
| `PACIENTE_REMOVIDO` | Removeu paciente |

---

## 6. Modelo de Dados (Prisma — real)

```prisma
enum Role {
  SUPER_ADMIN
  ADMIN
  PROFISSIONAL
  ATENDENTE
}

model Clinica {
  id            String   @id @default(uuid())
  nome          String
  criado_em     DateTime @default(now())
  profissionais Profissional[]
}

model Profissional {
  id               String   @id @default(uuid())
  nome             String
  email            String   @unique
  senha_hash       String
  role             Role     @default(PROFISSIONAL)
  clinica_id       String?
  clinica          Clinica? @relation(fields: [clinica_id], references: [id])
  senha_temporaria Boolean  @default(false)
  crefito          String
  cidade           String
  uf               String   @db.Char(2)
  token_version    Int      @default(0)
  // ... horários, preços, assinatura/logo path, relacionamentos

  @@index([email])
  @@index([clinica_id])
}

model AuditLog {
  id              String   @id @default(uuid())
  profissional_id String
  paciente_id     String?
  acao            String
  metadata        Json?
  criado_em       DateTime @default(now())

  @@index([profissional_id, criado_em])
  @@index([paciente_id, criado_em])
}

model Notificacao {
  id              String   @id @default(uuid())
  profissional_id String   // onDelete: Cascade
  tipo            String
  titulo          String
  mensagem        String
  lida            Boolean  @default(false)
  criado_em       DateTime @default(now())
}
```

### Notas sobre o modelo:

- **`Profissional`** (não `Usuario`): o modelo existente recebeu as colunas `role`,
  `clinica_id` e `senha_temporaria` via migração `add_role_clinica_e_temp_password`
- **`clinica_id`**: null apenas para SUPER_ADMIN; todo dado clínico pertence a uma clínica
- **`token_version`**: incrementar ao trocar senha / reenviar convite invalida tokens antigos
- **`senha_temporaria`**: flag que força a troca no primeiro login
- **`AuditLog`**: auditoria para conformidade LGPD (visualização de prontuário/laudo,
  exportação, anonimização, transferência, remoção)

### Migrations relacionadas (2026-07-30):

| Migration | Conteúdo |
|-----------|----------|
| `add_audit_log` | Tabela `AuditLog` |
| `add_role_clinica_e_temp_password` | Enum `Role`, tabela `Clinica`, colunas `role`/`clinica_id`/`senha_temporaria` em `Profissional` |
| `add_notificacao` / `add_notificacao_cascade` | Tabela `Notificacao` com cascade |

---

## 7. Endpoints da API

> Prefixo real: `/v1` (ex.: `POST /v1/auth/trocar-senha`).

### 7.1 Autenticação

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| POST | `/v1/auth/login` | Login com email + senha | Público |
| POST | `/v1/auth/refresh` | Renovar access token | Público (cookie) |
| POST | `/v1/auth/logout` | Logout | Autenticado |
| POST | `/v1/auth/trocar-senha` | Trocar senha temporária | Autenticado (única rota permitida com senha temp) |
| POST | `/v1/auth/esqueci-senha` | Solicitar redefinição por email | Público |
| POST | `/v1/auth/redefinir-senha` | Redefinir com token | Público |

### 7.2 Usuários (ADMIN/SUPER_ADMIN — `usuario.routes.ts`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/v1/usuarios` | Listar usuários (escopo por clínica; filtro `?papel=`) |
| GET | `/v1/usuarios/:id` | Buscar usuário |
| POST | `/v1/usuarios` | Criar usuário com senha temporária |
| PUT | `/v1/usuarios/:id` | Editar usuário (nome, email, papel etc.) |
| DELETE | `/v1/usuarios/:id` | Remover usuário |
| POST | `/v1/usuarios/:id/reenviar-convite` | Nova senha temporária + invalida sessões |

### 7.3 Admin (SUPER_ADMIN — `admin.routes.ts`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/v1/admin/auditoria` | Logs de auditoria (ADMIN/SUPER_ADMIN) |
| GET | `/v1/admin/auditoria/exportar` | Exportar CSV (ADMIN/SUPER_ADMIN) |
| GET | `/v1/admin/dashboard-clinica` | Métricas da clínica (ADMIN/SUPER_ADMIN) |
| GET | `/v1/admin/resumo` | Métricas globais (SUPER_ADMIN) |
| GET | `/v1/admin/clinicas` | Listar clínicas (SUPER_ADMIN) |
| GET | `/v1/admin/clinicas/:id` | Buscar clínica (SUPER_ADMIN) |
| POST | `/v1/admin/clinicas` | Criar clínica (SUPER_ADMIN) |
| PUT | `/v1/admin/clinicas/:id` | Editar clínica (SUPER_ADMIN) |
| DELETE | `/v1/admin/clinicas/:id` | Excluir clínica (SUPER_ADMIN) |

### 7.4 Autosserviço (`profissional.routes.ts`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/v1/profissional/me` | Dados do próprio usuário |
| PUT | `/v1/profissional/me` | Alterar nome/dados |
| PUT | `/v1/profissional/me/senha` | Trocar senha |
| PUT | `/v1/profissional/me/email` | Alterar email |
| POST | `/v1/profissional/me/verificar-senha` | Verificar senha atual |
| GET | `/v1/profissional/me/exportar-dados` | Exportar dados (LGPD) |
| GET | `/v1/notificacoes` + ações | Listar/marcar notificações |

---

## 8. Autorização (Middleware)

`authenticate` (auth.middleware.ts):
1. Valida Bearer token JWT
2. Carrega profissional (token_version, role, clinica_id, senha_temporaria)
3. `token_version` divergente → 401 (token revogado)
4. `senha_temporaria == true` e rota ≠ `/v1/auth/trocar-senha` → 403 com `precisaTrocarSenha: true`
5. Injeta `req.profissionalId`, `req.role`, `req.clinicaId`

`authorize(...roles)`:
- Retorna 403 se `req.role` não estiver na lista

**Regras de hierarquia no `usuario.controller.ts`:**
- `roleHierarchy()`: SUPER_ADMIN=3, ADMIN=2, PROFISSIONAL=1, ATENDENTE=0
- ADMIN não cria/atribui papel com nível > seu (403)
- ADMIN não remove ADMIN; ninguém remove a si mesmo

---

## 9. Interface do Usuário (Frontend — real)

### Rotas

| Rota | Papel | Descrição |
|------|-------|-----------|
| `/login`, `/esqueci-senha`, `/redefinir-senha` | Público | Autenticação e recuperação |
| `/trocar-senha` | Todos (senha temp) | Troca obrigatória, sem sidebar/header |
| `/dashboard` | Todos | Dashboard padrão (resumo do dia) |
| `/admin` | ADMIN/SUPER_ADMIN | Painel admin (clínicas + métricas globais) |
| `/admin/usuarios` | ADMIN/SUPER_ADMIN | CRUD de usuários |
| `/admin/auditoria` | ADMIN/SUPER_ADMIN | Auditoria + exportação CSV |
| `/admin/clinicas/:id` | SUPER_ADMIN | Detalhes da clínica (usuários) |
| `/configuracoes` | ≠ ATENDENTE | Bloqueado por `RotaConfiguracoes` para ATENDENTE |

### Componentes/guards

- **`RotaProtegida`**: exige sessão válida; redireciona para `/trocar-senha` se senha pendente
- **`RotaAdmin`**: bloqueia todas as rotas `/admin*` para quem não é ADMIN/SUPER_ADMIN; redireciona para `/dashboard`
- **`RotaConfiguracoes`**: bloqueia `/configuracoes` para ATENDENTE
- **`NotificacaoPopover`**: sino com notificações não lidas no Layout
- **Menu lateral** condiciona itens pela role do usuário logado

---

## 10. Regras de Segurança

- **Nunca** expor `POST /auth/register` — criação é sempre via admin autenticado
- **Nunca** retornar senha nos logs; senha temporária só na resposta (sem SMTP) ou email
- **Token versioning**: troca de senha / reenvio de convite incrementa `token_version`
- **Rate limit** em login + trocar-senha
- **Audit log**: acesso a prontuário/laudo e exportação/anonimização/remoção de paciente
- **Separação de clínicas**: ADMIN e abaixo só enxergam dados da própria clínica

---

## 11. Futuro (não implementado)

- Convite expira após X dias (conta desativada se não trocar senha)
- Alteração de email com confirmação por link
- Configuração de SMTP pela interface (hoje via env)
- Bloqueio por plano/limite de usuários
- `criado_por_id` para rastrear quem criou cada usuário (hoje via AuditLog)
