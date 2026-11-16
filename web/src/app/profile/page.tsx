import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function ProfileDashboardRedirect() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }
  redirect(`/profile/${session.user.id}`)
}
