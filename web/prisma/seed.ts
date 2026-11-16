import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const bcrypt = require("bcryptjs")

const COMMUNITY_READERS = [
  {
    email: "test@aksharsetu.com",
    name: "Alice Donor",
    bio: "Lifelong learner and book lover. Happy to share my collection with students in need!",
    location: "Mumbai, India",
    favoriteQuote: "A room without books is like a body without a soul.",
    quoteAuthor: "Cicero",
    liveStatus: "Reading Sapiens",
    isShantiModeActive: true,
  },
  {
    email: "aarav.sharma@aksharsetu.com",
    name: "Aarav Sharma",
    bio: "Final year CSE at IIT Delhi. Swapping algorithms, systems textbooks, and sci-fi classics.",
    location: "New Delhi, India",
    favoriteQuote: "Programs must be written for people to read, and only incidentally for machines to execute.",
    quoteAuthor: "Harold Abelson",
    liveStatus: "Preparing Sem 6 bundle",
    isShantiModeActive: false,
  },
  {
    email: "meera.iyer@aksharsetu.com",
    name: "Meera Iyer",
    bio: "Literature & Philosophy enthusiast. Always up for a 1-for-1 novel swap in Bengaluru.",
    location: "Bengaluru, India",
    favoriteQuote: "Where the mind is without fear and the head is held high.",
    quoteAuthor: "Rabindranath Tagore",
    liveStatus: "In Shanti Mode · Gitanjali",
    isShantiModeActive: true,
  },
  {
    email: "rohan.kulkarni@aksharsetu.com",
    name: "Rohan Kulkarni",
    bio: "Medical student sharing MBBS anatomy & internal medicine textbooks with juniors.",
    location: "Pune, India",
    favoriteQuote: "Wherever the art of Medicine is loved, there is also a love of Humanity.",
    quoteAuthor: "Hippocrates",
    liveStatus: "Open for campus handoffs",
    isShantiModeActive: false,
  },
]

const DUMMY_BOOKS = [
  {
    title: "Introduction to Algorithms, Fourth Edition",
    author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
    isbn: "9780262046305",
    description:
      "A comprehensive update of the leading algorithms text, with new material on matchings in bipartite graphs, online algorithms, machine learning, and other topics.",
    condition: "GOOD" as const,
    category: "engineering",
    status: "AVAILABLE" as const,
    price: 450,
    university: "IIT Delhi",
    course: "Sem 4 · CS201",
    acceptsExchange: true,
    exchangePreferences: "Operating Systems or Computer Networks textbook",
    images: [
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800",
    ],
    ownerIdx: 1,
  },
  {
    title: "Gray's Anatomy for Students",
    author: "Richard Drake, A. Wayne Vogl, Adam W. M. Mitchell",
    isbn: "9780323393041",
    description:
      "Easy to read, superbly illustrated, and clinically relevant, Gray's Anatomy for Students is medical students' go-to text for essential information in human anatomy.",
    condition: "LIKE_NEW" as const,
    category: "medical",
    status: "AVAILABLE" as const,
    price: 550,
    university: "AIIMS / MUHS",
    course: "Sem 1 · MBBS Anatomy",
    acceptsExchange: false,
    images: [
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
    ],
    ownerIdx: 3,
  },
  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    isbn: "9781250301697",
    description:
      "The Silent Patient is a shocking psychological thriller of a woman's act of violence against her husband—and of the therapist obsessed with uncovering her motive.",
    condition: "LIKE_NEW" as const,
    category: "fiction",
    status: "AVAILABLE" as const,
    price: 0,
    acceptsExchange: true,
    exchangePreferences: "Any Agatha Christie or Sherlock Holmes mystery novel",
    images: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
    ],
    ownerIdx: 2,
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    isbn: "9780062316097",
    description:
      "100,000 years ago, at least six human species inhabited the earth. Today there is just one. Us. Homo sapiens.",
    condition: "GOOD" as const,
    category: "non-fiction",
    status: "AVAILABLE" as const,
    price: 0,
    acceptsExchange: false,
    images: [
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800",
    ],
    ownerIdx: 0,
  },
  {
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    description:
      "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.",
    condition: "GOOD" as const,
    category: "engineering",
    status: "AVAILABLE" as const,
    price: 299,
    university: "Delhi University",
    course: "Sem 5 · Software Engineering",
    acceptsExchange: true,
    exchangePreferences: "Designing Data-Intensive Applications or Pragmatic Programmer",
    images: [
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800",
    ],
    ownerIdx: 1,
  },
  {
    title: "Harrison's Principles of Internal Medicine",
    author: "J. Larry Jameson, et al.",
    isbn: "9781259644030",
    description:
      "The landmark guide to internal medicine—updated and streamlined for today's students and clinicians.",
    condition: "FAIR" as const,
    category: "medical",
    status: "AVAILABLE" as const,
    price: 0,
    university: "Grant Medical College, Mumbai",
    course: "Sem 6 · Internal Medicine",
    acceptsExchange: false,
    images: [
      "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=800",
    ],
    ownerIdx: 3,
  },
]

const DUMMY_BADGES = [
  {
    name: "First Donation",
    description: "Donated your very first book",
    category: "DONATION" as const,
    iconUrl: "/badges/first_donation.jpg",
    requirementThreshold: 1,
  },
  {
    name: "Library Builder",
    description: "Donated 5 or more books",
    category: "DONATION" as const,
    iconUrl: "/badges/library_builder.jpg",
    requirementThreshold: 5,
  },
  {
    name: "Trusted Reader",
    description: "Completed 3 successful book exchanges",
    category: "TRUST" as const,
    iconUrl: "/badges/trusted_reader.jpg",
    requirementThreshold: 3,
  },
  {
    name: "Community Pioneer",
    description: "Joined AksharSetu in the first 6 months",
    category: "COMMUNITY" as const,
    iconUrl: "/badges/community_pioneer.jpg",
    requirementThreshold: 0,
  },
]

async function main() {
  console.log("Start seeding ...")
  const hashedPassword = await bcrypt.hash("password123", 12)

  const createdUsers = []
  for (const r of COMMUNITY_READERS) {
    const u = await prisma.user.upsert({
      where: { email: r.email },
      update: {
        name: r.name,
        bio: r.bio,
        location: r.location,
        favoriteQuote: r.favoriteQuote,
        quoteAuthor: r.quoteAuthor,
        liveStatus: r.liveStatus,
        isShantiModeActive: r.isShantiModeActive,
      },
      create: {
        email: r.email,
        name: r.name,
        password: hashedPassword,
        role: "USER",
        bio: r.bio,
        location: r.location,
        favoriteQuote: r.favoriteQuote,
        quoteAuthor: r.quoteAuthor,
        liveStatus: r.liveStatus,
        isShantiModeActive: r.isShantiModeActive,
      },
    })
    createdUsers.push(u)
    console.log(`Upserted reader profile: ${u.name} (${u.id})`)
  }

  for (const b of DUMMY_BOOKS) {
    const { ownerIdx, ...bookData } = b
    const owner = createdUsers[ownerIdx] || createdUsers[0]
    const existingBook = await prisma.book.findFirst({
      where: { title: bookData.title },
    })
    if (!existingBook) {
      await prisma.book.create({
        data: {
          ...bookData,
          ownerId: owner.id,
        },
      })
    } else {
      await prisma.book.update({
        where: { id: existingBook.id },
        data: {
          ownerId: owner.id,
          price: bookData.price,
          university: bookData.university,
          course: bookData.course,
          acceptsExchange: bookData.acceptsExchange,
          exchangePreferences: bookData.exchangePreferences,
        },
      })
    }
  }
  console.log("Ensured catalog books are seeded.")

  for (const badge of DUMMY_BADGES) {
    const existingBadge = await prisma.badge.findFirst({
      where: { name: badge.name },
    })
    if (!existingBadge) {
      await prisma.badge.create({ data: badge })
    }
  }

  console.log("Seeding finished.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
