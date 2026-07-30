import type { OpenAPIV3 } from 'openapi-types'

const pacienteIdParam: OpenAPIV3.ParameterObject = {
    name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' },
}
const pacoteIdParam: OpenAPIV3.ParameterObject = {
    name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' },
}

export const pacotesPaths: OpenAPIV3.PathsObject = {
    '/pacientes/{id}/pacotes': {
        post: {
            tags: ['Pacotes'],
            summary: 'Criar pacote de sessões',
            security: [{ bearerAuth: [] }],
            parameters: [pacienteIdParam],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CriarPacoteRequest' } } },
            },
            responses: {
                '201': {
                    description: 'Pacote criado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Pacote' } } },
                },
                '400': { description: 'Dados inválidos' },
                '404': { description: 'Paciente não encontrado' },
            },
        },
        get: {
            tags: ['Pacotes'],
            summary: 'Listar pacotes do paciente',
            security: [{ bearerAuth: [] }],
            parameters: [pacienteIdParam],
            responses: {
                '200': {
                    description: 'Lista de pacotes com contadores',
                    content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Pacote' } } } },
                },
                '404': { description: 'Paciente não encontrado' },
            },
        },
    },
    '/pacotes/{id}/sessoes': {
        post: {
            tags: ['Pacotes'],
            summary: 'Adicionar sessão a pacote existente',
            security: [{ bearerAuth: [] }],
            parameters: [pacoteIdParam],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CriarAgendamentoRequest' } } },
            },
            responses: {
                '201': { description: 'Sessão adicionada' },
                '400': { description: 'Dados inválidos ou limite excedido' },
                '404': { description: 'Pacote não encontrado' },
            },
        },
    },
    '/pacotes/{id}/pagamento': {
        patch: {
            tags: ['Pacotes'],
            summary: 'Marcar pagamento do pacote',
            security: [{ bearerAuth: [] }],
            parameters: [pacoteIdParam],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/MarcarPagamentoRequest' } } },
            },
            responses: {
                '200': {
                    description: 'Status atualizado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Pacote' } } },
                },
                '404': { description: 'Pacote não encontrado' },
            },
        },
    },
}
