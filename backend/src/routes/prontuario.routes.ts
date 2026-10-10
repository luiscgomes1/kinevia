import {  Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validar } from '../middlewares/validate.middleware';
import {
    salvarProntuarioSchema,
    adicionarEvolucaoSchema,
} from '../schemas/prontuario.schema';
import {
    buscarProntuario,
    salvarProntuario,
    adicionarEvolucao,
} from '../controllers/prontuario.controller';

const router = Router({  mergeParams: true });

router.get('/prontuario', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), buscarProntuario);
router.put('/prontuario', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), validar(salvarProntuarioSchema), salvarProntuario);
router.post('/evolucoes', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), validar(adicionarEvolucaoSchema), adicionarEvolucao);

export default router;