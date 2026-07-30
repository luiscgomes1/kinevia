import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../middlewares/auth.middleware'
import { validar } from '../middlewares/validate.middleware'
import {
    resumoFinanceiro,
    financeiroPorPaciente,
    financeiroPacienteId,
} from '../controllers/financeiro.controller'

const router = Router()

const mesAnoQuery = z.object({
  mes: z.string().regex(/^(1[0-2]|[1-9])$/).optional(),
  ano: z.string().regex(/^\d{4}$/).optional(),
})

router.get('/', authenticate, validar(mesAnoQuery, 'query'), resumoFinanceiro)
router.get('/pacientes', authenticate, validar(mesAnoQuery, 'query'), financeiroPorPaciente)
router.get('/pacientes/:id', authenticate, validar(mesAnoQuery, 'query'), financeiroPacienteId)

export default router