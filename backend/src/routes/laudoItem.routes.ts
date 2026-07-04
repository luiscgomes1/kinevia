import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { validar } from '../middlewares/validate.middleware'
import { editarLaudoSchema } from '../schemas/laudo.schema'
import {
    buscarLaudo,
    editarLaudo,
    gerarPDF,
} from '../controllers/laudo.controller'

const router = Router()

router.get('/:id', authenticate, buscarLaudo)
router.put('/:id', authenticate, validar(editarLaudoSchema), editarLaudo)
router.get('/:id/pdf', authenticate, gerarPDF)

export default router