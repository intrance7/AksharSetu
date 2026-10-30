export interface UserStatsInput {
  booksListed: number
  booksDonated: number
  badgesEarned: number
  readingMinutes: number
  libraryCount?: number
}

export interface ComputedProfileStats extends UserStatsInput {
  libraryCount: number
  totalXP: number
  level: number
  xpIntoLevel: number
  xpForNextLevel: number
  progressPercent: number
  rankTitle: string
}

export const PRESET_QUOTES: { quote: string; author: string }[] = [
  {
    quote: "A reader lives a thousand lives before he dies. The man who never reads lives only one.",
    author: "George R.R. Martin",
  },
  {
    quote: "Where the mind is without fear and the head is held high, into that heaven of freedom, my Father, let my country awake.",
    author: "Rabindranath Tagore",
  },
  {
    quote: "One best book is equal to hundred good friends, but one good friend is equal to a library.",
    author: "Dr. A.P.J. Abdul Kalam",
  },
  {
    quote: "I have always imagined that Paradise will be a kind of library.",
    author: "Jorge Luis Borges",
  },
  {
    quote: "If there's a book that you want to read, but it hasn't been written yet, then you must write it.",
    author: "Toni Morrison",
  },
  {
    quote: "A book is a proof that humans are capable of working magic.",
    author: "Carl Sagan",
  },
]

export function getRankTitle(level: number): string {
  if (level >= 15) return "Akshar Guardian"
  if (level >= 10) return "Vidya Daan Patron"
  if (level >= 6) return "Literary Scholar"
  if (level >= 3) return "Chapter Seeker"
  return "Page Turner"
}

export function computeUserStats(input: UserStatsInput): ComputedProfileStats {
  const libraryCount = input.libraryCount ?? 0
  const totalXP =
    input.booksListed * 50 +
    input.booksDonated * 100 +
    input.readingMinutes * 2 +
    input.badgesEarned * 75 +
    libraryCount * 25

  const xpForNextLevel = 500
  const level = Math.floor(totalXP / xpForNextLevel) + 1
  const xpIntoLevel = totalXP % xpForNextLevel
  const progressPercent = Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100))

  return {
    ...input,
    libraryCount,
    totalXP,
    level,
    xpIntoLevel,
    xpForNextLevel,
    progressPercent,
    rankTitle: getRankTitle(level),
  }
}
