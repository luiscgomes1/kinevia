# Auditoria de Segurança — Kinevia (2ª revisão)

> Data: 21/09/2026 · Revisão aprofundada (backend + frontend + infra) · 136 testes backend + 85 testes frontend
>
> Revisão anterior: `SECURITY-REVIEW-2026-07-23.md`. Este documento registra a 2ª passagem,
> do mais crítico ao menor, com o status de cada correção.

---

## Resumo

| Severidade | Itens | Status |
|---|---|---|
| 🔴 Crítico | 1 (C1) | ✅ |
| 🔴 Alta | 5 (A1–A5) | ✅ |
| 🟡 Média | 13 (M1–M13) | ✅ |
| 🟢 Baixa | 19 (B1–B19) | ✅ (B16 requer commit) |

Total: backend/frontend **sem vulnerabilidades no runtime** — restam 3 "high" **dev-only** no backend (`prisma` CLI → `deepmerge-ts <8`, fora do `@prisma/client`), ver nota no upgrade v6.

---

## 🔴 C1 — Seed não roda em produção (Docker)

- **Problema:** entrypoint do container não aplicava migrações; Prisma não era runtime dep.
- **Correção:** `prisma` movido para `dependencies`; entrypoint `docker-compose` =
  `npx prisma migrate deploy && node dist/server.js`; `npm ci --omit=dev` mantém o generator.
- **Status:** ✅ (validar em build real antes do deploy)

---

## 🔴 A1 — IDOR na agenda (ATENDENTE)

- **Problema:** `buscarAgendaDia`/`resumoMes` usavam `req.profissionalId` fixo; ATENDENTE com
  `profissional_id` no query podia ler a agenda de qualquer profissional (mesma clínica).
- **Correção:** `resolverProfissionalAlvo(req, filtro)` em `lib/escopo.ts` — ADMIN/ATENDENTE só da
  própria clínica (404 cross-clínica), PROFISSIONAL ignora filtro, sem filtro → `undefined`.
- **Status:** ✅ + testes em `tests/idor.test.ts`.

## 🔴 A2 — IDOR em relatórios

- **Problema:** ADMIN podia consultar o resumo/comparativo de profissional de outra clínica
  (filtro `profissional_id` livre).
- **Correção:** `profissionalAlvo` resolvido via `resolverProfissionalAlvo` em
  `resumoPeriodo`/`comparativoPeriodo` e propagado aos `buildWhere*`; 404 quando inválido.
- **Status:** ✅ + testes.

## 🔴 A3 — IDOR em pacotes

- **Problema:** `criarPacote`/`listarPacotes` não filtravam por clínica; PROFISSIONAL conseguia
  criar pacote em paciente de outro profissional da mesma clínica.
- **Correção:** controller reescrito com `clinicaIdSeguro` (deny-by-default `__sem_clinica__`),
  `wherePacienteEscopado`, `wherePacoteEscopado`; tipos para `Prisma.*WhereInput`.
- **Status:** ✅ + testes.

## 🔴 A4 — `transferirPaciente` usava dono errado e sem transação

- **Problema:** `where` montado com `req.profissionalId` (pedra de `WHERE professionalId`) em vez do
  dono real; atualização de pacotes/laudos fora de `$transaction`.
- **Correção:** `donoAnterior = paciente.profissional_id`; toda a mudança em `$transaction`
  (agendamento/sessão/pacote/laudo/paciente + clínica); checagem de "já pertence" corrigida;
  audit `de: donoAnterior`.
- **Status:** ✅ + testes.

## 🔴 A5 — Dependências com CVEs

- **Problema:** multer (≤1.4.5), nodemailer (≤6.9.9), express (<4.22), qs, brace-expansion, nanoid.
  `npm audit fix` falhava por bug do npm (arborist `Cannot read properties of null (edgesOut)`).
- **Correção:** npm global atualizado p/ 11.19.1; upgrades manuais (multer ^2.4.0, nodemailer ^9.1.1,
  express ^4.22.3, vitest ^4.1.11, react-router-dom ^7.18.4, postcss ^8.5.28) + `overrides`
  (qs, js-yaml, fast-uri, brace-expansion, nanoid, undici, browserslist, baseline-browser-mapping).
- **Status:** ✅ `npm audit` = **0 vulnerabilidades** nos dois projetos.

---

## 🟡 Médias

| # | Problema | Correção | Status |
|---|---|---|---|
| M1 | `historicoPaciente` sem escopo nem `authorize` | `wherePaciente(req)` + 404 + `authorize(...)` na rota | ✅ |
| M2 | Auditoria validava `paciente_id` livre | Filtro por clínica p/ ADMIN (senão `__nao_existe__`) | ✅ |
| M3 | ADMIN/ATENDENTE sem clínica tinham escopo leniente | Deny-by-default `clinica_id: '__sem_clinica__'` (escopo.ts, pacote, auditoria) | ✅ |
| M4 | `valor_cobrado` controlado pelo cliente | Schema opcional; servidor deriva da tabela de preços do dono (fallback 0) | ✅ |
| M5 | Token de redefinição na URL | Captura única via `useState` + `replaceState`; token nunca re-exposto | ✅ |
| M6 | Anonimização não limpava CPFs dentro dos laudos | `conteudo.cpf_paciente` → `[ANONIMIZADO]` em todos os laudos | ✅ |
| M7 | Porta do backend em `0.0.0.0` | `127.0.0.1:3333:3333` no compose (postgres idem) | ✅ |
| M8 | Token de reset marcado usado fora da transação | `redefinirSenha` em `$transaction` (hash antes) | ✅ |
| M9 | ATENDENTE acessava `/financeiro` e `/relatorios` | `RotaPermitida` (roles ADMIN/PROFISSIONAL/SUPER_ADMIN) | ✅ |
| M10 | Validações frontend divergentes do backend | Horário `HH:mm` real + início<fim; `data_nascimento` com calendário real | ✅ |
| M11 | Race cond. na busca de pacientes | `AbortController` conectado ao axios + ignora abort | ✅ |
| M12 | nginx sem headers nem limite de upload | Headers de segurança + `client_max_body_size 6m` | ✅ |
| M13 | Bundle sem code-splitting | `React.lazy` nas rotas pesadas (Financeiro, Relatórios, Admin) | ✅ |

---

## 🟢 Baixas

| # | Problema | Correção | Status |
|---|---|---|---|
| B1 | `verificar-senha` sem rate limit | `verificarSenhaRateLimiter` (10/15min) na rota | ✅ |
| B2 | — | (n/a nesta passagem) | — |
| B3 | Senha temporária retornada em claro | Só exposta (e com warn) quando email não configurado/conseguiu entregar; frontend trata ambos | ✅ |
| B4 | PII em logs (email etc.) | `redact` central no pino (`email`, `cpf`, tokens...) | ✅ |
| B5 | — | (n/a) | — |
| B6 | Timing de login com usuário inexistente | dummy `bcrypt.compare` quando usuário não existe | ✅ |
| B7 | JWT sem `issuer`/`audience` | `lib/jwt.ts` + assinatura/verificação com issuer+audience | ✅ |
| B8 | Upload: contentType do cliente + blob órfão | MIME derivado da extensão; remoção do blob se falhar escrita no BD | ✅ |
| B9 | Lixo não usado (`App.tsx`, `react.svg`, `vite.svg`, `tw-animate-css`) | Removidos | ✅ |
| B10 | Checklist de senha divergente (`SenhaInput`) | Adicionado "caractere especial" (igual ao backend) | ✅ |
| B11 | "ADMIN Dashboard" duplicado no menu | Renomeado p/ "Painel Admin" | ✅ |
| B12 | Postgres `kinevia/kinevia` no compose | Parametrizado via `${VAR:-default}` + `restart: unless-stopped` + `.dockerignore` | ✅ |
| B13 | CI sem tsc backend/cache | Workflow com `actions/setup-node` cache npm + postgres service | ✅ |
| B14 | `SWAGGER_ENABLED` fora do `.env.example` | Documentado | ✅ |
| B15 | README dizia `sameSite: 'lax'` | Alinhado ao código (`strict`) | ✅ |
| B16 | Infra não versionada | `docker-compose.yml`, Dockerfiles, nginx.conf e CI criados — **pendente: commit** | ⏳ |
| B17 | Prisma 5.x EOL | Upgrade para **6.19.3** + client em `generated/client` + histórico de migrações **squashado** em uma única `init` (dados preservados nos bancos dev e test) | ✅ |
| B18 | Cobertura fraca de agenda (2) e profissional (3) | +4 testes de ciclo de vida de agendamento e +6 de profissional (verificação de senha, lista por clínica, validations) | ✅ |
| B19 | `SECURITY-REVIEW-2026-07-23.md` desatualizado | Novo relatório `SECURITY-REVIEW-2026-09-21.md` | ✅ |

---

## Pendências assumidas (não-bloqueantes)

- **B16:** arquivos de infra já criados no diretório de trabalho — falta o `git add/commit`.
- **C1:** conferir `npm ci --omit=dev` + `prisma generate` dentro do Dockerfile do backend antes do deploy.
- **CSRF:** ainda mitigado apenas por `sameSite: 'strict'` + cookie httpOnly (item registrado no ROADMAP 3.3).

---

## Upgrade Prisma v6 (B17) — como foi feito em 23/09/2026

- **Dependências:** `prisma` e `@prisma/client` `^5.14.0` → `^6.19.3`.
- **Client:** `generator client { output = "../generated/client" }`; imports de `@prisma/client` migrados para `../../generated/client` (9 arquivos) e `generated/` adicionado ao `.gitignore`. Dockerfile do runner copia `/app/generated/` do builder (sem `npx prisma generate` no runner).
- **Squash de migrações:** as **16 migrações antigas foram removidas** e substituídas por **uma única `prisma/migrations/20260923000000_init/migration.sql`** (schema completo, gerada por `prisma migrate diff --from-empty`; validada em banco zerado local antes de aplicar).
- **Dados preservados:** nos bancos `dev` (Supabase) e `test` (local), apenas a tabela de histórico `_prisma_migrations` foi truncada e a nova `init` registrada com `prisma migrate resolve --applied 20260923000000_init`. Backup `pg_dump` antes da operação.
- **`npx prisma migrate deploy`** funciona em banco já existente (marca a init como aplicada). **Para replicar em um banco legado** (ex.: produção já migrado): antes de deployar este código, executar naquele banco `DELETE FROM _prisma_migrations;` e depois `npx prisma migrate resolve --applied 20260923000000_init` — nunca rodar `migrate deploy` sem esse passo (a `init` tentaria recriar tabelas já existentes).
- **`package.json#prisma`** (seed) emite `warn` de deprecation no Prisma 6 (será removido no v7); migrar para `prisma.config.ts` na próxima janela.
- **`npm audit`:** 3 "high" restantes são dev-only (`prisma` CLI → `@prisma/config` → `deepmerge-ts <8`); `@prisma/client` (runtime) não é afetado. Override `deepmerge-ts@^8` evitaria, mas pode quebrar o CLI — aguardando correção upstream.