import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import 'dotenv/config'

import authRoutes from './routes/auth.routes'
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

const app = express()

app.use(helmet())

const origensPermitidas = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter((origem): origem is string => Boolean(origem))

app.use(cors({
  origin: origensPermitidas,
  credentials: true,
}))

app.use(express.json({ limit: '1mb' }))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', project: 'FisioGest API' })
})

app.use('/auth', authRoutes)
app.use('/profissional', profissionalRoutes)
app.use('/pacientes', pacienteRoutes)
app.use('/agenda', agendaRoutes)
app.use('/pacientes/:id', prontuarioRoutes)
app.use('/evolucoes', evolucaoRoutes)
app.use('/pacientes/:id', pacoteRoutes)
app.use('/pacotes', pacoteItemRoutes)
app.use('/pacientes/:id', laudoRoutes)
app.use('/laudos', laudoItemRoutes)
app.use('/financeiro', financeiroRoutes)

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', err)

  res.status(500).json({ error: 'Erro interno do servidor' })
})

const PORT = process.env.PORT || 3333

app.listen(PORT, () => {
  console.log(`🚀 FisioGest API rodando em http://localhost:${PORT}`)
})
