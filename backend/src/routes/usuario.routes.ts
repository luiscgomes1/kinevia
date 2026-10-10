import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validar } from '../middlewares/validate.middleware';
import { criarUsuarioSchema, atualizarUsuarioSchema } from '../schemas/usuario.schema';
import {
  listarUsuarios,
  buscarUsuario,
  criarUsuario,
  atualizarUsuario,
  removerUsuario,
  reenviarConvite,
} from '../controllers/usuario.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/', listarUsuarios);
router.get('/:id', buscarUsuario);
router.post('/', validar(criarUsuarioSchema), criarUsuario);
router.put('/:id', validar(atualizarUsuarioSchema), atualizarUsuario);
router.delete('/:id', removerUsuario);
router.post('/:id/reenviar-convite', reenviarConvite);

export default router;
