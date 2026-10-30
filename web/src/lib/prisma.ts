import path from "path"
import type { PrismaClient } from "@prisma/client"

const createFreshPrismaClient = (): PrismaClient => {
  try {
    const nodeRequire = eval("require") as NodeRequire
    for (const key of Object.keys(nodeRequire.cache || {})) {
      if (key.includes(".prisma") || key.includes("@prisma")) {
        delete nodeRequire.cache[key]
      }
    }
    const clientPath = path.join(
      process.cwd(),
      "node_modules",
      ".prisma",
      "client",
      "index.js"
    )
    const { PrismaClient: FreshPrismaClient } = nodeRequire(clientPath)
    return new FreshPrismaClient()
  } catch {
    const { PrismaClient: FallbackClient } = require("@prisma/client")
    return new FallbackClient()
  }
}

declare const globalThis: {
  prismaGlobalV3?: PrismaClient
} & typeof global

const prisma: PrismaClient =
  globalThis.prismaGlobalV3 ?? createFreshPrismaClient()

export default prisma

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobalV3 = prisma
}
