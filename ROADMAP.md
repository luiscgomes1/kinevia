# Roadmap — Kinevia

> Projeto com intuito real. Documento vivo de tudo que ainda precisa ser feito para
> transformar o Kinevia num sistema pronto para uso profissional por fisioterapeutas.
>
> Última atualização: Setembro/2026 — dashboard por perfil (cards + gráficos), notificações
> in-app (sino: transferência, novo paciente, novo membro da equipe, sessão cancelada), helper
> de profissionais (`useProfissionais`), UX (label do sino), lint/tsc limpos,
> 155 testes backend + 89 testes frontend

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| 🔴 | Essencial para MVP utilizável |
| 🟠 | Importante para qualidade/segurança |
| 🟢 | Melhoria contínua |
| ⚪ | Visão de futuro |
| ✅ | Já implementado |

---

## 1. Testes 🧪

**Estado atual:** 155 testes de integração no backend (17 arquivos) + 89 testes no frontend.
CI (`.github/workflows/ci.yml`) roda backend, frontend e build em cada push.

### 1.1 Cobertura atual — Backend (155 testes)

| Área | Arquivo | Testes | Status |
|------|---------|--------|--------|
| Autenticação | `auth.test.ts` | 17 | ✅ completo |
| Prontuário + evoluções | `prontuario.test.ts` | 16 | ✅ completo |
| Pacientes | `paciente.test.ts` | 15 | ✅ completo |
| Pacotes e sessões | `pacote.test.ts` | 13 | ✅ completo |
| Usuários (admin) | `usuario.test.ts` | 12 | ✅ completo |
| Financeiro | `financeiro.test.ts` | 10 | ✅ completo |
| Laudos (PDF) | `laudo.test.ts` | 10 | ✅ completo |
| IDOR (cross-clínica) | `idor.test.ts` | 10 | ✅ completo |
| Profissional | `profissional.test.ts` | 9 | ✅ completo |
| Clínicas | `clinica.test.ts` | 8 | ✅ completo |
| Escopo por papel | `escopo.test.ts` | 8 | ✅ completo |
| Agenda | `agenda.test.ts` | 6 | ✅ completo |
| Dashboard (escopo) | `dashboard.test.ts` | 6 | ✅ completo |
| Relatórios | `relatorio.test.ts` | 6 | ✅ completo |
| Auditoria | `audit.test.ts` | 4 | ✅ completo |
| Middleware de erro Prisma | `error.middleware.test.ts` | 4 | ✅ |
| Health check | `health.test.ts` | 1 | ✅ |

### 1.2 Testes — Frontend (89 testes)

| Área | Status |
|------|--------|
| Schemas de validação (auth, paciente, profissional) | ✅ |
| Utilitários (masks, data, pacotes, senha) | ✅ |
| Testes de componentes (EscalaDor, Campo, HelpTooltip, FormularioPacote, ErrorBoundary, button etc.) | ✅ |
| `services/api.ts` — interceptor 401, refresh, retry, redirect | ✅ |
| Guards de rota — `RotaAdmin`, `RotaConfiguracoes`, `RotaProtegida` (roles + setup) | ✅ |
| `useProfissional` — cache + `clearProfissionalCache` (loop de setup) | ✅ |
| `useProfissionais` — filtro ATENDENTE, erro, habilitação | ✅ |

### 1.3 Pendências em testes

| # | O quê | Prioridade | Esforço |
|---|-------|------------|---------|
| 1.3.1 | Ampliar cobertura da **Agenda** (criar agendamento, slot ocupado, status flow, DESMARCOU) | ✅ concluído | 2h |
| 1.3.2 | Testes de **upload** (assinatura/logo): magic bytes, arquivo inválido, dimensões | 🟢 | 1h |
| 1.3.3 | Testes de **rate limiting** (exceder limite em auth) | 🟢 | 1h |
| 1.3.4 | **MSW + testes de integração frontend** (login, páginas ↔ endpoint) | 🟠 | 4h |
| 1.3.5 | Testes do **DELETE `/pacotes/:id`** (rollback de pacote órfão) | 🟠 | 0.5h |
| 1.3.6 | Testes do **export CSV de auditoria** (blob + download) | 🟠 | 0.5h |

---

## 2. Infraestrutura e Deploy 🚀

**Estado atual:** CI workflow commitado (backend+frontend+build). Dockerfile do backend e
frontend + `docker-compose.yml` implementados. `VITE_API_URL` corrigido para same-origin (proxy
nginx) em produção; secrets do compose obrigatórios via `${VAR:?}`; `.env.example` na raiz criado.
Falta deploy em ambiente real.

| # | O quê | Prioridade | Esforço | Status |
|---|-------|------------|---------|--------|
| 2.1 | **CI pipeline** (`.github/workflows/ci.yml`) | 🔴 | 1h | ✅ |
| 2.2 | **Dockerfile — Backend**: imagem multi-stage, compilar + runtime leve | 🔴 | 1h | ✅ |
| 2.3 | **Dockerfile — Frontend**: Nginx para servir SPA com build estático | 🔴 | 1h | ✅ |
| 2.4 | **docker-compose.yml**: PostgreSQL + backend + frontend, network isolada | 🔴 | 1h | ✅ |
| 2.5 | **Deploy**: configurar destino (Railway/Render/VPS) | 🔴 | 2h | — |
| 2.6 | **Variáveis de ambiente**: validar todas na inicialização, não só JWT/DATABASE | 🟠 | 0.5h | — |
| 2.7 | **Backup do banco**: script ou serviço para backup automático do PostgreSQL | 🟢 | 1h | — |
| 2.8 | **Monitoramento**: logs centralizados, alerta de erros 500 | 🟢 | 2h | — |
| 2.9 | **Domínio + SSL**: configurar domínio personalizado, certificado Let's Encrypt | 🟢 | 1h | — |

---

## 3. Segurança 🔒

**Estado atual:** JWT httpOnly, Helmet, CORS restrito, rate limit global, token versioning,
senha temporária com troca obrigatória, magic bytes em upload, HSTS, `AuditLog` para operações
críticas (LGPD). Revisão aprofundada de Julho/2026 corrigiu: guards de `/admin` por role,
escopo LGPD em `exportarDados` (ADMIN/SUPER_ADMIN exportam a clínica inteira), escopo por papel
em listagens (helper `lib/escopo.ts`). Pendências:

| # | O quê | Prioridade | Esforço | Status |
|---|-------|------------|---------|--------|
| 3.1 | **Rate limiting em todos os endpoints** | 🟠 | 1h | ✅ |
| 3.2 | **Audit log** (acesso/edição de prontuário, laudos, exportação/anonimização) | 🟠 | 2h | ✅ |
| 3.3 | **CSRF**: double-submit cookie ou SameSite mais restritivo (mitigado por `lax` + httpOnly) | 🟠 | 1h | — |
| 3.4 | **Content Security Policy**: revisar diretivas — `connectSrc` incluir `SUPABASE_URL` | 🟢 | 0.5h | — |
| 3.5 | **Sanitização de inputs**: validar se campos de texto livre precisam de sanitização HTML | 🟢 | 1h | — |
| 3.6 | **Proteção contra força bruta**: rate limiter por IP + email no login | 🟢 | 1h | — |
| 3.7 | **`npm audit` em CI**: auditoria de dependências | 🟢 | 0.5h | — |

---

## 4. Qualidade de Código 📐

**Estado atual:** TypeScript `strict: true` no backend; no frontend ainda não (mas `noUnusedLocals`,
`noUnusedParameters`, `noFallthroughCasesInSwitch` habilitados e tsc/eslint limpos).

| # | O quê | Prioridade | Esforço | Status |
|---|-------|------------|---------|--------|
| 4.1 | **Normalizar CRLF/LF**: configurar `.gitattributes` | 🟠 | 1h | — |
| 4.2 | **TypeScript strict mode — backend** | 🟠 | 3h | ✅ |
| 4.3 | **TypeScript strict mode — frontend** (`tsconfig.app.json`) | 🟠 | 3h | — |
| 4.4 | **ESLint mais rigoroso**: `no-unused-vars`, `no-shadow`, `explicit-function-return-type` | 🟢 | 1h | — |
| 4.5 | **Path aliases no backend**: configurar `@/` igual ao frontend | 🟢 | 0.5h | — |
| 4.6 | **AGENTS.md**: registrar convenções e decisões (ADR-006, slot model, roles) | 🟢 | 1h | — |

---

## 5. Documentação 📖

**Estado atual:** README atualizado. Swagger em `/docs`. `docs/` com ADMIN-USER-MANAGEMENT,
SECURITY-REVIEW, DPA, PRIVACY-POLICY. Vault (Obsidian) mantém ADRs, requisitos e regras de negócio.

| # | O quê | Prioridade | Esforço | Status |
|---|-------|------------|---------|--------|
| 5.1 | **Documentação do admin de usuários** | 🟠 | 2h | ✅ |
| 5.2 | **Completar Swagger**: várias rotas sem documentação ou exemplos incompletos | 🟠 | 3h | — |
| 5.3 | **Diagrama ERD**: exportar do Prisma Studio e adicionar ao repo | 🟢 | 0.5h | — |
| 5.4 | **Guia de deploy**: instruções passo a passo | 🟢 | 1h | — |
| 5.5 | **CHANGELOG.md**: histórico de versões | 🟢 | 0.5h | — |

---

## 6. Funcionalidades Pendentes 🧩

### 6.1 Essenciais para MVP

| # | O quê | Prioridade | Esforço | Status |
|---|-------|------------|---------|--------|
| 6.1.1 | **Dashboard / Home** (resumo do dia, próximos agendamentos) | 🔴 | 4h | ✅ |
| 6.1.2 | **Notificações no sistema** (popover de avisos, agendamento próximo) | 🔴 | 3h | ✅ |
| 6.1.3 | **Impressão da agenda**: botão para imprimir grade do dia/semana | 🔴 | 2h | — |
| 6.1.4 | **Exportar dados**: relatórios em CSV/PDF exportáveis | 🟠 | 3h | — |
| 6.1.5 | **Busca de pacientes por CPF/telefone**: além de nome | 🟠 | 1h | — |

### 6.2 Experiência do Usuário

| # | O quê | Prioridade | Esforço |
|---|-------|------------|---------|
| 6.2.1 | **Modo escuro**: alternador com `prefers-color-scheme` | 🟢 | 2h |
| 6.2.2 | **Responsividade mobile**: revisar todas as telas para celular | 🟠 | 4h |
| 6.2.3 | **Offline mode**: service worker com páginas cacheadas | 🟢 | 4h |
| 6.2.4 | **Gestos em mobile**: swipe para navegar dias na agenda | 🟢 | 1h |
| 6.2.5 | **Feedback tátil/háptico**: vibração em ações destrutivas | 🟢 | 0.5h |
| 6.2.6 | **Atalhos de teclado**: Ctrl+N para novo paciente, setas na agenda | 🟢 | 2h |
| 6.2.7 | **Tutorial interativo**: guided tour no primeiro login | 🟢 | 3h |

### 6.3 Funcionalidades Avançadas

| # | O quê | Prioridade | Esforço | Status |
|---|-------|------------|---------|--------|
| 6.3.1 | **Multi-profissional**: modelos `Clinica` + `Profissional.clinica_id` + roles implementados | ⚪ | 8h+ | ✅ base |
| 6.3.2 | **Anamnese digital**: paciente preenche antes da consulta via link | ⚪ | 6h | — |
| 6.3.3 | **Pagamento online**: integração com Pix via gateway (Asaas, Stripe) | ⚪ | 8h+ | — |
| 6.3.4 | **WhatsApp**: notificações via WhatsApp Business API | ⚪ | 6h | — |
| 6.3.5 | **App mobile**: React Native ou Expo para pacientes | ⚪ | 20h+ | — |
| 6.3.6 | **Teleconsulta**: integração com sala de vídeo (Jitsi, Zoom) | ⚪ | 8h+ | — |
| 6.3.7 | **Faturamento convênios**: emissão de guias para planos de saúde | ⚪ | 12h+ | — |
| 6.3.8 | **Múltiplos idiomas**: i18n (inglês, espanhol) | ⚪ | 6h | — |

---

## 7. Melhorias Técnicas Específicas 🛠️

### 7.1 Backend

| # | O quê | Prioridade | Esforço | Status |
|---|-------|------------|---------|--------|
| 7.1.1 | **Tratamento de erros Prisma**: discriminar `P2002`, `P2025` no global error handler | 🟠 | 1h | — |
| 7.1.2 | **Paginação com cursor**: em vez de `skip`/`take` para listas grandes | 🟢 | 2h | — |
| 7.1.3 | **Upload de imagens**: validar dimensões máximas (ex: 2000x2000) | 🟢 | 0.5h | — |
| 7.1.4 | **Jobs**: lembrete deve marcar `lembrete_email_enviado` em batch | 🟢 | 0.5h | — |
| 7.1.5 | **Timezone**: fuso horário do profissional, usar nas queries de data | 🟢 | 2h | — |
| 7.1.6 | **Índices de banco**: revisar indexes compostos para queries frequentes | 🟢 | 1h | — |

### 7.2 Frontend

| # | O quê | Prioridade | Esforço | Status |
|---|-------|------------|---------|--------|
| 7.2.1 | **Zod no frontend**: schemas para formulários | 🟠 | 3h | ✅ |
| 7.2.2 | **Estado global**: avaliar se Context API escala ou vale Zustand | 🟢 | 2h | — |
| 7.2.3 | **React Query (TanStack Query)**: cache, refetch, loading states | 🟠 | 6h | — |
| 7.2.4 | **Error boundaries** por módulo | 🟠 | 1h | ✅ |
| 7.2.5 | **Skeleton loading** (Agenda, Financeiro, Relatórios) | 🟢 | 1h | — |
| 7.2.6 | **useProfissional**: substituir cache manual por React Query ou Context | 🟢 | 1h | — |
| 7.2.7 | **PWA manifest + service worker** | 🟢 | 3h | — |

---

## 8. Revisão Aprofundada (Julho/2026) — Correções ✅

Revisão backend + frontend + infra. Todos os itens corrigidos, do maior para o menor grau de severidade:

| # | Lacuna | Correção |
|---|--------|----------|
| 1 | Mojibake (encoding) em formulários de paciente e configurações | Acentos corrigidos em `Pacientes/Novo`, `Pacientes/Editar`, `Configuracoes` |
| 2 | `/admin/*` sem guarda de role | `RotaAdmin` criado e aplicado nas 4 rotas; `Admin/Dashboard` com try/catch (fim do spinner infinito) |
| 3 | Dead-end do ATENDENTE no Dashboard (403 em `/profissional`) | ATENDENTE removido de `podeFiltrar` (vê a clínica inteira, sem filtro individual) |
| 4 | Loop de setup (`useProfissional` com cache não invalidado) | `clearProfissionalCache()` chamado ao salvar perfil |
| 5 | Export CSV de auditoria usava `window.open` (sem Authorization → 401) | Download via `api.get` com `responseType: 'blob'` |
| 6 | Frontend chamava `DELETE /pacotes/:id` inexistente | Endpoint `deletarPacote` + rota criados no backend |
| 7 | `exportarDados` (LGPD) ignorava escopo por papel | Helpers `wherePaciente/wherePacote/whereLaudo/whereAgendamento` aplicados |
| 8 | Toast "Sessão renovada" repetitivo a cada refresh | Removido; toast de erro apenas na falha do refresh |

## 9. Análise Aprofundada — 2ª rodada (Agosto/2026) — Correções ✅

Novos achados da análise em todos os sentidos (backend, frontend, infra), todos corrigidos:

| # | Lacuna | Correção |
|---|--------|----------|
| 1 | Boot de produção no Docker (`VITE_API_URL` vazio caía em `localhost:3333`, ignorando o proxy nginx) | Fallback same-origin (`""`) no `api.ts`; compose com secrets obrigatórios via `${VAR:?}`; `.env.example` na raiz criado |
| 2 | Erros Prisma genéricos (500) para P2002/P2025 | `middlewares/error.middleware.ts`: P2002→409, P2025→404, outros→400; registrado no server |
| 3 | `tsconfig.app.json` sem `strict` | `strict: true` ativado; teste `api.test.ts` ajustado; eslint com override p/ testes |
| 4 | Zod divergente (frontend v4 vs backend v3) | Backend atualizado para `zod@^4.4.3`; `errorMap` → `message` em 3 schemas |
| 5 | Erros de fetch silenciados (`.catch(() => {})`) | Toasts de erro adicionados em `Relatorios`, `Auditoria`, `AgendaContext`, `Dashboard` |
| 6 | Botões de ícone sem rótulo acessível | `aria-label` adicionado em navegações da Agenda (dia/mês), modais (voltar) e Financeiro |
| 7 | Endpoint morto `POST /agenda/agendamentos` (nada no frontend o usa) | Controller + rota + schema + doc swagger removidos; import `enviarConfirmacao` órfão limpo |
| 8 | Deps sem uso `radix-ui` e `shadcn` (CLI) no frontend | Removidas do `package.json` + lockfile |
| 9 | Dashboard: ATENDENTE/ADMIN podiam filtrar por profissional de outra clínica (IDOR) | Validação de `clinica_id` em `validarFiltroProfissional`; 404 cross-clínica; 4 testes novos |
| 10 | Vitest backend varrendo `dist/` (cópia compilada) | `exclude: ['node_modules/**', 'dist/**']` no vitest.config |

**Estado atual:** Lint e typecheck limpos no backend e frontend (`tsc --noEmit`, `eslint .`).
Frontend com `strict` ativado. Build de produção ok. Backend 126 testes (16 arquivos), frontend 85 testes (14 arquivos).
118 testes backend + 85 frontend verdes. Nenhum bug conhecido permanece em aberto.

---

## 9. Administração de Usuários ✅

> Documento completo: `docs/ADMIN-USER-MANAGEMENT.md`

**Estado atual:** Implementado.

| # | O quê | Status |
|---|-------|--------|
| 9.1 | Modelo `Clinica` + roles (`SUPER_ADMIN/ADMIN/PROFISSIONAL/ATENDENTE`) + coluna `senha_temporaria` | ✅ |
| 9.2 | Seed de SUPER_ADMIN (só roda se banco vazio) | ✅ |
| 9.3 | Troca obrigatória de senha temporária + middleware | ✅ |
| 9.4 | CRUD de usuários pelo ADMIN (`/v1/usuarios`) | ✅ |
| 9.5 | Geração de senha temporária (exibição na tela) | ✅ |
| 9.6 | Painel frontend `/admin/usuarios` | ✅ |
| 9.7 | Restrições de ATENDENTE (menos permissões, menu reduzido) | ✅ |
| 9.8 | SUPER_ADMIN painel global (clínicas, métricas) | ✅ |
| 9.9 | Audit trail + redefinição de senha por email | ✅ |
| 9.10 | Auditoria de operações críticas (LGPD) | ✅ |

---

## 10. Resumo de Esforço

| Categoria | Itens em aberto |
|-----------|-----------------|
| 🧪 Testes | ~4 itens (~8h) |
| 🚀 Deploy/Infra | ~5 itens em aberto (~5.5h) |
| 🔒 Segurança | ~5 itens (~4h) |
| 📐 Qualidade | ~5 itens (~6.5h) |
| 📖 Documentação | ~4 itens (~5h) |
| 🧩 Funcionalidades | ~14 itens (~45h) |
| 🛠️ Melhorias técnicas | ~11 itens (~18h) |

### Prioridade para MVP utilizável (~30h)

1. Ampliar testes da Agenda (2h)
2. TypeScript strict no frontend (3h)
3. Deploy em ambiente real (2h)
4. Impressão da agenda (2h)
5. Exportar dados CSV/PDF (3h)
6. React Query + MSW de testes frontend (10h)
7. Paginação com cursor (2h)
8. Responsividade mobile (4h)

---

> Este documento deve ser revisado e atualizado conforme o projeto evolui.
> Para contribuir com novos itens ou discutir prioridades, abra uma issue.
