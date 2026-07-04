import { Router } from "express";
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

router.get("/", authenticate, listarPacientes);
router.get("/:id", authenticate, buscarPaciente);
router.post("/", authenticate, validar(criarPacienteSchema), criarPaciente);
router.put("/:id", authenticate, validar(atualizarPacienteSchema), atualizarPaciente);
router.delete("/:id", authenticate, desativarPaciente);
router.patch("/:id/identidade", authenticate, validar(corrigirIdentidadeSchema), corrigirIdentidade);
router.patch("/:id/reativar", authenticate, reativarPaciente);

export default router;