import { redirect } from "next/navigation"

export default async function UserProfileRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/profile/${id}`)
}
