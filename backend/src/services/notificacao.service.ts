import prisma from '../lib/prisma';
import type { Role } from '../../generated/client';

type TipoNotificacao = 'PACIENTE_TRANSFERIDO' | 'PACIENTE_CADASTRADO' | 'NOVO_PROFISSIONAL' | 'SESSAO_CANCELADA';

export async function criarNotificacao(
  profissionalId: string,
  tipo: TipoNotificacao,
  titulo: string,
  mensagem: string,
) {
  await prisma.notificacao.create({
    data: {
      profissional_id: profissionalId,
      tipo,
      titulo,
      mensagem,
    },
  });
}

export async function notificarAdminsDaClinica(
  clinicaId: string,
  tipo: TipoNotificacao,
  titulo: string,
  mensagem: string,
  ignorarIds: string[] = [],
) {
  const onde = ignorarIds.length > 0
    ? { clinica_id: clinicaId, role: 'ADMIN' as Role, id: { notIn: ignorarIds } }
    : { clinica_id: clinicaId, role: 'ADMIN' as Role };

  const admins = await prisma.profissional.findMany({
    where: onde,
    select: { id: true },
  });

  if (admins.length === 0) return;

  await prisma.notificacao.createMany({
    data: admins.map((admin) => ({
      profissional_id: admin.id,
      tipo,
      titulo,
      mensagem,
    })),
  });
}
