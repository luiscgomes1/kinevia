import type { OpenAPIV3 } from 'openapi-types'

export const relatoriosPaths: OpenAPIV3.PathsObject = {
    '/relatorio/resumo': {
        get: {
            tags: ['Relatórios'],
            summary: 'Resumo de período (agenda, faltas, faturamento)',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'inicio', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
                { name: 'fim', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
            ],
            responses: {
                '200': {
                    description: 'Resumo do período',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/RelatorioResumo' } } },
                },
                '400': { description: 'Parâmetros obrigatórios ausentes' },
            },
        },
    },
}
