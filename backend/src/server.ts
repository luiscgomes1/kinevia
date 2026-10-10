import 'dotenv/config'
import logger from './lib/logger'
import app from './app'
import iniciarLembreteJob from './jobs/lembrete.job'

const ENV_VARS = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL', 'COOKIE_SECRET'] as const
const missing = ENV_VARS.filter((v) => !process.env[v])
if (missing.length > 0) {
  logger.error({ missing }, 'Variáveis de ambiente obrigatórias não definidas')
  process.exit(1)
}

// No Vercel (serverless), quem atende as requisições é a própria plataforma
// via `api/index.ts` — aqui o app roda como processo contínuo (local/Docker).
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3333

  app.listen(PORT, () => {
    logger.info({ port: PORT }, '🚀 Kinevia API rodando')
    logger.info(`📚 Documentação da API em http://localhost:${PORT}/docs`)
  })
  iniciarLembreteJob()
}

export default app