const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Badges...')

  const badges = [
    {
      name: 'First Step',
      description: 'Completed your first donation or sale.',
      category: 'DONATION',
      iconUrl: '🌱',
      requirementThreshold: 1,
    },
    {
      name: 'Generous Soul',
      description: 'Completed 5 donations.',
      category: 'DONATION',
      iconUrl: '💖',
      requirementThreshold: 5,
    },
    {
      name: 'Bookworm',
      description: 'Logged 10 reading sessions in the library.',
      category: 'COMMUNITY',
      iconUrl: '📚',
      requirementThreshold: 10,
    },
    {
      name: 'Trusted Member',
      description: 'Account verified and active.',
      category: 'TRUST',
      iconUrl: '🛡️',
      requirementThreshold: 1,
    }
  ]

  for (const badge of badges) {
    // Check if a badge with the same name exists
    const existing = await prisma.badge.findFirst({
      where: { name: badge.name }
    })

    if (!existing) {
      await prisma.badge.create({ data: badge })
      console.log(`Created badge: ${badge.name}`)
    } else {
      console.log(`Badge already exists: ${badge.name}`)
    }
  }

  console.log('Seeding Badges Complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
