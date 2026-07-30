import type { OpenAPIV3 } from 'openapi-types'

export const financeiroPaths: OpenAPIV3.PathsObject = {
    '/financeiro': {
        get: {
            tags: ['Financeiro'],
            summary: 'Resumo financeiro do mês',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'mes', in: 'query', schema: { type: 'string', pattern: '^(1[0-2]|[1-9])$' } },
                { name: 'ano', in: 'query', schema: { type: 'string', pattern: '^\\d{4}$' } },
            ],
            responses: {
                '200': {
                    description: 'Resumo financeiro',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/FinanceiroResumo' } } },
                },
            },
        },
    },
    '/financeiro/pacientes': {
        get: {
            tags: ['Financeiro'],
            summary: 'Financeiro detalhado por paciente',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'mes', in: 'query', schema: { type: 'string', pattern: '^(1[0-2]|[1-9])$' } },
                { name: 'ano', in: 'query', schema: { type: 'string', pattern: '^\\d{4}$' } },
            ],
            responses: {
                '200': {
                    description: 'Detalhamento por paciente',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/FinanceiroPorPaciente' } } },
                },
            },
        },
    },
    '/financeiro/pacientes/{id}': {
        get: {
            tags: ['Financeiro'],
            summary: 'Financeiro de um paciente específico',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
                { name: 'mes', in: 'query', schema: { type: 'string', pattern: '^(1[0-2]|[1-9])$' } },
                { name: 'ano', in: 'query', schema: { type: 'string', pattern: '^\\d{4}$' } },
            ],
            responses: {
                '200': {
                    description: 'Dados financeiros do paciente',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/FinanceiroPorPaciente' } } },
                },
                '404': { description: 'Paciente não encontrado' },
            },
        },
    },
}
