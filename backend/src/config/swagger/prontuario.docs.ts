import type { OpenAPIV3 } from 'openapi-types'

export const prontuarioPaths: OpenAPIV3.PathsObject = {
    '/pacientes/{id}/prontuario': {
        get: {
            tags: ['Prontuário'],
            summary: 'Buscar prontuário do paciente',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            ],
            responses: {
                '200': {
                    description: 'Prontuário com evoluções',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Prontuario' } } },
                },
                '404': { description: 'Paciente não encontrado' },
            },
        },
        put: {
            tags: ['Prontuário'],
            summary: 'Salvar prontuário (cria ou atualiza)',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            ],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/SalvarProntuarioRequest' } } },
            },
            responses: {
                '200': {
                    description: 'Prontuário salvo',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Prontuario' } } },
                },
                '404': { description: 'Paciente não encontrado' },
            },
        },
    },
    '/pacientes/{id}/evolucoes': {
        post: {
            tags: ['Prontuário'],
            summary: 'Adicionar evolução clínica',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            ],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/AdicionarEvolucaoRequest' } } },
            },
            responses: {
                '201': {
                    description: 'Evolução criada',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Evolucao' } } },
                },
                '404': { description: 'Paciente não encontrado ou sem avaliação inicial' },
            },
        },
    },
}
