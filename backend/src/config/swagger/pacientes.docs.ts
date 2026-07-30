import type { OpenAPIV3 } from 'openapi-types'

const pacienteIdParam: OpenAPIV3.ParameterObject = {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'uuid' },
}

export const pacientesPaths: OpenAPIV3.PathsObject = {
    '/pacientes': {
        get: {
            tags: ['Pacientes'],
            summary: 'Listar pacientes',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'busca', in: 'query', schema: { type: 'string' }, description: 'Busca por nome' },
                { name: 'incluirInativos', in: 'query', schema: { type: 'string', enum: ['true'] } },
                { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
                { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
            ],
            responses: {
                '200': {
                    description: 'Lista de pacientes',
                    content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Paciente' } } } },
                },
            },
        },
        post: {
            tags: ['Pacientes'],
            summary: 'Criar paciente',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CriarPacienteRequest' } } },
            },
            responses: {
                '201': {
                    description: 'Paciente criado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Paciente' } } },
                },
                '409': { description: 'CPF já cadastrado' },
            },
        },
    },
    '/pacientes/{id}': {
        get: {
            tags: ['Pacientes'],
            summary: 'Buscar paciente',
            security: [{ bearerAuth: [] }],
            parameters: [pacienteIdParam],
            responses: {
                '200': {
                    description: 'Dados do paciente',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Paciente' } } },
                },
                '404': { description: 'Paciente não encontrado' },
            },
        },
        put: {
            tags: ['Pacientes'],
            summary: 'Atualizar paciente',
            security: [{ bearerAuth: [] }],
            parameters: [pacienteIdParam],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CriarPacienteRequest' } } },
            },
            responses: {
                '200': {
                    description: 'Paciente atualizado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Paciente' } } },
                },
                '404': { description: 'Paciente não encontrado' },
            },
        },
        delete: {
            tags: ['Pacientes'],
            summary: 'Desativar paciente (soft delete)',
            security: [{ bearerAuth: [] }],
            parameters: [pacienteIdParam],
            responses: {
                '204': { description: 'Paciente desativado' },
                '404': { description: 'Paciente não encontrado' },
            },
        },
    },
    '/pacientes/{id}/identidade': {
        patch: {
            tags: ['Pacientes'],
            summary: 'Corrigir CPF e/ou data de nascimento',
            security: [{ bearerAuth: [] }],
            parameters: [pacienteIdParam],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CorrigirIdentidadeRequest' } } },
            },
            responses: {
                '200': {
                    description: 'Identidade corrigida',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Paciente' } } },
                },
                '400': { description: 'Nenhum campo fornecido ou CPF já em uso' },
                '404': { description: 'Paciente não encontrado' },
            },
        },
    },
    '/pacientes/{id}/reativar': {
        patch: {
            tags: ['Pacientes'],
            summary: 'Reativar paciente inativo',
            security: [{ bearerAuth: [] }],
            parameters: [pacienteIdParam],
            responses: {
                '200': {
                    description: 'Paciente reativado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Paciente' } } },
                },
                '400': { description: 'Paciente já está ativo' },
                '404': { description: 'Paciente não encontrado' },
            },
        },
    },
}
