import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validar } from '../middlewares/validate.middleware';
import {
    criarAgendamentoSchema,
    atualizarStatusSchema,
} from '../schemas/agenda.schema';
import {
    atualizarStatusAgendamento,
    buscarAgendaDia,
    criarAgendamento,
} from '../controllers/agenda.controller';

const router = Router();

router.get('/', authenticate, buscarAgendaDia);
router.post('/agendamentos', authenticate, validar(criarAgendamentoSchema), criarAgendamento);
router.patch('/agendamentos/:id/status', authenticate, validar(atualizarStatusSchema), atualizarStatusAgendamento);

export default router;