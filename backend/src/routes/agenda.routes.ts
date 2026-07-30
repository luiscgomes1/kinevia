import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validar } from '../middlewares/validate.middleware';
import {
    criarAgendamentoSchema,
    atualizarStatusSchema,
    buscarAgendaDiaSchema,
    resumoMesSchema,
} from '../schemas/agenda.schema';
import {
    atualizarStatusAgendamento,
    buscarAgendaDia,
    criarAgendamento,
    resumoMes,
} from '../controllers/agenda.controller';

const router = Router();

router.get('/', authenticate, validar(buscarAgendaDiaSchema, 'query'), buscarAgendaDia);
router.get('/resumo-mes', authenticate, validar(resumoMesSchema, 'query'), resumoMes);
router.post('/agendamentos', authenticate, validar(criarAgendamentoSchema), criarAgendamento);
router.patch('/agendamentos/:id/status', authenticate, validar(atualizarStatusSchema), atualizarStatusAgendamento);

export default router;