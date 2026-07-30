import type { OpenAPIV3 } from 'openapi-types'

export const laudosPaths: OpenAPIV3.PathsObject = {
    '/pacientes/{id}/laudos': {
        post: {
            tags: ['Laudos'],
            summary: 'Criar laudo',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
                { name: 'tipo', in: 'query', schema: { type: 'string', enum: ['CLINICO', 'COMPLETO', 'REEMBOLSO'] } },
            ],
            requestBody: {
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CriarLaudoRequest' } } },
            },
            responses: {
                '201': {
                    description: 'Laudo criado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Laudo' } } },
                },
                '400': { description: 'Avaliação inicial não preenchida' },
                '404': { description: 'Paciente não encontrado' },
            },
        },
        get: {
            tags: ['Laudos'],
            summary: 'Listar laudos do paciente',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
                { name: 'tipo', in: 'query', schema: { type: 'string', enum: ['CLINICO', 'COMPLETO', 'REEMBOLSO'] } },
            ],
            responses: {
                '200': {
                    description: 'Lista de laudos',
                    content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Laudo' } } } },
                },
                '404': { description: 'Paciente não encontrado' },
            },
        },
    },
    '/laudos/{id}': {
        get: {
            tags: ['Laudos'],
            summary: 'Buscar laudo por ID',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            ],
            responses: {
                '200': {
                    description: 'Laudo com dados do paciente',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Laudo' } } },
                },
                '404': { description: 'Laudo não encontrado' },
            },
        },
        put: {
            tags: ['Laudos'],
            summary: 'Editar conteúdo do laudo',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            ],
            requestBody: {
                content: { 'application/json': { schema: { $ref: '#/components/schemas/EditarLaudoRequest' } } },
            },
            responses: {
                '200': {
                    description: 'Laudo atualizado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Laudo' } } },
                },
                '404': { description: 'Laudo não encontrado' },
            },
        },
    },
    '/laudos/{id}/pdf': {
        get: {
            tags: ['Laudos'],
            summary: 'Download do PDF do laudo',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            ],
            responses: {
                '200': {
                    description: 'Arquivo PDF',
                    content: { 'application/pdf': {} },
                },
                '404': { description: 'Laudo não encontrado' },
            },
        },
    },
    '/laudos/{id}/declaracao-sessoes': {
        get: {
            tags: ['Laudos'],
            summary: 'Download da declaração de sessões (REEMBOLSO)',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            ],
            responses: {
                '200': {
                    description: 'PDF com declaração de sessões',
                    content: { 'application/pdf': {} },
                },
                '404': { description: 'Laudo de reembolso não encontrado' },
            },
        },
    },
}
