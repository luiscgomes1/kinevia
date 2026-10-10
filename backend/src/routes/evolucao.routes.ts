import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validar } from '../middlewares/validate.middleware';
import { adicionarCorrecaoSchema } from '../schemas/prontuario.schema';
import { adicionarCorrecao } from '../controllers/prontuario.controller';

const router = Router();

router.patch('/:id/correcao', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), validar(adicionarCorrecaoSchema), adicionarCorrecao);

export default router;