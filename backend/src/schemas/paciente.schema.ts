import { z } from "zod";

const normalizarCpf = (valor: string) => valor.replace(/\D/g, "");
const normalizarTelefone = (valor: string) => valor.replace(/\D/g, "");

const validarCpf = (cpf: string) => {
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let c = 0; c < t; c++) {
      soma += Number(cpf[c]) * (t + 1 - c);
    }

    const digito = ((10 * soma) % 11) % 10;
    if (Number(cpf[t]) !== digito) return false;
  }

  return true;
};

const cpfSchema = z
  .string()
  .transform(normalizarCpf)
  .refine((v) => /^\d{11}$/.test(v), {
    message: "CPF deve conter exatamente 11 dígitos.",
  })
  .refine((v) => !/^(\d)\1{10}$/.test(v), {
    message: "CPF inválido.",
  })
  .refine((v) => validarCpf(v), {
    message: "CPF inválido.",
  });

const dataNascimentoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "A data de nascimento deve estar no formato YYYY-MM-DD.",
  })
  .refine((valor) => {
    const [ano, mes, dia] = valor.split("-").map(Number);
    const data = new Date(Date.UTC(ano, mes - 1, dia));

    return (
      data.getUTCFullYear() === ano &&
      data.getUTCMonth() === mes - 1 &&
      data.getUTCDate() === dia
    );
  }, {
    message: "Data de nascimento inválida.",
  });

const telefoneSchema = z
  .string()
  .trim()
  .refine((valor) => {
    const telefone = normalizarTelefone(valor);
    return telefone.length === 10 || telefone.length === 11;
  }, {
    message: "Telefone inválido. Informe DDD + número (10 ou 11 dígitos).",
  });

export const criarPacienteSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, {
      message: "O nome é obrigatório e deve ter pelo menos 2 caracteres.",
    })
    .max(255),
  cpf: cpfSchema,
  data_nascimento: dataNascimentoSchema,
  endereco: z
    .string()
    .trim()
    .min(5, {
      message: "O endereço é obrigatório e deve ter pelo menos 5 caracteres.",
    })
    .max(500),
  estado_civil: z.enum(
    ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Vi\u00favo(a)", "Uni\u00e3o est\u00e1vel"],
    {
      message: "Selecione um estado civil v\u00e1lido.",
    },
  ),
  nacionalidade: z
    .string()
    .trim()
    .min(2, {
      message:
        "A nacionalidade é obrigatória e deve ter pelo menos 2 caracteres.",
    })
    .max(100),
  telefone: telefoneSchema.optional().or(z.literal("")),
  email: z.string().email("Email inválido.").max(255).optional().or(z.literal("")),
  observacoes: z.string().max(4000).optional(),
});

export const atualizarPacienteSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, {
      message: "O nome é obrigatório e deve ter pelo menos 2 caracteres.",
    }),
  endereco: z
    .string()
    .trim()
    .min(5, {
      message: "O endereço é obrigatório e deve ter pelo menos 5 caracteres.",
    }),
  estado_civil: z.enum(
    ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Vi\u00favo(a)", "Uni\u00e3o est\u00e1vel"],
    {
      message: "Selecione um estado civil v\u00e1lido.",
    },
  ),
  nacionalidade: z
    .string()
    .trim()
    .min(2, {
      message:
        "A nacionalidade é obrigatória e deve ter pelo menos 2 caracteres.",
    })
    .max(100),
  telefone: telefoneSchema.optional().or(z.literal("")),
  email: z.string().email("Email inválido.").max(255).optional().or(z.literal("")),
  observacoes: z.string().max(4000).optional(),
});

export const corrigirIdentidadeSchema = z
  .object({
    cpf: cpfSchema.optional(),
    data_nascimento: dataNascimentoSchema.optional(),
  })
  .refine((dados) => dados.cpf || dados.data_nascimento, {
    message:
      "Informe ao menos um campo para corrigir: CPF ou data de nascimento.",
  });

export const transferirPacienteSchema = z.object({
  novo_profissional_id: z.string().uuid('Profissional inválido.'),
});
