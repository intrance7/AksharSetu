import { PrismaClient } from "@prisma/client"

const createPrismaClient = (): PrismaClient => {
  return new PrismaClient()
}

declare const globalThis: {
  prismaGlobalV11?: PrismaClient
} & typeof global

const existing = globalThis.prismaGlobalV11
const prisma: PrismaClient =
  existing &&
  "bookNote" in existing &&
  "sellerReview" in existing &&
  "bookClub" in existing &&
  "conversation" in existing &&
  "bookOffer" in existing &&
  "xpTransaction" in existing &&
  "supportTicket" in existing
    ? existing
    : createPrismaClient()

globalThis.prismaGlobalV11 = prisma

export default prisma
