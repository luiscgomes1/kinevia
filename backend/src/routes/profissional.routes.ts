import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validar } from '../middlewares/validate.middleware';
import { uploadImagem } from '../middlewares/upload.middleware';
import { atualizarPerfilSchema, trocarSenhaSchema, verificarSenhaSchema } from '../schemas/profissional.schema';
import {
	buscarPerfil,
	atualizarPerfil,
	trocarSenha,
	verificarSenha,
} from '../controllers/profissional.controller';
import {
	uploadAssinatura,
	uploadLogo,
} from '../controllers/storage.controller';

const router = Router();

router.get('/me', authenticate, buscarPerfil);
router.put('/me', authenticate, validar(atualizarPerfilSchema), atualizarPerfil);
router.put('/me/senha', authenticate, validar(trocarSenhaSchema), trocarSenha);
router.post('/me/verificar-senha', authenticate, validar(verificarSenhaSchema), verificarSenha);
router.post('/me/assinatura', authenticate, uploadImagem.single('imagem'), uploadAssinatura);
router.post('/me/logo', authenticate, uploadImagem.single('imagem'), uploadLogo);

export default router;