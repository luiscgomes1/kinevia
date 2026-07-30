import type { OpenAPIV3 } from 'openapi-types'
import { authPaths } from './auth.docs'
import { profissionalPaths } from './profissional.docs'
import { pacientesPaths } from './pacientes.docs'
import { agendaPaths } from './agenda.docs'
import { prontuarioPaths } from './prontuario.docs'
import { evolucaoPaths } from './evolucao.docs'
import { pacotesPaths } from './pacotes.docs'
import { laudosPaths } from './laudos.docs'
import { financeiroPaths } from './financeiro.docs'
import { relatoriosPaths } from './relatorios.docs'
import { schemas } from './schemas'

const paths: OpenAPIV3.PathsObject = {
    ...authPaths,
    ...profissionalPaths,
    ...pacientesPaths,
    ...agendaPaths,
    ...prontuarioPaths,
    ...evolucaoPaths,
    ...pacotesPaths,
    ...laudosPaths,
    ...financeiroPaths,
    ...relatoriosPaths,
}

export const docSpec: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: {
        title: 'Kinevia API',
        version: '1.0.0',
        description:
            'API do sistema Kinevia (gestão de clínica de fisioterapia). ' +
            'Cobre todos os módulos: Auth, Profissional, Pacientes, Agenda, ' +
            'Prontuário, Pacotes, Laudos, Financeiro e Relatórios.',
    },
    servers: [
        { url: 'http://localhost:3333/v1', description: 'Desenvolvimento local' },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas,
    },
    security: [{ bearerAuth: [] }],
    paths,
}
