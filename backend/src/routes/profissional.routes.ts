import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validar } from '../middlewares/validate.middleware';
import { uploadImagem } from '../middlewares/upload.middleware';
import { verificarSenhaRateLimiter } from '../middlewares/rateLimit.middleware';
import { atualizarPerfilSchema, trocarSenhaSchema, verificarSenhaSchema, alterarEmailSchema } from '../schemas/profissional.schema';
import {
	buscarPerfil,
	atualizarPerfil,
	trocarSenha,
	alterarEmail,
	listarProfissionais,
	verificarSenha,
	exportarDados,
} from '../controllers/profissional.controller';
import {
	uploadAssinatura,
	uploadLogo,
} from '../controllers/storage.controller';

const router = Router();

router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), listarProfissionais);
router.get('/me', authenticate, buscarPerfil);
router.put('/me', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), validar(atualizarPerfilSchema), atualizarPerfil);
router.put('/me/senha', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), validar(trocarSenhaSchema), trocarSenha);
router.post('/me/verificar-senha', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), verificarSenhaRateLimiter, validar(verificarSenhaSchema), verificarSenha);
router.put('/me/email', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), validar(alterarEmailSchema), alterarEmail);
router.post('/me/assinatura', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), uploadImagem.single('imagem'), uploadAssinatura);
router.post('/me/logo', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), uploadImagem.single('imagem'), uploadLogo);
router.get('/me/exportar-dados', authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), exportarDados);

export default router;