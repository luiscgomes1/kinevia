/// <reference types="node" />
import { PrismaClient } from '../generated/client'
import bcrypt from 'bcryptjs'

if (process.env.NODE_ENV === 'production') {
  console.error('ERRO: seed só pode ser executado em ambiente de desenvolvimento')
  process.exit(1)
}

const prisma = new PrismaClient()

async function main() {
  const senhaHash = await bcrypt.hash('123456', 10)

  const clinica = await prisma.clinica.upsert({
    where: { id: 'clinica-padrao' },
    update: {},
    create: {
      id: 'clinica-padrao',
      nome: 'Clínica Padrão',
    },
  })

  const profissional = await prisma.profissional.upsert({
    where: { email: 'admin@fisiogest.com' },
    update: {},
    create: {
      nome: 'Admin',
      email: 'admin@fisiogest.com',
      senha_hash: senhaHash,
      role: 'SUPER_ADMIN',
      clinica_id: clinica.id,
      crefito: '000000-F',
      cidade: 'São Paulo',
      uf: 'SP',
      horario_inicio: '07:00',
      horario_fim: '18:00',
      preco_sessao_individual: 80,
      preco_pacote_5: 350,
      preco_pacote_10: 600,
    },
  })

  console.log('✅ Clínica criada:', clinica.nome)
  console.log('✅ Profissional criado:', profissional.email)
  console.log('🔑 Senha padrão: 123456')
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
