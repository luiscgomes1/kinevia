import type { OpenAPIV3 } from 'openapi-types'

export const agendaPaths: OpenAPIV3.PathsObject = {
    '/agenda': {
        get: {
            tags: ['Agenda'],
            summary: 'Buscar agenda do dia com slots',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'data', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
            ],
            responses: {
                '200': {
                    description: 'Grade horária do dia',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/AgendaDiaResponse' } } },
                },
            },
        },
    },
    '/agenda/resumo-mes': {
        get: {
            tags: ['Agenda'],
            summary: 'Dias com agendamentos no mês',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'ano', in: 'query', required: true, schema: { type: 'string', pattern: '^\\d{4}$' } },
                { name: 'mes', in: 'query', required: true, schema: { type: 'string', pattern: '^(1[0-2]|[1-9])$' } },
            ],
            responses: {
                '200': {
                    description: 'Dias com eventos',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ResumoMesResponse' } } },
                },
            },
        },
    },
    '/agenda/agendamentos/{id}/status': {
        patch: {
            tags: ['Agenda'],
            summary: 'Atualizar status do agendamento',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            ],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/AtualizarStatusRequest' } } },
            },
            responses: {
                '200': {
                    description: 'Status atualizado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Agendamento' } } },
                },
                '400': { description: 'Agendamento já finalizado' },
                '404': { description: 'Agendamento não encontrado' },
            },
        },
    },
}
