import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../middlewares/auth.middleware'
import { validar } from '../middlewares/validate.middleware'
import { resumoPeriodo } from '../controllers/relatorio.controller'

const router = Router()

const resumoPeriodoQuery = z.object({
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato deve ser YYYY-MM-DD.'),
  fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato deve ser YYYY-MM-DD.'),
})

router.get('/resumo', authenticate, validar(resumoPeriodoQuery, 'query'), resumoPeriodo)

export default router
