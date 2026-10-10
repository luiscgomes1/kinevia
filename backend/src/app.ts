import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'
import 'dotenv/config'
import 'express-async-errors'

import { swaggerSpec } from './config/swagger'
import { FRONTEND_URL } from './lib/config'
import { globalApiRateLimiter } from './middlewares/rateLimit.middleware'
import erroMiddleware from './middlewares/error.middleware'

import authRoutes from './routes/auth.routes'
import usuarioRoutes from './routes/usuario.routes'
import adminRoutes from './routes/admin.routes'
import profissionalRoutes from './routes/profissional.routes'
import pacienteRoutes from './routes/paciente.routes'
import agendaRoutes from './routes/agenda.routes'
import prontuarioRoutes from './routes/prontuario.routes'
import evolucaoRoutes from './routes/evolucao.routes'
import pacoteRoutes from './routes/pacote.routes'
import pacoteItemRoutes from './routes/pacoteItem.routes'
import laudoRoutes from './routes/laudo.routes'
import laudoItemRoutes from './routes/laudoItem.routes'
import financeiroRoutes from './routes/financeiro.routes'
import relatorioRoutes from './routes/relatorio.routes'
import dashboardRoutes from './routes/dashboard.routes'
import notificacaoRoutes from './routes/notificacao.routes'
import cronRoutes from './routes/cron.routes'

const app = express()

const swaggerHabilitado = process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true'

app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", ...(swaggerHabilitado ? ["'unsafe-inline'"] : [])],
      styleSrc: ["'self'", ...(swaggerHabilitado ? ["'unsafe-inline'"] : [])],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}))

const origensPermitidas = [
  'http://localhost:5173',
  FRONTEND_URL,
].filter((origem): origem is string => Boolean(origem))

app.use(cors({
  origin: origensPermitidas,
  credentials: true,
}))

app.set('trust proxy', 1)
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(express.json({ limit: '1mb' }))

// Rate limiter global: protege todas as rotas contra abuso
app.use(globalApiRateLimiter)


app.get('/health', (req, res) => {
  res.json({ status: 'ok', project: 'Kinevia API' })
})

app.get('/v1/privacidade', (_req, res) => {
  res.json({
    politica: 'https://github.com/anomalyco/kinevia/docs/PRIVACY-POLICY.md',
    contato: 'Contate o profissional de saúde responsável pelo seu atendimento.',
    atualizacao: '2026-07-23',
  })
})

// Documentação interativa da API (Swagger) — apenas em dev ou se explicitamente ativado
if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}

// Rotas da API (versionadas)
app.use('/v1/auth', authRoutes)
app.use('/v1/usuarios', usuarioRoutes)
app.use('/v1/admin', adminRoutes)
app.use('/v1/profissional', profissionalRoutes)
app.use('/v1/pacientes', pacienteRoutes)
app.use('/v1/agenda', agendaRoutes)
app.use('/v1/pacientes/:id', prontuarioRoutes)
app.use('/v1/evolucoes', evolucaoRoutes)
app.use('/v1/pacientes/:id', pacoteRoutes)
app.use('/v1/pacotes', pacoteItemRoutes)
app.use('/v1/pacientes/:id', laudoRoutes)
app.use('/v1/laudos', laudoItemRoutes)
app.use('/v1/financeiro', financeiroRoutes)
app.use('/v1/relatorios', relatorioRoutes)
app.use('/v1/dashboard', dashboardRoutes)
app.use('/v1/notificacoes', notificacaoRoutes)

// Rota de cron (Vercel Cron Job) — protegida por CRON_SECRET
app.use(cronRoutes)


app.use((_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' })
})

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  erroMiddleware(err, req, res, next)
})

export default app