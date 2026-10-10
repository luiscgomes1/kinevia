# Gerenciamento de Segredos — Kinevia

## Princípio

Nenhum segredo (senha, chave de API, token) deve estar em arquivo versionado
no repositório. O arquivo `.env` existe apenas para desenvolvimento local e
está no `.gitignore`.

## Produção

As variáveis de ambiente são injetadas **pela plataforma de deploy**, nunca
por arquivo. Cada plataforma tem seu mecanismo:

| Plataforma | Como injetar |
|---|---|
| **Railway** | Dashboard → Variables → Add |
| **Render** | Dashboard → Environment → Environment Variables |
| **Fly.io** | `fly secrets set NOME=valor` |
| **Docker** | `-e NOME=valor` ou arquivo `.env` externo ao container |

## Variáveis obrigatórias

```bash
# Banco de dados
DATABASE_URL="postgresql://usuario:senha@host:5432/postgres"

# Assinatura de cookies
COOKIE_SECRET="<openssl rand -hex 32>"

# JWT
JWT_SECRET="<openssl rand -hex 32>"
JWT_REFRESH_SECRET="<openssl rand -hex 32>"

# Supabase Storage
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service_role key>"
SUPABASE_STORAGE_BUCKET="kinevia"

# Frontend (para CORS)
FRONTEND_URL="https://seu-dominio.com"
```

## Variáveis opcionais

```bash
# SMTP (email de redefinição de senha, lembretes)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE="false"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"
SMTP_FROM="noreply@kinevia.app"
```

## Recomendações

1. **Gire as chaves** periodicamente (a cada 6 meses)
2. **Use segredos diferentes** para cada ambiente (dev, staging, prod)
3. **Nunca compartilhe** `.env` por mensagem, email ou chat
4. **Nunca cole** valores de produção em logs, screenshots ou issues
5. **Considere Doppler** como camada adicional: um único token `DOPPLER_TOKEN`
   injetado na plataforma, e todas as outras vars resolvidas via SDK do
   Doppler em tempo real
