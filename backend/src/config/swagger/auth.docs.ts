import type { OpenAPIV3 } from 'openapi-types'

export const authPaths: OpenAPIV3.PathsObject = {
    '/auth/register': {
        post: {
            tags: ['Auth'],
            summary: 'Criar conta de profissional',
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
            },
            responses: {
                '201': {
                    description: 'Conta criada',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterResponse' } } },
                },
                '409': {
                    description: 'Email já cadastrado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
                },
            },
        },
    },
    '/auth/login': {
        post: {
            tags: ['Auth'],
            summary: 'Autenticar profissional',
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
            },
            responses: {
                '200': {
                    description: 'Login realizado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
                },
                '401': {
                    description: 'Credenciais inválidas',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
                },
            },
        },
    },
    '/auth/refresh': {
        post: {
            tags: ['Auth'],
            summary: 'Renovar access token via cookie',
            responses: {
                '200': {
                    description: 'Token renovado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshResponse' } } },
                },
                '401': {
                    description: 'Refresh token inválido ou expirado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
                },
            },
        },
    },
    '/auth/logout': {
        post: {
            tags: ['Auth'],
            summary: 'Invalidar tokens (logout)',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Logout realizado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/MensagemResponse' } } },
                },
            },
        },
    },
    '/auth/esqueci-senha': {
        post: {
            tags: ['Auth'],
            summary: 'Solicitar redefinição de senha',
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/EsqueciSenhaRequest' } } },
            },
            responses: {
                '200': {
                    description: 'Email enviado se conta existir',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/MensagemResponse' } } },
                },
            },
        },
    },
    '/auth/redefinir-senha': {
        post: {
            tags: ['Auth'],
            summary: 'Redefinir senha com token',
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/RedefinirSenhaRequest' } } },
            },
            responses: {
                '200': {
                    description: 'Senha redefinida',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/MensagemResponse' } } },
                },
                '400': {
                    description: 'Token inválido ou expirado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
                },
            },
        },
    },
}
