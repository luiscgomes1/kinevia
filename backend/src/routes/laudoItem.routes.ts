import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { validar } from '../middlewares/validate.middleware'
import { editarLaudoSchema } from '../schemas/laudo.schema'
import {
    buscarLaudo,
    editarLaudo,
    excluirLaudo,
    gerarPDF,
    gerarDeclaracaoSessoes,
} from '../controllers/laudo.controller'

const router = Router()

router.get('/:id', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), buscarLaudo)
router.put('/:id', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), validar(editarLaudoSchema), editarLaudo)
router.delete('/:id', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), excluirLaudo)
router.get('/:id/pdf', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), gerarPDF)
router.get('/:id/declaracao-sessoes', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), gerarDeclaracaoSessoes)

export default router