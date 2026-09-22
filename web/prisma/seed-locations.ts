import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mumbai Coordinates
const BASE_LAT = 19.0760
const BASE_LNG = 72.8777

async function main() {
  console.log('Seeding locations for users...')

  const users = await prisma.user.findMany()

  for (const user of users) {
    // Random offset between -0.05 and 0.05 (roughly ~5km radius)
    const latOffset = (Math.random() - 0.5) * 0.1
    const lngOffset = (Math.random() - 0.5) * 0.1

    await prisma.user.update({
      where: { id: user.id },
      data: {
        latitude: BASE_LAT + latOffset,
        longitude: BASE_LNG + lngOffset,
        location: "Mumbai, India (Randomized)"
      }
    })
    console.log(`Updated user ${user.name || user.email} with coordinates.`)
  }

  console.log('Location seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
