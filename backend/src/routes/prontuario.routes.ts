import {  Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
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

router.get('/prontuario', authenticate, buscarProntuario);
router.put('/prontuario', authenticate, validar(salvarProntuarioSchema), salvarProntuario);
router.post('/evolucoes', authenticate, validar(adicionarEvolucaoSchema), adicionarEvolucao);

export default router;