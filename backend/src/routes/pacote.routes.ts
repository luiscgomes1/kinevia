import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { validar } from '../middlewares/validate.middleware'
import { criarPacoteSchema } from '../schemas/pacote.schema'
import {
    criarPacote,
    listarPacotes
} from '../controllers/pacote.controller'

const router = Router({ mergeParams: true })

router.post('/pacotes', authenticate, validar(criarPacoteSchema), criarPacote)
router.get('/pacotes', authenticate, listarPacotes)

export default router