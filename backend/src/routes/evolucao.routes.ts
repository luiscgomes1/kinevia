import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validar } from '../middlewares/validate.middleware';
import { adicionarCorrecaoSchema } from '../schemas/prontuario.schema';
import { adicionarCorrecao } from '../controllers/prontuario.controller';

const router = Router();

router.patch('/:id/correcao', authenticate, validar(adicionarCorrecaoSchema), adicionarCorrecao);

export default router;