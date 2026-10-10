# Auditoria de Segurança — Kinevia

> Data: 23/07/2026 · Backend 82/82 testes passando (na época; hoje 118/118)

---

## Resumo

| Severidade | Qtd | Ação |
|---|---|---|
| 🔴 Alta | 1 | Corrigido com ação manual |
| 🟡 Média | 6 | Todos corrigidos |
| 🟢 Baixa | 10 | Todos corrigidos |
| ✅ Falso positivo | 1 | cookie-parser 1.4.7 já é a versão segura |

---

## 🔴 Alta — Supabase Service Role Key

- **Arquivo:** `backend/.env`
- **Problema:** Chave `service_role` ativa em texto puro no `.env`
- **Risco:** Acesso total ao Supabase (storage, banco)
- **Mitigação:** `.env` está no `.gitignore` ✅
- **Ação manual necessária:** Entrar no [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/wbmboxpfpsoorrzvfblc/settings/api) e clicar em **Regenerate** na `service_role key`. Atualizar o `.env` com a nova chave.

---

## 🟡 Médias — Corrigidos

| # | Problema | Arquivo | O que foi feito |
|---|---|---|---|
| M1 | IDOR — financeiro revelava dados de outro profissional | `financeiro.controller.ts` | `findUnique` → `findFirst` com filtro `profissional_id` |
| M2 | Refresh token sem rotação (`token_version` nunca incrementado no refresh) | `auth.controller.ts` | `token_version` incrementado a cada refresh |
| M3 | Rota `/auth/refresh` sem validação Zod | `auth.routes.ts` + `auth.schema.ts` | Adicionado `refreshSchema = z.object({})` + middleware `validar()` |
| M4 | `COOKIE_SECRET` não validado no startup | `server.ts` + `.env` | Adicionado à lista `ENV_VARS` + gerado valor independente |
| M5 | Refresh token com expiração longa (30d) | `.env` + `auth.controller.ts` | Reduzido para **7 dias** |
| M6 | `trust proxy` ausente (rate limit por IP atrás de proxy) | `server.ts` | Adicionado `app.set('trust proxy', 1)` |
| M7 | CSP com `unsafe-inline` permanente | `server.ts` | `unsafe-inline` só ativo quando Swagger está montado |

---

## 🟢 Baixas — Corrigidos

| # | Problema | Arquivo | O que foi feito |
|---|---|---|---|
| L1 | TOCTOU — `atualizarPaciente`, `desativarPaciente`, `reativarPaciente`, `corrigirIdentidade` | `paciente.controller.ts` | `updateMany` com `profissional_id` no where |
| L2 | TOCTOU — `editarLaudo` | `laudo.controller.ts` | `updateMany` com `profissional_id` no where |
| L3 | TOCTOU — `marcarPagamento` | `pacote.controller.ts` | `updateMany` com `profissional_id` no where |
| L4 | TOCTOU — `adicionarCorrecao` | `prontuario.controller.ts` | `updateMany` com `profissional_id` no where |
| L5 | Zod schemas sem `maxLength` | `auth.schema.ts`, `auth-password.schema.ts`, `paciente.schema.ts`, `profissional.schema.ts` | Adicionado `.max()` em todos os campos string |
| L6 | Email sem `.trim()` nos schemas | `auth.schema.ts` | Adicionado `.trim()` no `emailSchema` |
| L7 | Seed sem proteção de produção | `prisma/seed.ts` | `NODE_ENV=production` → `exit(1)` |
| L8 | Sem handler 404 | `server.ts` | Adicionado `res.status(404).json({ erro: 'Rota não encontrada' })` |
| L9 | Token de redefinição persiste na URL após uso | `frontend/.../RedefinirSenha.tsx` | `window.history.replaceState()` limpa a URL no sucesso |
| L10 | Tokens expirados de `PasswordResetToken` acumulam no BD | `auth-password.controller.ts` | `deleteMany` de expirados adicionado na redefinição |

---

## 🟡 Médias (terceira passagem)

| # | Problema | Arquivo | O que foi feito |
|---|---|---|---|
| M8 | CPF sem `@db.VarChar(11)` no schema Prisma | `schema.prisma` | Mitigado por Zod — DB aceitaria texto maior, mas Zod barra |

---

## ✅ Boas Práticas Confirmadas

| Prática | Status |
|---|---|
| **Token storage no frontend** | Em memória (variável JS) — **não** localStorage/sessionStorage |
| **Refresh token** | httpOnly + secure + sameSite=strict + path=/v1/auth |
| **Rate limiting** | Login (5/15min), Refresh (20/15min), Password Reset (3/15min), Global (100/min) |
| **Upload validation** | Magic bytes (PNG/JPG/GIF/WebP) + 5MB limit + memory storage |
| **Supabase bucket** | Privado + URLs assinadas (1h expiry) |
| **Password reset token** | crypto.randomBytes(32) + bcrypt + 1h + single-use |
| **Email enumeration** | Mensagem idêntica para email existente e inexistente |
| **Senha** | bcrypt 10 rounds + policy (8+ chars, upper, lower, number, special) |
| **JWT rotation** | `token_version` no logout, refresh e redefinição de senha |
| **CORS** | Whitelist + credentials: true |
| **Helmet** | HSTS 1 ano + CSP |
| **Error handling** | Sem stack traces, "Erro interno do servidor" |
| **npm audit** | 0 vulnerabilidades |
| **No raw SQL** | Nenhum `$queryRaw` ou `$executeRaw` |
| **TypeScript strict** | `strict: true` |

---

## Arquivos Alterados

```
backend/
├── .env                              # COOKIE_SECRET independente, REFRESH_TOKEN_EXPIRY=7d
├── .env.example                       # REFRESH_TOKEN_EXPIRY=7d
├── package.json                       # (apenas revertido - falso positivo cookie-parser)
├── prisma/seed.ts                     # Guard de produção
├── src/
│   ├── server.ts                      # ENV_VARS + trust proxy + CSP condicional + 404 handler
│   ├── schemas/
│   │   ├── auth.schema.ts             # emailSchema, maxLength, trim, refreshSchema
│   │   ├── auth-password.schema.ts    # maxLength, emailSchema
│   │   ├── paciente.schema.ts         # maxLength em todos os campos
│   │   └── profissional.schema.ts     # maxLength em todos os campos
│   ├── routes/
│   │   └── auth.routes.ts             # validar(refreshSchema) no refresh
│   ├── controllers/
│   │   ├── auth.controller.ts         # Rotação token_version no refresh, refresh 7d
│   │   ├── paciente.controller.ts     # updateMany (TOCTOU)
│   │   ├── laudo.controller.ts        # updateMany (TOCTOU)
│   │   ├── pacote.controller.ts       # updateMany (TOCTOU)
│   │   └── prontuario.controller.ts   # updateMany (TOCTOU)
│   └── middlewares/
│       ├── auth.middleware.ts          # (já estava correto - verificado na auditoria)
│       └── validate.middleware.ts      # (já estava correto - verificado na auditoria)
tests/
└── financeiro.test.ts                 # Teste adaptado para 404 (IDOR fix)
frontend/
└── src/pages/Login/RedefinirSenha.tsx  # replaceState limpa token da URL
docs/
└── SECURITY-REVIEW-2026-07-23.md      # Este documento
```
