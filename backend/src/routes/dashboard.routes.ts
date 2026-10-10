import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { validar } from '../middlewares/validate.middleware'
import { resumoDashboard } from '../controllers/dashboard.controller'

const router = Router()

const dashboardQuery = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato deve ser YYYY-MM-DD.'),
  profissional_id: z.string().uuid().optional(),
})

router.get('/resumo', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN', 'ATENDENTE'), validar(dashboardQuery, 'query'), resumoDashboard)

export default router
