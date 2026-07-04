import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validar } from '../middlewares/validate.middleware';
import { atualizarPerfilSchema, trocarSenhaSchema } from '../schemas/profissional.schema';
import {
	buscarPerfil,
	atualizarPerfil,
	trocarSenha,
} from '../controllers/profissional.controller';

const router = Router();

router.get('/me', authenticate, buscarPerfil);
router.put('/me', authenticate, validar(atualizarPerfilSchema), atualizarPerfil);
router.put('/me/senha', authenticate, validar(trocarSenhaSchema), trocarSenha);

export default router;