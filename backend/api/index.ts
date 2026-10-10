import serverless from 'serverless-http'
import app from '../src/app'

// Handler usado pela Vercel: cada requisição chama esta função.
// O `app.listen` NÃO roda aqui — quem serve HTTP é a plataforma.
export const handler = serverless(app)

export default handler