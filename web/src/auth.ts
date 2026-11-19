import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { cached } from "@/lib/fastCache"
import { ensureUserUsername, hasLegacyUuidSuffix } from "@/lib/username"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

const googleClientId = process.env.AUTH_GOOGLE_ID?.trim()
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET?.trim()
export const isGoogleOAuthConfigured = Boolean(
  googleClientId &&
    googleClientSecret &&
    googleClientId !== "placeholder" &&
    googleClientSecret !== "placeholder"
)

const providers: any[] = []

if (isGoogleOAuthConfigured) {
  providers.push(
    Google({
      clientId: googleClientId!,
      clientSecret: googleClientSecret!,
      allowDangerousEmailAccountLinking: true,
    })
  )
}

providers.push(
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }

      const normalizedEmail = String(credentials.email).trim().toLowerCase()
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      })

      if (!user || !user.password) {
        return null
      }

      const isPasswordValid = await bcrypt.compare(
        String(credentials.password),
        user.password
      )

      if (!isPasswordValid) {
        return null
      }

      return user
    },
  })
)

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        let userId = token.sub
        const email = session.user.email?.trim().toLowerCase() || null

        try {
          const dbUser = await cached(
            `session-user:${userId}`,
            60_000,
            async () => {
              let found = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                  id: true,
                  role: true,
                  name: true,
                  image: true,
                  username: true,
                },
              })

              if (!found && email) {
                const byEmail = await prisma.user.findUnique({
                  where: { email },
                  select: {
                    id: true,
                    role: true,
                    name: true,
                    image: true,
                    username: true,
                  },
                })
                if (byEmail) found = byEmail
              }

              // Auto-provision user in active DB if JWT session came from local/previous DB instance
              if (!found) {
                const fallbackEmail =
                  email || `${userId.slice(0, 8)}@aksharsetu.local`
                found = await prisma.user.create({
                  data: {
                    id: userId,
                    name: session.user.name || "Reader",
                    email: fallbackEmail,
                    image: session.user.image || null,
                    role: (token.role as string) || "USER",
                  },
                  select: {
                    id: true,
                    role: true,
                    name: true,
                    image: true,
                    username: true,
                  },
                })
              }

              if (
                !found.username ||
                hasLegacyUuidSuffix(found.username, found.id)
              ) {
                found.username = await ensureUserUsername(
                  found.id,
                  found.name,
                  email
                )
              }

              return found
            }
          )

          session.user.id = dbUser.id
          session.user.role = dbUser.role || (token.role as string) || "USER"
          session.user.username = dbUser.username || null
          if (dbUser.name) session.user.name = dbUser.name
          if (dbUser.image !== null) session.user.image = dbUser.image
        } catch {
          session.user.id = userId
          session.user.role = (token.role as string) || "USER"
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.role = (user as any).role || "USER"
      }
      return token
    },
  },
})
