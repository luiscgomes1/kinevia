import { Router } from 'express';
import { login, refreshToken, logout, register } from '../controllers/auth.controller';
import { esqueciSenha, redefinirSenha } from '../controllers/auth-password.controller';
import { loginRateLimiter, refreshRateLimiter, registerRateLimiter, passwordResetRateLimiter } from '../middlewares/rateLimit.middleware';
import { validar } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { loginSchema, registerSchema, refreshSchema } from '../schemas/auth.schema';
import { esqueciSenhaSchema, redefinirSenhaSchema } from '../schemas/auth-password.schema';

const router = Router();

router.post('/register', registerRateLimiter, validar(registerSchema), register);
router.post('/login', loginRateLimiter, validar(loginSchema), login);
router.post('/refresh', refreshRateLimiter, validar(refreshSchema), refreshToken);
router.post('/logout', authenticate, logout);
router.post('/esqueci-senha', passwordResetRateLimiter, validar(esqueciSenhaSchema), esqueciSenha);
router.post('/redefinir-senha', passwordResetRateLimiter, validar(redefinirSenhaSchema), redefinirSenha);

export default router;
