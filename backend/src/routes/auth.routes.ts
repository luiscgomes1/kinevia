import { Router } from 'express';
import { login, refreshToken } from '../controllers/auth.controller';
import { loginRateLimiter } from '../middlewares/rateLimit.middleware';
import { validar } from '../middlewares/validate.middleware';
import { loginSchema, refreshSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/login', loginRateLimiter, validar(loginSchema), login);
router.post('/refresh', validar(refreshSchema), refreshToken);

export default router;