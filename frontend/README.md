# Kinevia — Frontend

SPA em **React 19 + Vite + TypeScript** com shadcn/ui, Tailwind CSS e react-hook-form.

> Visão geral completa do projeto (stack, setup, backend): ver [README](../README.md).

## Stack

| Área | Tecnologia |
|------|------------|
| Framework | React 19 + Vite 8 + TypeScript |
| UI | shadcn/ui + Radix + Tailwind CSS |
| Formulários | react-hook-form + Zod (`lib/schemas`) |
| Rotas | react-router-dom 7 |
| Gráficos | Recharts |
| Calendário | React DayPicker |
| Notificações | sonner (toasts) |
| Testes | Vitest + happy-dom |
| Estado | Context API (auth/agenda) + estado local |

## Scripts

```bash
npm run dev          # Dev server (http://localhost:5173)
npm run build        # Build de produção (tsc -b && vite build)
npm run preview      # Pré-visualizar o build
npm run lint         # ESLint
npm run test         # Vitest (watch)
npm run test:run     # Vitest (1x)
```

> Typecheck separado: `npx tsc -b --noEmit` (o `build` já roda `tsc -b`).

## Estrutura

```
src/
├── components/          # Layout/, ui/ (shadcn), RotaProtegida, RotaConfiguracoes,
│                        # NotificacaoPopover, SenhaInput, RouteError
├── hooks/               # useProfissional, useProfissionais (select por papel), useNotificacoes (polling), useSetupCheck, useSenhaValida
├── lib/
│   ├── schemas/         # Zod schemas (auth, paciente, profissional)
│   ├── __tests__/       # Testes de utilitários e schemas
│   ├── api.ts           # Axios + interceptors (refresh automático)
│   └── utils.ts, masks.ts, data.ts, pacotes.ts, senha.ts
├── pages/
│   ├── Login/           # Login, EsqueciSenha, RedefinirSenha, TrocarSenha, Privacidade
│   ├── Dashboard/       # Posto de comando: cards por perfil, próximos agendamentos, gráficos (Recharts)
│   ├── Agenda/          # Visões diária/semanal/mensal + modais (AgendaContext)
│   ├── Pacientes/       # Lista, Novo, Editar, Perfil (4 abas)
│   ├── Financeiro/
│   ├── Relatorios/
│   ├── Configuracoes/
│   └── Admin/           # Dashboard admin, Usuarios, Auditoria, ClinicaDetalhe
├── types/               # api.ts (Role), laudos.ts (conteúdos dos 3 tipos)
├── router.tsx           # Rotas + guards
└── App.tsx, main.tsx
```

## Autenticação

- Access token em memória + refresh token em cookie httpOnly
- `lib/api.ts` faz refresh automático em 401
- Guard `RotaProtegida` exige sessão e redireciona para `/trocar-senha` se a senha
  for temporária
- `RotaConfiguracoes` bloqueia `/configuracoes` para ATENDENTE
- Menu lateral condiciona itens pela role (SUPER_ADMIN/ADMIN/PROFISSIONAL/ATENDENTE)

## Testes

```bash
npm run test:run   # 89 testes
```

Cobertura atual: schemas de validação, utilitários (masks, data, pacotes, senha),
componentes, `services/api.ts` (interceptor 401/refresh/retry/redirect), guards de rota
(`RotaAdmin`, `RotaConfiguracoes`, `RotaProtegida`), cache do `useProfissional` e filtro
do `useProfissionais`.
Pendência: MSW + testes de integração de páginas (login ↔ endpoint).
