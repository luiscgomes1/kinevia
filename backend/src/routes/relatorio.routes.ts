import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { validar } from '../middlewares/validate.middleware'
import { resumoPeriodo, comparativoPeriodo } from '../controllers/relatorio.controller'

const router = Router()

const periodoQuery = z.object({
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato deve ser YYYY-MM-DD.'),
  fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato deve ser YYYY-MM-DD.'),
  profissional_id: z.string().uuid().optional(),
})

router.get('/resumo', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), validar(periodoQuery, 'query'), resumoPeriodo)
router.get('/comparativo', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), validar(periodoQuery, 'query'), comparativoPeriodo)

export default router
