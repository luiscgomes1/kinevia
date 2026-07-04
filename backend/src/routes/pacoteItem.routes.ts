import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { validar } from '../middlewares/validate.middleware'
import { adicionarSessaoSchema, marcarPagamentoSchema } from '../schemas/pacote.schema'
import {
  adicionarSessao,
  marcarPagamento,
} from '../controllers/pacote.controller'

const router = Router()

router.post('/:id/sessoes', authenticate, validar(adicionarSessaoSchema), adicionarSessao)
router.patch('/:id/pagamento', authenticate, validar(marcarPagamentoSchema), marcarPagamento)

export default router