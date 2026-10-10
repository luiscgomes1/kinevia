import { Router } from 'express'
import { executarLembretes } from '../jobs/lembrete.job'

const router = Router()

// Chamado pelo Vercel Cron Job a cada 30 minutos.
// Protegido por CRON_SECRET: a Vercel envia `Authorization: Bearer <CRON_SECRET>`.
router.post('/cron/lembrete', async (req, res) => {
  const esperado = process.env.CRON_SECRET
  if (!esperado) {
    return res.status(503).json({ erro: 'CRON_SECRET não configurado.' })
  }

  if (req.headers.authorization !== `Bearer ${esperado}`) {
    return res.status(401).json({ erro: 'Não autorizado.' })
  }

  const resultado = await executarLembretes()
  return res.json(resultado)
})

export default router