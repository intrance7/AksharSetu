import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DUMMY_BOOKS = [
  {
    title: "Introduction to Algorithms, Fourth Edition",
    author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
    isbn: "9780262046305",
    description: "A comprehensive update of the leading algorithms text, with new material on matchings in bipartite graphs, online algorithms, machine learning, and other topics.",
    condition: "GOOD",
    category: "engineering",
    status: "AVAILABLE",
    price: 45.0,
    images: ["https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800"]
  },
  {
    title: "Gray's Anatomy for Students",
    author: "Richard Drake, A. Wayne Vogl, Adam W. M. Mitchell",
    isbn: "9780323393041",
    description: "Easy to read, superbly illustrated, and clinically relevant, Gray's Anatomy for Students, 4th Edition, is medical students' go-to text for essential information in human anatomy.",
    condition: "LIKE_NEW",
    category: "medical",
    status: "AVAILABLE",
    price: 60.0,
    images: ["https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800"]
  },
  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    isbn: "9781250301697",
    description: "The Silent Patient is a shocking psychological thriller of a woman's act of violence against her husband—and of the therapist obsessed with uncovering her motive.",
    condition: "LIKE_NEW",
    category: "fiction",
    status: "AVAILABLE",
    price: 10.0,
    images: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800"]
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    isbn: "9780062316097",
    description: "100,000 years ago, at least six human species inhabited the earth. Today there is just one. Us. Homo sapiens. How did our species succeed in the battle for dominance?",
    condition: "FAIR",
    category: "non-fiction",
    status: "AVAILABLE",
    price: 0, // Donation
    images: ["https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800"]
  },
  {
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.",
    condition: "GOOD",
    category: "engineering",
    status: "AVAILABLE",
    price: 25.0,
    images: ["https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800"]
  },
  {
    title: "Harrison's Principles of Internal Medicine",
    author: "J. Larry Jameson, et al.",
    isbn: "9781259644030",
    description: "The landmark guide to internal medicine—updated and streamlined for today's students and clinicians.",
    condition: "POOR",
    category: "medical",
    status: "AVAILABLE",
    price: 0, // Donation
    images: ["https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=800"]
  }
]

const DUMMY_BADGES = [
  {
    name: "Seed Planter",
    description: "Donated 1 Book",
    category: "DONATION",
    iconUrl: "🌱",
    requirementThreshold: 1,
  },
  {
    name: "Knowledge Giver",
    description: "Donated 5 Books",
    category: "DONATION",
    iconUrl: "🌿",
    requirementThreshold: 5,
  },
  {
    name: "Honest Lister",
    description: "Accurate descriptions",
    category: "TRUST",
    iconUrl: "✅",
    requirementThreshold: 5,
  },
  {
    name: "Speedy Shipper",
    description: "Fast dispatches",
    category: "TRUST",
    iconUrl: "⚡",
    requirementThreshold: 1,
  },
  {
    name: "Early Adopter",
    description: "Joined in first 6 months",
    category: "COMMUNITY",
    iconUrl: "🚀",
    requirementThreshold: 0,
  }
]

const bcrypt = require('bcryptjs')

async function main() {
  console.log('Start seeding ...')

  // Hash the password
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Create a dummy user
  const user = await prisma.user.upsert({
    where: { email: 'test@aksharsetu.com' },
    update: {
      password: hashedPassword
    },
    create: {
      email: 'test@aksharsetu.com',
      name: 'Alice Donor',
      password: hashedPassword,
      role: 'USER',
      bio: 'Lifelong learner and book lover. Happy to share my collection with students in need!',
      location: 'Mumbai, India'
    },
  })

  console.log(`Created dummy user with id: ${user.id}`)

  // Skipping book reset to prevent foreign key errors during development
  // We already have books from previous seeding/testing.

  // Seed Badges
  await prisma.userBadge.deleteMany()
  await prisma.badge.deleteMany()
  
  const badgeMap = new Map()
  for (const badge of DUMMY_BADGES) {
    const createdBadge = await prisma.badge.create({
      data: badge
    })
    badgeMap.set(createdBadge.name, createdBadge.id)
    console.log(`Created badge: ${createdBadge.name}`)
  }

  // Assign Badges to Alice
  await prisma.userBadge.createMany({
    data: [
      { userId: user.id, badgeId: badgeMap.get("Seed Planter"), isPinned: true },
      { userId: user.id, badgeId: badgeMap.get("Honest Lister"), isPinned: true },
      { userId: user.id, badgeId: badgeMap.get("Early Adopter"), isPinned: false },
    ]
  })
  console.log(`Assigned badges to user: Alice Donor`)

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
