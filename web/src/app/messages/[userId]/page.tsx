import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ChatThread } from "@/components/messages/ChatThread"

export default async function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const { userId } = await params

  // Don't allow messaging yourself
  if (userId === session.user.id) {
    redirect("/messages")
  }

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-24 pb-8">
      <div className="container mx-auto max-w-2xl px-4">
        <ChatThread userId={userId} />
      </div>
    </div>
  )
}
