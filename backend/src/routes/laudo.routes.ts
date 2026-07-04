import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { validar } from '../middlewares/validate.middleware'
import { criarLaudoSchema } from '../schemas/laudo.schema'
import {
    criarLaudo,
    listarLaudos,
} from '../controllers/laudo.controller'

const router = Router({ mergeParams: true })

router.post('/laudos', authenticate, validar(criarLaudoSchema), criarLaudo)
router.get('/laudos', authenticate, listarLaudos)

export default router