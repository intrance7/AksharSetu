import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ConversationList } from "@/components/messages/ConversationList"
import { MessageSquare } from "lucide-react"

export default async function MessagesPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] pt-28 pb-16">
      <div className="container mx-auto max-w-2xl px-4">
        
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-[#1D1D1F] flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#1D1D1F] tracking-tight">
              Messages
            </h1>
            <p className="text-[#1D1D1F]/50 font-medium text-sm">
              Coordinate book handoffs with other readers.
            </p>
          </div>
        </div>

        <ConversationList />

      </div>
    </div>
  )
}
