import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { ensureAllUsersHaveUsernames, ensureUserUsername } from "@/lib/username"

export const dynamic = "force-dynamic"

export default async function UserProfileRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await ensureAllUsersHaveUsernames()

  let decoded = id
  try {
    decoded = decodeURIComponent(id)
  } catch {}
  const cleanParam = decoded.trim().replace(/^@+/, "")

  const user =
    (await prisma.user.findUnique({
      where: { username: cleanParam.toLowerCase() },
      select: { id: true, username: true, name: true, email: true },
    })) ||
    (await prisma.user.findUnique({
      where: { id: cleanParam },
      select: { id: true, username: true, name: true, email: true },
    }))

  if (user) {
    const canonicalUsername = await ensureUserUsername(
      user.id,
      user.name,
      user.email
    )
    redirect(`/profile/${canonicalUsername}`)
  }

  redirect(`/profile/${encodeURIComponent(cleanParam || id)}`)
}
