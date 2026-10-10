import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validar } from '../middlewares/validate.middleware';
import { resumo, dashboardClinica, listarClinicas, buscarClinica, criarClinica, atualizarClinica, excluirClinica } from '../controllers/admin.controller';
import { listarAuditoria, exportarAuditoria } from '../controllers/audit.controller';

const router = Router();

const clinicaSchema = z.object({
  nome: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres.').max(255),
});

router.use(authenticate);

router.get('/auditoria', authorize('ADMIN', 'SUPER_ADMIN'), listarAuditoria);
router.get('/auditoria/exportar', authorize('ADMIN', 'SUPER_ADMIN'), exportarAuditoria);
router.get('/dashboard-clinica', authorize('ADMIN', 'SUPER_ADMIN'), dashboardClinica);

router.use(authorize('SUPER_ADMIN'));

router.get('/resumo', resumo);
router.get('/clinicas', listarClinicas);
router.get('/clinicas/:id', buscarClinica);
router.post('/clinicas', validar(clinicaSchema), criarClinica);
router.put('/clinicas/:id', validar(clinicaSchema), atualizarClinica);
router.delete('/clinicas/:id', excluirClinica);

export default router;
