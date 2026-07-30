import type { OpenAPIV3 } from 'openapi-types'

export const schemas: Record<string, OpenAPIV3.SchemaObject> = {
    ErrorResponse: {
        type: 'object',
        required: ['erro'],
        properties: {
            erro: { type: 'string' },
            detalhes: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        campo: { type: 'string' },
                        mensagem: { type: 'string' },
                    },
                },
            },
        },
    },
    Profissional: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            nome: { type: 'string' },
            email: { type: 'string', format: 'email' },
            crefito: { type: 'string' },
            cidade: { type: 'string' },
            uf: { type: 'string' },
            assinatura_url: { type: 'string', nullable: true },
            logo_url: { type: 'string', nullable: true },
            horario_inicio: { type: 'string' },
            horario_fim: { type: 'string' },
            preco_sessao_individual: { type: 'number' },
            preco_pacote_5: { type: 'number' },
            preco_pacote_10: { type: 'number' },
            criado_em: { type: 'string', format: 'date-time' },
        },
    },
    LoginRequest: {
        type: 'object',
        required: ['email', 'senha'],
        properties: {
            email: { type: 'string', format: 'email' },
            senha: { type: 'string' },
        },
    },
    LoginResponse: {
        type: 'object',
        properties: {
            accessToken: { type: 'string' },
            profissional: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    nome: { type: 'string' },
                    email: { type: 'string' },
                },
            },
        },
    },
    RegisterRequest: {
        type: 'object',
        required: ['nome', 'email', 'senha', 'crefito', 'cidade', 'uf'],
        properties: {
            nome: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
            senha: { type: 'string', minLength: 8 },
            crefito: { type: 'string', minLength: 3 },
            cidade: { type: 'string', minLength: 2 },
            uf: { type: 'string', minLength: 2, maxLength: 2 },
        },
    },
    RegisterResponse: {
        type: 'object',
        properties: {
            accessToken: { type: 'string' },
            profissional: { $ref: '#/components/schemas/Profissional' },
        },
    },
    RefreshResponse: {
        type: 'object',
        properties: {
            accessToken: { type: 'string' },
        },
    },
    MensagemResponse: {
        type: 'object',
        properties: {
            mensagem: { type: 'string' },
        },
    },
    EsqueciSenhaRequest: {
        type: 'object',
        required: ['email'],
        properties: {
            email: { type: 'string', format: 'email' },
        },
    },
    RedefinirSenhaRequest: {
        type: 'object',
        required: ['email', 'token', 'novaSenha'],
        properties: {
            email: { type: 'string', format: 'email' },
            token: { type: 'string' },
            novaSenha: { type: 'string', minLength: 8 },
        },
    },
    AtualizarPerfilRequest: {
        type: 'object',
        properties: {
            nome: { type: 'string', minLength: 2 },
            crefito: { type: 'string', minLength: 3 },
            cidade: { type: 'string', minLength: 2 },
            uf: { type: 'string', minLength: 2, maxLength: 2 },
            horario_inicio: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
            horario_fim: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
            preco_sessao_individual: { type: 'number', minimum: 0 },
            preco_pacote_5: { type: 'number', minimum: 0 },
            preco_pacote_10: { type: 'number', minimum: 0 },
        },
    },
    TrocarSenhaRequest: {
        type: 'object',
        required: ['senhaAtual', 'novaSenha'],
        properties: {
            senhaAtual: { type: 'string' },
            novaSenha: { type: 'string', minLength: 8 },
        },
    },
    Paciente: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            profissional_id: { type: 'string', format: 'uuid' },
            nome: { type: 'string' },
            cpf: { type: 'string' },
            data_nascimento: { type: 'string', format: 'date' },
            endereco: { type: 'string' },
            estado_civil: { type: 'string' },
            nacionalidade: { type: 'string' },
            telefone: { type: 'string', nullable: true },
            email: { type: 'string', nullable: true },
            observacoes: { type: 'string', nullable: true },
            ativo: { type: 'boolean' },
            criado_em: { type: 'string', format: 'date-time' },
        },
    },
    CriarPacienteRequest: {
        type: 'object',
        required: ['nome', 'cpf', 'data_nascimento', 'endereco', 'estado_civil', 'nacionalidade'],
        properties: {
            nome: { type: 'string', minLength: 2 },
            cpf: { type: 'string', pattern: '^\\d{11}$' },
            data_nascimento: { type: 'string', format: 'date' },
            endereco: { type: 'string', minLength: 5 },
            estado_civil: { type: 'string', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'] },
            nacionalidade: { type: 'string', minLength: 2 },
            telefone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            observacoes: { type: 'string' },
        },
    },
    CorrigirIdentidadeRequest: {
        type: 'object',
        properties: {
            cpf: { type: 'string', pattern: '^\\d{11}$' },
            data_nascimento: { type: 'string', format: 'date' },
        },
    },
    Agendamento: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            paciente_id: { type: 'string', format: 'uuid' },
            profissional_id: { type: 'string', format: 'uuid' },
            data: { type: 'string', format: 'date' },
            horario: { type: 'string' },
            slot: { type: 'integer' },
            status: { type: 'string', enum: ['AGENDADO', 'COMPARECEU', 'FALTOU', 'DESMARCOU'] },
            tipo: { type: 'string', enum: ['AVALIACAO', 'SESSAO', 'REPOSICAO'] },
            criado_em: { type: 'string', format: 'date-time' },
        },
    },
    CriarAgendamentoRequest: {
        type: 'object',
        required: ['paciente_id', 'data', 'horario', 'slot'],
        properties: {
            paciente_id: { type: 'string', format: 'uuid' },
            data: { type: 'string', format: 'date' },
            horario: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
            slot: { type: 'integer', minimum: 1, maximum: 3 },
            tipo: { type: 'string', enum: ['AVALIACAO', 'SESSAO', 'REPOSICAO'] },
        },
    },
    AtualizarStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
            status: { type: 'string', enum: ['AGENDADO', 'COMPARECEU', 'FALTOU', 'DESMARCOU'] },
        },
    },
    AgendaDiaResponse: {
        type: 'object',
        properties: {
            data: { type: 'string', format: 'date' },
            horarios: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        horario: { type: 'string' },
                        slots: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    slot: { type: 'integer' },
                                    agendamento: { $ref: '#/components/schemas/Agendamento' },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    ResumoMesResponse: {
        type: 'object',
        properties: {
            ano: { type: 'integer' },
            mes: { type: 'integer' },
            dias: { type: 'array', items: { type: 'integer' } },
        },
    },
    Prontuario: {
        type: 'object',
        properties: {
            paciente_id: { type: 'string', format: 'uuid' },
            preenchido: { type: 'boolean' },
            medico_solicitante: { type: 'string' },
            diagnostico_medico: { type: 'string' },
            queixa_principal: { type: 'string' },
            hda: { type: 'string' },
            hpp_has: { type: 'boolean' },
            hpp_dm: { type: 'boolean' },
            hpp_ca: { type: 'boolean' },
            hpp_cardiopatia: { type: 'boolean' },
            antecedentes_familiares: { type: 'string' },
            medicacoes: { type: 'string' },
            habitos_vida: { type: 'string' },
            exames_medicos: { type: 'string' },
            avaliacao_fisica: { type: 'string' },
            diagnostico_fisio: { type: 'string' },
            prognostico_fisio: { type: 'string' },
            plano_terapeutico: { type: 'string' },
            dor_eva: { type: 'integer', nullable: true },
            pa: { type: 'string' },
            fr: { type: 'string' },
            fc: { type: 'string' },
            ap: { type: 'string' },
            evolucoes: {
                type: 'array',
                items: { $ref: '#/components/schemas/Evolucao' },
            },
        },
    },
    SalvarProntuarioRequest: {
        type: 'object',
        properties: {
            medico_solicitante: { type: 'string' },
            diagnostico_medico: { type: 'string' },
            queixa_principal: { type: 'string' },
            hda: { type: 'string' },
            hpp_has: { type: 'boolean' },
            hpp_dm: { type: 'boolean' },
            hpp_ca: { type: 'boolean' },
            hpp_cardiopatia: { type: 'boolean' },
            antecedentes_familiares: { type: 'string' },
            medicacoes: { type: 'string' },
            habitos_vida: { type: 'string' },
            exames_medicos: { type: 'string' },
            avaliacao_fisica: { type: 'string' },
            diagnostico_fisio: { type: 'string' },
            prognostico_fisio: { type: 'string' },
            plano_terapeutico: { type: 'string' },
            dor_eva: { type: 'integer', minimum: 0, maximum: 10 },
            pa: { type: 'string' },
            fr: { type: 'string' },
            fc: { type: 'string' },
            ap: { type: 'string' },
        },
    },
    Evolucao: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            prontuario_id: { type: 'string', format: 'uuid' },
            texto: { type: 'string' },
            dor_eva: { type: 'integer', nullable: true },
            criado_em: { type: 'string', format: 'date-time' },
            correcao_texto: { type: 'string', nullable: true },
            correcao_em: { type: 'string', format: 'date-time', nullable: true },
        },
    },
    AdicionarEvolucaoRequest: {
        type: 'object',
        required: ['texto'],
        properties: {
            texto: { type: 'string', minLength: 1 },
            dor_eva: { type: 'integer', minimum: 0, maximum: 10 },
        },
    },
    AdicionarCorrecaoRequest: {
        type: 'object',
        required: ['correcao_texto'],
        properties: {
            correcao_texto: { type: 'string', minLength: 1 },
        },
    },
    Pacote: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            paciente_id: { type: 'string', format: 'uuid' },
            tipo: { type: 'string', enum: ['INDIVIDUAL', 'PACOTE_5', 'PACOTE_10'] },
            valor_cobrado: { type: 'number' },
            status_pagamento: { type: 'string', enum: ['AGUARDANDO', 'PAGO'] },
            pago_em: { type: 'string', format: 'date-time', nullable: true },
            criado_em: { type: 'string', format: 'date-time' },
        },
    },
    CriarPacoteRequest: {
        type: 'object',
        required: ['tipo', 'valor_cobrado'],
        properties: {
            tipo: { type: 'string', enum: ['INDIVIDUAL', 'PACOTE_5', 'PACOTE_10'] },
            valor_cobrado: { type: 'number', minimum: 0 },
            status_pagamento: { type: 'string', enum: ['AGUARDANDO', 'PAGO'] },
            sessoes: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['data', 'horario', 'slot'],
                    properties: {
                        data: { type: 'string', format: 'date' },
                        horario: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
                        slot: { type: 'integer', minimum: 1, maximum: 3 },
                        tipo: { type: 'string', enum: ['AVALIACAO', 'SESSAO', 'REPOSICAO'] },
                    },
                },
            },
        },
    },
    MarcarPagamentoRequest: {
        type: 'object',
        required: ['status_pagamento'],
        properties: {
            status_pagamento: { type: 'string', enum: ['AGUARDANDO', 'PAGO'] },
        },
    },
    Laudo: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            paciente_id: { type: 'string', format: 'uuid' },
            profissional_id: { type: 'string', format: 'uuid' },
            tipo: { type: 'string', enum: ['CLINICO', 'COMPLETO', 'REEMBOLSO'] },
            conteudo: { type: 'object' },
            tipo_assinatura: { type: 'string', enum: ['DIGITAL', 'MANUSCRITA'] },
            pdf_path: { type: 'string', nullable: true },
            criado_em: { type: 'string', format: 'date-time' },
        },
    },
    CriarLaudoRequest: {
        type: 'object',
        properties: {
            tipo_assinatura: { type: 'string', enum: ['DIGITAL', 'MANUSCRITA'] },
            tipo: { type: 'string', enum: ['CLINICO', 'COMPLETO', 'REEMBOLSO'] },
        },
    },
    EditarLaudoRequest: {
        type: 'object',
        properties: {
            conteudo: { type: 'object' },
            tipo_assinatura: { type: 'string', enum: ['DIGITAL', 'MANUSCRITA'] },
        },
    },
    FinanceiroResumo: {
        type: 'object',
        properties: {
            periodo: {
                type: 'object',
                properties: {
                    mes: { type: 'integer' },
                    ano: { type: 'integer' },
                },
            },
            recebido_no_mes: { type: 'number' },
            a_receber_no_mes: { type: 'number' },
            total_periodo: { type: 'number' },
            total_acumulado: { type: 'number' },
            breakdown_por_tipo: {
                type: 'object',
                properties: {
                    individual: { type: 'object', properties: { quantidade: { type: 'integer' }, valor: { type: 'number' } } },
                    pacote_5: { type: 'object', properties: { quantidade: { type: 'integer' }, valor: { type: 'number' } } },
                    pacote_10: { type: 'object', properties: { quantidade: { type: 'integer' }, valor: { type: 'number' } } },
                },
            },
        },
    },
    FinanceiroPorPaciente: {
        type: 'object',
        properties: {
            periodo: {
                type: 'object',
                properties: { mes: { type: 'integer' }, ano: { type: 'integer' } },
            },
            pacientes: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        paciente_id: { type: 'string', format: 'uuid' },
                        paciente_nome: { type: 'string' },
                        total_cobrado: { type: 'number' },
                        total_recebido: { type: 'number' },
                        total_pendente: { type: 'number' },
                        pacotes: { type: 'array', items: { $ref: '#/components/schemas/Pacote' } },
                    },
                },
            },
        },
    },
    RelatorioResumo: {
        type: 'object',
        properties: {
            periodo: {
                type: 'object',
                properties: {
                    inicio: { type: 'string', format: 'date' },
                    fim: { type: 'string', format: 'date' },
                },
            },
            total: { type: 'integer' },
            compareceu: { type: 'integer' },
            faltou: { type: 'integer' },
            desmarcou: { type: 'integer' },
            taxaFaltas: { type: 'number' },
            pacientesAtivos: { type: 'integer' },
            sessoesPorMes: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: { mes: { type: 'string' }, quantidade: { type: 'integer' } },
                },
            },
            faturamentoEstimado: { type: 'number' },
            evolucaoEva: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: { data: { type: 'string' }, eva: { type: 'integer' } },
                },
            },
        },
    },
}
