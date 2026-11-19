import { auth } from "@/auth"
import { ensureUserUsername, hasLegacyUuidSuffix } from "@/lib/username"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ProfileDashboardRedirect() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }
  const username =
    session.user.username &&
    !hasLegacyUuidSuffix(session.user.username, session.user.id)
      ? session.user.username
      : await ensureUserUsername(
          session.user.id,
          session.user.name,
          session.user.email
        )
  redirect(`/profile/${username || session.user.id}`)
}
