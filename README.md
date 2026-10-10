# Kinevia

Sistema de gestão para fisioterapeutas que atendem a domicílio. Gerencia agenda, pacientes, prontuários, pacotes de sessões, financeiro, laudos em PDF, relatórios e administração de usuários (multi-papel).

> Projeto em desenvolvimento ativo. Código revisado — todas as funcionalidades principais implementadas e testadas (155 testes backend + 89 frontend).

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, React Router, react-hook-form + Zod |
| **Backend** | Node.js, Express, TypeScript (strict), Prisma ORM, Zod, Pino |
| **Banco** | PostgreSQL 16 |
| **Storage** | Supabase Storage (bucket privado — assinaturas, logos, laudos) |
| **Auth** | JWT (access token 15min + refresh token httpOnly 7d + token versioning), roles (SUPER_ADMIN/ADMIN/PROFISSIONAL/ATENDENTE), senha temporária |
| **Email** | Nodemailer via SMTP (modo dev: token logado) |
| **PDF** | PDFKit |
| **Testes** | Vitest + Supertest (backend) / Vitest + Testing Library (frontend) |

---

## Funcionalidades

- **Dashboard** — Posto de comando por perfil: cards "hoje vs ontem", financeiro (admin), próximos agendamentos (hoje + 3 dias), pagamentos aguardando (admin), avaliação inicial pendente, gráficos (sessões 30 dias, faturamento 6 meses) e filtro por profissional
- **Agenda** — Grade de horários com slots (3 por horário), visões diária/semanal/mensal, agendamento rápido com criação de pacote
- **Pacientes** — Cadastro completo, busca com debounce + AbortController, ativar/inativar (soft delete), correção de identidade
- **Prontuário** — Avaliação inicial com anamnese + escala EVA (0–10), evoluções clínicas com correções, proteção contra perda de dados (useBlocker + beforeunload)
- **Pacotes** — Controle de sessões (individual, 5 ou 10 sessões), criação com sessões iniciais, agendamento vinculado, status de pagamento
- **Financeiro** — Resumo mensal, breakdown por tipo de pacote, lista por paciente, total acumulado
- **Laudos** — Emissão de laudos em PDF com logo + assinatura (digital ou manuscrita), edição com campos protegidos, armazenamento em bucket privado
- **Relatórios** — Sessões por mês, taxa de faltas, evolução EVA (gráficos Recharts)
- **Notificações** — **Notificações in-app** (sino): paciente transferido (para quem recebeu), novo paciente cadastrado e novo membro na equipe (para os admins da clínica) e sessão cancelada (para o profissional dono); e **e-mail automático** ao paciente: confirmação de agendamento, lembrete 24h antes (cron a cada 30min) e cancelamento
- **Autenticação** — Login, refresh token (httpOnly cookie), token versioning, redefinição de senha com token criptográfico (bcrypt), proteção contra enumeração de email, rate limiting por endpoint
- **Roles & Hierarquia** — SUPER_ADMIN (multi-clínica), ADMIN (dono da clínica), PROFISSIONAL, ATENDENTE (recepcionista) — criação de usuários via painel, senha temporária com troca obrigatória no 1º login
- **Administração** — CRUD de usuários, gestão de clínicas (SUPER_ADMIN), painel administrativo por papel, auditoria (LGPD) com exportação CSV

---

## Pré-requisitos

- **Node.js** 20+ (testado com 22.x)
- **PostgreSQL** 16 (local via Docker ou [Supabase](https://supabase.com) gratuito)
- **Conta no Supabase** — para Storage (bucket privado para uploads)

---

## Instalação e configuração

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/kinevia.git
cd kinevia
```

### 2. Configurar o banco de dados

Crie um banco PostgreSQL e um usuário:

```sql
CREATE USER kinevia WITH PASSWORD 'sua-senha';
CREATE DATABASE kinevia OWNER kinevia;
```

### 3. Backend

```bash
cd backend

cp .env.example .env
```

Edite `.env` com suas credenciais. Todas as variáveis estão documentadas no arquivo.

```bash
npm install

# Aplicar migrations
npx prisma migrate dev

# (Opcional) Popular com dados de exemplo
npx prisma db seed

# Iniciar servidor de desenvolvimento
npm run dev
```

O backend roda em `http://localhost:3333`. Documentação interativa (Swagger) em `http://localhost:3333/docs`.

### 4. Frontend

```bash
cd frontend

npm install

npm run dev
```

O frontend roda em `http://localhost:5173`.

### 5. (Opcional) Tudo com Docker

O repo inclui `docker-compose.yml` com Dockerfiles para backend e frontend:

```bash
docker compose up --build
```

- PostgreSQL 16 em `localhost:5432` (usuário/senha/banco: `kinevia`)
- Backend em `http://localhost:3333` (roda migrations + seed no entrypoint)
- Frontend servido via Nginx em `http://localhost`
- Ajuste `JWT_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` e `SUPABASE_*` via env vars

### 6. Supabase Storage (uploads)

1. Crie um projeto no [Supabase](https://supabase.com)
2. Vá em **Storage** → **Create bucket** → nome: `kinevia` (ou o configurado em `SUPABASE_STORAGE_BUCKET`)
3. Nas **RLS policies** do bucket, crie uma policy permitindo apenas operações autenticadas com service_role
4. Copie a **Project URL** (Settings → API → Project URL) e a **service_role key** (Settings → API → service_role key) para o `.env`

> Aviso: a `service_role key` tem privilégios totais sobre o banco Supabase. Mantenha-a segura — nunca a exponha no frontend ou em repositórios públicos.

---

## Variáveis de ambiente

### Backend (`.env`)

| Variável | Descrição | Obrigatória | Padrão |
|----------|-----------|-------------|--------|
| `DATABASE_URL` | URL de conexão PostgreSQL | Sim | — |
| `JWT_SECRET` | Chave secreta do access token | Sim | — |
| `JWT_REFRESH_SECRET` | Chave secreta do refresh token | Sim | — |
| `NODE_ENV` | Ambiente (`development`, `production`, `test`) | Não | `development` |
| `COOKIE_SECRET` | Segredo para assinar cookies (`openssl rand -hex 32`) | Não | — |
| `PORT` | Porta do servidor | Não | `3333` |
| `FRONTEND_URL` | Origem do frontend para CORS | Não | `http://localhost:5173` |
| `ACCESS_TOKEN_EXPIRY` | Expiração do access token | Não | `15m` |
| `REFRESH_TOKEN_EXPIRY` | Expiração do refresh token | Não | `7d` |
| `LOG_LEVEL` | Nível de log (`trace`, `debug`, `info`, `warn`, `error`) | Não | `info` |
| `SUPABASE_URL` | URL do projeto Supabase | Condicional¹ | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role do Supabase | Condicional¹ | — |
| `SUPABASE_STORAGE_BUCKET` | Nome do bucket de storage | Não | `kinevia` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Configuração do servidor SMTP | Condicional² | — |
| `SMTP_USER`, `SMTP_PASS` | Credenciais SMTP | Condicional² | — |
| `SMTP_FROM` | Remetente dos emails | Condicional² | — |

> ¹ Obrigatório apenas se for usar upload de assinatura/logo/laudo.
> ² Obrigatório apenas se for usar envio de email em produção. Modo dev: token logado no console.

---

## Scripts

### Backend

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com hot-reload (tsx watch) |
| `npm run build` | Compilar TypeScript para `dist/` |
| `npm start` | Rodar em produção |
| `npm test` | Executar testes (Vitest) |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check sem gerar arquivos |
| `npx prisma studio` | Explorar banco de dados via interface web |
| `npx prisma migrate dev` | Criar/aplicar migrations |
| `npx prisma db seed` | Popular com dados de exemplo |

### Frontend

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Type-check + build de produção |
| `npm run preview` | Pré-visualizar build de produção |
| `npm run lint` | ESLint |
| `npm test` | Executar testes (Vitest) |
| `npm run test:run` | Executar testes uma vez (sem watch) |

---

## Testes

### Backend

155 testes de integração em 17 arquivos:

| Arquivo | Escopo | Testes |
|---------|--------|--------|
| `auth.test.ts` | Login, refresh, logout, proteção de rotas, fluxo de senha temporária | 17 |
| `prontuario.test.ts` | Get, create/update, evolução, correção, auditoria de evolução | 16 |
| `paciente.test.ts` | CRUD, search, inativos, transferência (com restrições por papel), validação | 15 |
| `pacote.test.ts` | Criar, listar, adicionar sessão, marcar pagamento, slot duplicado, validação | 13 |
| `usuario.test.ts` | CRUD de usuários, roles, senha temporária, reenvio de convite | 12 |
| `financeiro.test.ts` | Resumo, por paciente, admin-only, validação, isolamento | 10 |
| `laudo.test.ts` | Create com/sem prontuário, listar, get by id, edit, isolamento por profissional | 10 |
| `idor.test.ts` | Proteção IDOR — acesso cross-clínica negado em agenda, relatório e pacotes | 10 |
| `profissional.test.ts` | Perfil próprio, edição, horários, senha, visibilidade por clínica | 9 |
| `clinica.test.ts` | CRUD de clínicas (SUPER_ADMIN), isolamento por clínica | 8 |
| `escopo.test.ts` | Escopo por papel (SUPER_ADMIN/ADMIN/ATENDENTE/PROFISSIONAL) em pacientes/prontuário | 8 |
| `agenda.test.ts` | Grade do dia, criação via pacote, slot ocupado, status, DESMARCOU libera sessão | 6 |
| `dashboard.test.ts` | Dashboard: filtro de profissional, escopo cross-clínica, faturamento por papel | 6 |
| `relatorio.test.ts` | Resumo vazio/com dados, filtro período, faturamento por papel | 6 |
| `audit.test.ts` | Auditoria: escopo SUPER_ADMIN vs ADMIN, exportação CSV | 4 |
| `error.middleware.test.ts` | Erros Prisma: P2002→409, P2025→404, outros→400, genérico→500 | 4 |
| `health.test.ts` | Health check básico | 1 |

Setup: banco de testes isolado (`globalSetup.ts` executa migrations automáticas), helpers de fábrica (`criarProfissional`, `criarPaciente`, `gerarToken`).

### Frontend

89 testes em 15 arquivos:

| Arquivo | Escopo | Testes |
|---------|--------|--------|
| `masks.test.ts` | Formatação de CPF e telefone | 11 |
| `paciente.test.ts` | Schema de validação de paciente | 11 |
| `api.test.ts` | Interceptor 401, refresh, retry, redirect /login | 8 |
| `button.test.tsx` | Render, variantes, tamanhos, disabled, asChild | 7 |
| `auth.test.ts` | Schema de validação de auth | 6 |
| `profissional.test.ts` | Schema de validação de profissional | 6 |
| `RotaProtegida.test.tsx` | Token válido/expirado, senha temporária, setup incompleto | 6 |
| `RotaAdmin.test.tsx` | Guarda de role para /admin (ADMIN/SUPER_ADMIN vs demais) | 5 |
| `utils.test.ts` | Função `cn` do Tailwind | 5 |
| `data.test.ts` | `formatarDataISO` | 5 |
| `pacotes.test.ts` | Funções utilitárias de pacotes | 5 |
| `useProfissional.test.ts` | Cache + `clearProfissionalCache` (loop de setup) | 4 |
| `useProfissionais.test.ts` | Select de profissionais: filtro ATENDENTE, erro, habilitação | 4 |
| `RotaConfiguracoes.test.tsx` | Guarda de role para configurações (ATENDENTE bloqueado) | 3 |
| `ErrorBoundary.test.tsx` | Fallback em erro, ocultação em produção | 3 |

### Executar todos os testes

```bash
# Backend + frontend
cd backend && npm test
cd frontend && npm test
```

---

## Segurança

### Implementado

| Medida | Detalhe |
|--------|---------|
| **JWT** | Access token (15min) + Refresh token httpOnly (7d) com `sameSite: 'strict'` |
| **Token versioning** | `token_version` no banco — logout/troca de senha invalida todos os tokens |
| **Proteção contra timing attack** | Mensagens genéricas ("Credenciais inválidas") em login e esqueci senha |
| **Senha** | bcrypt (10 rounds), política: 8+ chars, maiúscula, minúscula, número, caractere especial |
| **Reset de senha** | Token criptográfico (256 bits) armazenado como bcrypt, one-time, expira 1h |
| **Rate limiting** | Login (5/15min), refresh (20/15min), troca de senha (5/15min), reset de senha (3/15min), verificação de senha (10/15min) + global API (100/min) |
| **Helmet** | HSTS (1 ano, subdomínios, preload), CSP, e outros headers HTTP de segurança |
| **CORS** | Whitelist explícita + `credentials: true` |
| **Upload** | Magic bytes (não confia em extensão), whitelist PNG/JPG/GIF/WebP, limite 5MB |
| **Storage** | Bucket privado, URLs assinadas com expiração de 1h |
| **Validação** | Zod em todas as rotas (CPF, datas, enums, UUIDs, tamanhos) |
| **Isolamento** | Toda query filtra por `profissional_id` do token — dados nunca vazam entre profissionais |
| **Refresh token** | Em cookie httpOnly (inacessível via JS), access token em memória (nunca localStorage) |
| **Error boundary** | Captura erros de renderização no frontend, não expõe stack trace em produção |
| **Autorização por role** | Middleware `authorize(...roles)` + regras finas por controller (hierarquia, escopo de clínica) |
| **Senha temporária** | 1º login força troca (`/auth/trocar-senha`); middleware bloqueia todas as outras rotas até trocar |
| **Auditoria (LGPD)** | `AuditLog` registra acesso/edição de prontuário, laudos, exportação/anonimização de paciente |

### Em aberto (para produção)

- CSRF token explícito (mitigado por `sameSite: 'strict'` + httpOnly cookie)
- Auditoria de dependências (`npm audit` via CI)
- Varredura de malware em uploads
- Rate limit em memória (por instância) — ao escalar para múltiplas instâncias, migrar para store compartilhado (ex.: Redis)
- Idempotência nas rotas de criação (criar agendamento/pacote/pagamento) para evitar duplicatas em replays de rede

---

## Estrutura do projeto

```
kinevia/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Modelo de dados (12+ tabelas: Profissional, Clinica, Paciente, Prontuario, Laudo, AuditLog...)
│   │   ├── migrations/            # Migrations SQL sequenciais
│   │   └── seed.ts                # Cria clínica padrão + SUPER_ADMIN (admin@fisiogest.com / 123456)
│   ├── src/
│   │   ├── config/                # Swagger (módulos por domínio)
│   │   ├── controllers/           # Lógica das rotas (auth, usuario, admin, audit, paciente, agenda...)
│   │   ├── jobs/                  # Cron job — lembrete por email (30 em 30 min)
│   │   ├── lib/                   # Prisma client, Supabase client, logger, config, audit
│   │   ├── middlewares/           # auth (authenticate/authorize), validação Zod, upload, rate limit
│   │   ├── routes/                # Definição de rotas Express (16 arquivos)
│   │   ├── schemas/               # Schemas Zod (auth, usuario, paciente, clinica...)
│   │   ├── services/              # Email, PDF, notificações, pacotes, storage
│   │   └── server.ts              # Entry point — Express (monta rotas e middlewares)
│   └── tests/                     # Testes de integração (Vitest + Supertest)
│       ├── helpers.ts             # Fábricas: criarProfissional, criarPaciente, gerarToken
│       ├── setup.ts               # Setup do Vitest
│       ├── globalSetup.ts         # Auto-migrate do banco de testes
│       └── *.test.ts              # 17 arquivos de teste
├── frontend/
│   ├── public/                    # Ícones, manifest
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                # Componentes shadcn/ui (13+)
│   │   │   ├── Layout/            # Sidebar, header, nav mobile, notificações
│   │   │   └── ...                # ErrorBoundary, RouteError, RotaConfiguracoes, SenhaInput
│   │   ├── hooks/                 # useProfissional (cached), useProfissionais (select por papel), useNotificacoes (polling), useSetupCheck, useSenhaValida
│   │   ├── lib/
│   │   │   ├── schemas/           # Schemas Zod do frontend (auth, paciente, profissional)
│   │   │   ├── __tests__/         # Testes de utilitários e schemas
│   │   │   ├── api.ts             # Axios client com interceptors + refresh automático
│   │   │   ├── utils.ts           # cn(), formatarCPF, formatarTelefone, etc.
│   │   │   ├── masks.ts           # Máscaras de input
│   │   │   ├── data.ts            # Utilitários de data
│   │   │   ├── pacotes.ts         # labelTipoPacote, etc.
│   │   │   └── senha.ts           # useSenhaValida — requisitos de senha
│   │   ├── pages/                 # Login, Dashboard, Agenda, Pacientes, Financeiro, Relatorios, Configurações, Admin
│   │   │   ├── Admin/             # Dashboard (SUPER_ADMIN/ADMIN), Usuarios, Auditoria, ClinicaDetalhe
│   │   │   ├── Agenda/            # Context + 8 subcomponentes (visões diária/semanal/mensal, modais)
│   │   │   └── Pacientes/         # index, Novo, Editar, Perfil/ (4 abas incl. Laudos com 3 forms)
│   │   ├── types/                 # Interfaces TypeScript (incl. Role)
│   │   ├── test/                  # Setup do Vitest (setup.ts)
│   │   ├── router.tsx             # Rotas + RotaProtegida (auth + setup guard) + RotaConfiguracoes
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── vitest.config.ts
├── .github/workflows/             # CI pipeline (testes backend+frontend + build)
├── docs/                          # ADMIN-USER-MANAGEMENT, SECURITY-REVIEW, DPA, PRIVACY-POLICY
├── ROADMAP.md                     # Planejamento futuro
└── README.md                      # Este arquivo
```

---

## API

Com o backend rodando, a documentação interativa (Swagger) está disponível em:

```
http://localhost:3333/docs
```

### Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/v1/auth/login` | Login (não existe auto-registro público) |
| POST | `/v1/auth/refresh` | Renovar access token |
| POST | `/v1/auth/logout` | Logout (invalida tokens) |
| POST | `/v1/auth/trocar-senha` | Troca obrigatória de senha temporária |
| POST | `/v1/auth/esqueci-senha` | Solicitar redefinição de senha |
| POST | `/v1/auth/redefinir-senha` | Redefinir senha com token |
| GET | `/v1/profissional/me` | Dados do profissional logado |
| PUT | `/v1/profissional/me` | Atualizar dados |
| PUT | `/v1/profissional/me/senha` | Alterar senha |
| POST | `/v1/profissional/me/verificar-senha` | Verificar senha atual |
| PUT | `/v1/profissional/me/email` | Alterar email (força relogin) |
| GET | `/v1/pacientes` | Listar pacientes |
| POST | `/v1/pacientes` | Criar paciente |
| GET | `/v1/pacientes/:id` | Detalhes do paciente |
| PUT | `/v1/pacientes/:id` | Atualizar paciente |
| GET | `/v1/agenda` | Grade do dia (ou intervalo) |
| GET | `/v1/agenda/resumo-mes` | Resumo do mês (visão mensal) |
| POST | `/v1/agenda/agendamentos` | Criar agendamento |
| PATCH | `/v1/agenda/agendamentos/:id/status` | Atualizar status do agendamento |
| GET | `/v1/pacientes/:id/prontuario` | Obter prontuário |
| PUT | `/v1/pacientes/:id/prontuario` | Criar/atualizar prontuário |
| POST | `/v1/pacientes/:id/evolucoes` | Adicionar evolução |
| PATCH | `/v1/evolucoes/:id/correcao` | Adicionar correção à evolução |
| POST | `/v1/pacientes/:id/pacotes` | Criar pacote de sessões |
| POST | `/v1/pacotes/:id/sessoes` | Adicionar sessão ao pacote |
| PATCH | `/v1/pacotes/:id/pagamento` | Marcar pacote como pago |
| GET | `/v1/pacientes/:id/laudos` | Listar laudos do paciente |
| POST | `/v1/pacientes/:id/laudos` | Criar laudo |
| GET | `/v1/laudos/:id/pdf` | Baixar PDF do laudo |
| GET | `/v1/laudos/:id/declaracao-sessoes` | Declaração de sessões |
| GET | `/v1/financeiro/resumo` | Resumo financeiro |
| GET | `/v1/relatorios/resumo` | Relatório por período |
| GET | `/v1/dashboard/resumo` | Resumo do dashboard (todas as roles) |
| GET | `/v1/notificacoes` | Listar notificações in-app do profissional |
| GET | `/v1/notificacoes/nao-lidas` | Total de não lidas (badge do sino) |
| PATCH | `/v1/notificacoes/:id/ler` | Marcar notificação como lida |
| PATCH | `/v1/notificacoes/ler-todas` | Marcar todas como lidas |
| GET/POST/PUT/DELETE | `/v1/usuarios` | CRUD de usuários (ADMIN/SUPER_ADMIN) |
| GET | `/v1/admin/auditoria` | Logs de auditoria (ADMIN/SUPER_ADMIN) |
| GET | `/v1/admin/auditoria/exportar` | Exportar auditoria em CSV |
| GET | `/v1/admin/dashboard-clinica` | Métricas da clínica (ADMIN/SUPER_ADMIN) |
| GET | `/v1/admin/resumo` | Métricas globais (SUPER_ADMIN) |
| GET/POST/PUT/DELETE | `/v1/admin/clinicas` | CRUD de clínicas (SUPER_ADMIN) |

> Lista completa com validação Zod e exemplos: Swagger em `/docs`.

---

## Licença

MIT
