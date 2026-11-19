import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ChatThread, ChatContextBanner } from "@/components/messages/ChatThread"

export const dynamic = "force-dynamic"

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<{
    action?: string
    reqId?: string
    book?: string
    offeredBook?: string
    orderId?: string
    quote?: string
    quoteSource?: string
  }>
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { userId } = await params
  const sp = await searchParams

  if (userId === session.user.id) {
    redirect("/messages")
  }

  let contextBanner: ChatContextBanner | null = null
  let initialBookId: string | null = sp.book || null

  if (sp.action === "fulfill_request" && sp.reqId) {
    const req = await prisma.communityRequest.findUnique({
      where: { id: sp.reqId },
    })
    if (req) {
      contextBanner = {
        badge: "Community Request Fulfillment",
        title: `You have "${req.title}"${req.author ? ` by ${req.author}` : ""}`,
        prefillMessage: `Hi! I saw your Community Request for "${req.title}"${
          req.author ? ` by ${req.author}` : ""
        } — I have a copy available! Let me know how you'd like to coordinate a handoff or exchange.`,
      }
    }
  } else if (sp.action === "exchange" && sp.book) {
    const [targetBook, offeredBook] = await Promise.all([
      prisma.book.findUnique({ where: { id: sp.book } }),
      sp.offeredBook
        ? prisma.book.findUnique({ where: { id: sp.offeredBook } })
        : Promise.resolve(null),
    ])
    if (targetBook) {
      initialBookId = targetBook.id
      contextBanner = {
        badge: "1-for-1 Book Swap Proposal",
        title: offeredBook
          ? `Swap "${offeredBook.title}" ⇄ "${targetBook.title}"`
          : `Propose an exchange for "${targetBook.title}"`,
        prefillMessage: offeredBook
          ? `Hi! I'd love to propose a 1-for-1 book swap: my copy of "${offeredBook.title}" (${offeredBook.condition.replace(
              "_",
              " "
            )}) in exchange for your "${targetBook.title}". Let me know if you're interested!`
          : `Hi! I'm interested in exchanging a book from my shelf for your "${targetBook.title}" by ${targetBook.author}. What genres or titles are you looking for?`,
        bookId: targetBook.id,
      }
    }
  } else if (sp.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: sp.orderId },
      include: { book: true, shipment: true },
    })
    if (order) {
      initialBookId = order.bookId
      contextBanner = {
        badge: `Order #${order.shipment?.awbCode || order.id.slice(0, 8)}`,
        title: `${order.book.title} · ₹${order.amount}`,
        prefillMessage: `Hi! Reaching out regarding our order for "${order.book.title}" (${
          order.shipment?.awbCode
            ? `AWB #${order.shipment.awbCode}`
            : "Order confirmed"
        }).`,
        orderId: order.id,
        bookId: order.bookId,
      }
    }
  } else if (sp.quote) {
    contextBanner = {
      badge: "Shared Literary Passage",
      title: sp.quoteSource || "E-Library Highlight",
      prefillMessage: `“${sp.quote}”${
        sp.quoteSource ? ` — ${sp.quoteSource}` : ""
      }`,
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F2EBE1] py-4">
      <div className="container mx-auto max-w-7xl px-3 md:px-6">
        <ChatThread
          userId={userId}
          initialBookId={initialBookId}
          contextBanner={contextBanner}
        />
      </div>
    </div>
  )
}
