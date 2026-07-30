import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.middleware";
import { validar } from "../middlewares/validate.middleware";
import {
  criarPacienteSchema,
  atualizarPacienteSchema,
  corrigirIdentidadeSchema,
} from "../schemas/paciente.schema";
import {
  listarPacientes,
  buscarPaciente,
  criarPaciente,
  atualizarPaciente,
  desativarPaciente,
  reativarPaciente,
  corrigirIdentidade,
} from "../controllers/paciente.controller";

const router = Router();

const listarPacientesQuery = z.object({
  busca: z.string().optional(),
  incluirInativos: z.enum(['true']).optional(),
})

router.get("/", authenticate, validar(listarPacientesQuery, 'query'), listarPacientes);
router.get("/:id", authenticate, buscarPaciente);
router.post("/", authenticate, validar(criarPacienteSchema), criarPaciente);
router.put("/:id", authenticate, validar(atualizarPacienteSchema), atualizarPaciente);
router.delete("/:id", authenticate, desativarPaciente);
router.patch("/:id/identidade", authenticate, validar(corrigirIdentidadeSchema), corrigirIdentidade);
router.patch("/:id/reativar", authenticate, reativarPaciente);

export default router;