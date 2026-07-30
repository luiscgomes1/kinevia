import type { OpenAPIV3 } from 'openapi-types'

export const evolucaoPaths: OpenAPIV3.PathsObject = {
    '/evolucoes/{id}/correcao': {
        patch: {
            tags: ['Evoluções'],
            summary: 'Adicionar correção a uma evolução',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            ],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/AdicionarCorrecaoRequest' } } },
            },
            responses: {
                '200': {
                    description: 'Correção adicionada',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Evolucao' } } },
                },
                '400': { description: 'Evolução já possui correção' },
                '404': { description: 'Evolução não encontrada' },
            },
        },
    },
}
