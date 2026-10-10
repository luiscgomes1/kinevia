import prisma from "../lib/prisma";

export const LIMITE_SESSOES = {
  INDIVIDUAL: 1,
  PACOTE_5: 5,
  PACOTE_10: 10,
} as const;

type TipoPacote = keyof typeof LIMITE_SESSOES;

interface SessaoInput {
  data: string;
  horario: string;
  slot: number;
  tipo?: string;
}

interface CriarPacoteInput {
  paciente_id: string;
  profissional_id: string;
  clinica_id: string | null;
  tipo: TipoPacote;
  valor_cobrado: number;
  status_pagamento?: "AGUARDANDO" | "PAGO";
  sessoes?: SessaoInput[];
}

export async function criarPacoteComSessoes(input: CriarPacoteInput) {
  const {
    paciente_id,
    profissional_id,
    clinica_id,
    tipo,
    valor_cobrado,
    status_pagamento,
    sessoes = [],
  } = input;

  const limite = LIMITE_SESSOES[tipo];

  if (sessoes.length > limite) {
    throw new Error(
      `Um pacote do tipo ${tipo} aceita no máximo ${limite} sessão(ões). Você enviou ${sessoes.length}.`,
    );
  }

  const resultado = await prisma.$transaction(async (tx) => {
    if (sessoes.length > 0) {
      const conditions = sessoes.map((s) => ({
        profissional_id,
        data: new Date(s.data),
        horario: s.horario,
        slot: s.slot,
        status: { not: 'DESMARCOU' as const },
      }))

      const ocupados = await tx.agendamento.findMany({
        where: { OR: conditions },
        select: { data: true, horario: true, slot: true },
      })

      if (ocupados.length > 0) {
        const primeiro = ocupados[0]
        throw new Error(
          `O slot ${primeiro.slot} no horário ${primeiro.horario} do dia ${primeiro.data.toISOString().split('T')[0]} já está ocupado para o profissional.`,
        )
      }
    }

    const pacote = await tx.pacote.create({
      data: {
        paciente_id,
        profissional_id,
        clinica_id,
        tipo,
        quantidade_sessoes: limite,
        valor_cobrado,
        status_pagamento: status_pagamento || "AGUARDANDO",
      },
    });

    const sessoesCriadas = [];

    for (const sessao of sessoes) {
      const agendamento = await tx.agendamento.create({
        data: {
          paciente_id,
          profissional_id,
          clinica_id,
          data: new Date(sessao.data),
          horario: sessao.horario,
          slot: sessao.slot,
          tipo: (sessao.tipo as "AVALIACAO" | "SESSAO" | "REPOSICAO") || "SESSAO",
        },
      });

      const sessaoPacote = await tx.sessaoPacote.create({
        data: {
          pacote_id: pacote.id,
          agendamento_id: agendamento.id,
        },
      });

      sessoesCriadas.push({ agendamento, sessaoPacote });
    }

    return { pacote, sessoes: sessoesCriadas };
  });

  return resultado;
}

interface AdicionarSessaoInput {
  pacote_id: string;
  profissional_id: string;
  paciente_id: string;
  clinica_id: string | null;
  sessao: SessaoInput;
}

export async function adicionarSessaoAoPacote(input: AdicionarSessaoInput) {
  const { pacote_id, profissional_id, paciente_id, clinica_id, sessao } = input;

  const resultado = await prisma.$transaction(async (tx) => {
    const slotOcupado = await tx.agendamento.findFirst({
      where: {
        profissional_id,
        data: new Date(sessao.data),
        horario: sessao.horario,
        slot: sessao.slot,
        status: { not: 'DESMARCOU' },
      },
    });

    if (slotOcupado) {
      throw new Error(
        `O slot ${sessao.slot} no horário ${sessao.horario} do dia ${sessao.data} já está ocupado para o profissional.`,
      );
    }
    const pacoteAtual = await tx.pacote.findUnique({
      where: { id: pacote_id },
      include: { sessoes: true },
    });

    if (!pacoteAtual) {
      throw new Error("Pacote não encontrado.");
    }

    const limite = pacoteAtual.quantidade_sessoes;
    if (pacoteAtual.sessoes.length >= limite) {
      throw new Error(
        `O pacote do tipo ${pacoteAtual.tipo} já atingiu o limite de ${limite} sessão(ões).`,
      );
    }

    const agendamento = await tx.agendamento.create({
      data: {
        paciente_id,
        profissional_id,
        clinica_id,
        data: new Date(sessao.data),
        horario: sessao.horario,
        slot: sessao.slot,
        tipo: (sessao.tipo as "AVALIACAO" | "SESSAO" | "REPOSICAO") || "SESSAO",
      },
    });

    const sessaoPacote = await tx.sessaoPacote.create({
      data: {
        pacote_id,
        agendamento_id: agendamento.id,
      },
    });

    return { agendamento, sessaoPacote };
  });

  return resultado;
}
