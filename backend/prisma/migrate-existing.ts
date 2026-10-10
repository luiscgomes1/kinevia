import { PrismaClient } from '../generated/client'

const prisma = new PrismaClient()

async function main() {
  const profissionais = await prisma.profissional.findMany({
    where: { clinica_id: null },
  })

  if (profissionais.length === 0) {
    console.log('Nenhum profissional precisa de migração.')
    return
  }

  console.log(`Migrando ${profissionais.length} profissional(is)...`)

  for (const p of profissionais) {
    const clinica = await prisma.clinica.create({
      data: {
        nome: `Clínica ${p.nome}`,
      },
    })

    await prisma.profissional.update({
      where: { id: p.id },
      data: {
        clinica_id: clinica.id,
        role: 'ADMIN',
      },
    })

    console.log(`  ✅ ${p.nome} -> Clínica criada e vinculada`)
  }

  console.log('Migração concluída!')
}

main()
  .catch((e) => {
    console.error('Erro:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
