import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validar } from "../middlewares/validate.middleware";
import {
  criarPacienteSchema,
  atualizarPacienteSchema,
  corrigirIdentidadeSchema,
  transferirPacienteSchema,
} from "../schemas/paciente.schema";
import {
  listarPacientes,
  buscarPaciente,
  criarPaciente,
  atualizarPaciente,
  desativarPaciente,
  reativarPaciente,
  deletarPaciente,
  corrigirIdentidade,
  transferirPaciente,
  historicoPaciente,
  exportarPaciente,
  anonimizarPaciente,
} from "../controllers/paciente.controller";

const router = Router();

const listarPacientesQuery = z.object({
  busca: z.string().optional(),
  incluirInativos: z.enum(['true']).optional(),
})

router.get("/", authenticate, validar(listarPacientesQuery, 'query'), listarPacientes);
router.get("/:id", authenticate, buscarPaciente);
router.post("/", authenticate, validar(criarPacienteSchema), criarPaciente);
router.put("/:id", authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), validar(atualizarPacienteSchema), atualizarPaciente);
router.delete("/:id", authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), desativarPaciente);
router.post("/:id/remover", authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), deletarPaciente);
router.patch("/:id/identidade", authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), validar(corrigirIdentidadeSchema), corrigirIdentidade);
router.patch("/:id/reativar", authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), reativarPaciente);
router.get("/:id/exportar", authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), exportarPaciente);
router.post("/:id/anonimizar", authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), anonimizarPaciente);
router.post("/:id/transferir", authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validar(transferirPacienteSchema), transferirPaciente);
router.get("/:id/historico", authenticate, authorize('ADMIN', 'PROFISSIONAL', 'SUPER_ADMIN'), historicoPaciente);

export default router;