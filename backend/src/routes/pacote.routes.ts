import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { validar } from '../middlewares/validate.middleware'
import { criarPacoteSchema } from '../schemas/pacote.schema'
import {
    criarPacote,
    listarPacotes
} from '../controllers/pacote.controller'

const router = Router({ mergeParams: true })

router.post('/pacotes', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN', 'ATENDENTE'), validar(criarPacoteSchema), criarPacote)
router.get('/pacotes', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN', 'ATENDENTE'), listarPacotes)

export default router