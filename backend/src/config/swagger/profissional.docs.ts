import type { OpenAPIV3 } from 'openapi-types'

export const profissionalPaths: OpenAPIV3.PathsObject = {
    '/profissional/me': {
        get: {
            tags: ['Profissional'],
            summary: 'Buscar perfil do profissional logado',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Perfil do profissional',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Profissional' } } },
                },
            },
        },
        put: {
            tags: ['Profissional'],
            summary: 'Atualizar perfil',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/AtualizarPerfilRequest' } } },
            },
            responses: {
                '200': {
                    description: 'Perfil atualizado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Profissional' } } },
                },
            },
        },
    },
    '/profissional/me/senha': {
        put: {
            tags: ['Profissional'],
            summary: 'Alterar senha',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/TrocarSenhaRequest' } } },
            },
            responses: {
                '200': {
                    description: 'Senha alterada',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/MensagemResponse' } } },
                },
                '400': {
                    description: 'Senha atual incorreta',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
                },
            },
        },
    },
    '/profissional/me/verificar-senha': {
        post: {
            tags: ['Profissional'],
            summary: 'Verificar se a senha atual está correta',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { type: 'object', required: ['senha'], properties: { senha: { type: 'string' } } } } },
            },
            responses: {
                '200': {
                    description: 'Resultado da verificação',
                    content: { 'application/json': { schema: { type: 'object', properties: { valida: { type: 'boolean' } } } } },
                },
            },
        },
    },
    '/profissional/me/assinatura': {
        post: {
            tags: ['Profissional'],
            summary: 'Upload ou remoção da assinatura',
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: { 'multipart/form-data': { schema: { type: 'object', properties: { imagem: { type: 'string', format: 'binary' }, remover: { type: 'boolean' } } } } },
            },
            responses: {
                '200': { description: 'Assinatura salva ou removida' },
                '400': { description: 'Nenhuma imagem enviada' },
            },
        },
    },
    '/profissional/me/logo': {
        post: {
            tags: ['Profissional'],
            summary: 'Upload ou remoção da logo',
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: { 'multipart/form-data': { schema: { type: 'object', properties: { imagem: { type: 'string', format: 'binary' }, remover: { type: 'boolean' } } } } },
            },
            responses: {
                '200': { description: 'Logo salva ou removida' },
                '400': { description: 'Nenhuma imagem enviada' },
            },
        },
    },
}
