import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  listarNotificacoes,
  notificacoesNaoLidas,
  marcarLida,
  marcarTodasLidas,
} from '../controllers/notificacao.controller';

const router = Router();

router.get('/', authenticate, listarNotificacoes);
router.get('/nao-lidas', authenticate, notificacoesNaoLidas);
router.patch('/:id/ler', authenticate, marcarLida);
router.patch('/ler-todas', authenticate, marcarTodasLidas);

export default router;
