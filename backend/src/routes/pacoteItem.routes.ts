import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { validar } from '../middlewares/validate.middleware'
import { adicionarSessaoSchema, marcarPagamentoSchema } from '../schemas/pacote.schema'
import {
  adicionarSessao,
  marcarPagamento,
  deletarPacote,
} from '../controllers/pacote.controller'

const router = Router()

router.post('/:id/sessoes', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN', 'ATENDENTE'), validar(adicionarSessaoSchema), adicionarSessao)
router.patch('/:id/pagamento', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN', 'ATENDENTE'), validar(marcarPagamentoSchema), marcarPagamento)
router.delete('/:id', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN', 'ATENDENTE'), deletarPacote)

export default router