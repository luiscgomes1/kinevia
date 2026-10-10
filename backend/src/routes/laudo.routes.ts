import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { validar } from '../middlewares/validate.middleware'
import { criarLaudoSchema } from '../schemas/laudo.schema'
import {
    criarLaudo,
    listarLaudos,
} from '../controllers/laudo.controller'

const router = Router({ mergeParams: true })

router.post('/laudos', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), validar(criarLaudoSchema), criarLaudo)
router.get('/laudos', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), listarLaudos)

export default router