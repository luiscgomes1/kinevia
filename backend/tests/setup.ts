import { beforeAll, afterAll } from 'vitest'

beforeAll(async () => {
  // Conexão com Prisma é gerenciada por cada arquivo de teste
  // que depende de banco de dados, via managePrisma()
})
