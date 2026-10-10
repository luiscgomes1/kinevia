import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validar } from '../middlewares/validate.middleware';
import {
    atualizarStatusSchema,
    buscarAgendaDiaSchema,
    resumoMesSchema,
} from '../schemas/agenda.schema';
import {
    atualizarStatusAgendamento,
    buscarAgendaDia,
    resumoMes,
} from '../controllers/agenda.controller';

const router = Router();

router.get('/', authenticate, validar(buscarAgendaDiaSchema, 'query'), buscarAgendaDia);
router.get('/resumo-mes', authenticate, validar(resumoMesSchema, 'query'), resumoMes);
router.patch('/agendamentos/:id/status', authenticate, validar(atualizarStatusSchema), atualizarStatusAgendamento);

export default router;