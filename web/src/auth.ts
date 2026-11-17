import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
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

        const user = await prisma.user.findUnique({
          where: { email: (credentials.email as string).trim().toLowerCase() },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return user
      },
    }),
  ],
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
          let dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
          })

          if (!dbUser && email) {
            const byEmail = await prisma.user.findUnique({
              where: { email },
              select: { id: true, role: true },
            })
            if (byEmail) {
              dbUser = byEmail
              userId = byEmail.id
            }
          }

          // Auto-provision user in active DB if JWT session came from local/previous DB instance
          if (!dbUser) {
            const fallbackEmail =
              email || `${userId.slice(0, 8)}@aksharsetu.local`
            const created = await prisma.user.create({
              data: {
                id: userId,
                name: session.user.name || "Reader",
                email: fallbackEmail,
                image: session.user.image || null,
                role: (token.role as string) || "USER",
              },
              select: { id: true, role: true },
            })
            dbUser = created
          }

          session.user.id = dbUser.id
          session.user.role = dbUser.role || (token.role as string) || "USER"
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
