import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ChatThread, ChatContextBanner } from "@/components/messages/ChatThread"

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
  } else if (sp.book) {
    const targetBook = await prisma.book.findUnique({
      where: { id: sp.book },
    })
    if (targetBook) {
      const priceLabel =
        targetBook.price === 0
          ? targetBook.acceptsExchange
            ? "1-for-1 Swap"
            : "Free Donation"
          : `₹${targetBook.price}`
      contextBanner = {
        badge: `Book Inquiry · ${priceLabel}`,
        title: `${targetBook.title} by ${targetBook.author}`,
        prefillMessage: `Hi! I'm interested in your listing "${targetBook.title}" (${priceLabel}, ${targetBook.condition.replace(
          "_",
          " "
        )}). Is it still available for ${
          targetBook.deliveryType === "MEETUP"
            ? "a local meetup handoff"
            : "pickup or shipping"
        }?`,
        bookId: targetBook.id,
      }
    }
  } else if (sp.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: sp.orderId },
      include: { book: true, shipment: true },
    })
    if (order) {
      contextBanner = {
        badge: `Order #${order.shipment?.awbCode || order.id.slice(0, 8)}`,
        title: `${order.book.title} · ₹${order.amount}`,
        prefillMessage: `Hi! Reaching out regarding our order for "${order.book.title}" (${
          order.shipment?.awbCode ? `AWB #${order.shipment.awbCode}` : "Order confirmed"
        }).`,
        orderId: order.id,
        bookId: order.bookId,
      }
    }
  } else if (sp.quote) {
    contextBanner = {
      badge: "Shared Literary Passage",
      title: sp.quoteSource || "E-Library Highlight",
      prefillMessage: `“${sp.quote}”${sp.quoteSource ? ` — ${sp.quoteSource}` : ""}`,
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-20 pb-6">
      <div className="container mx-auto max-w-6xl px-4">
        <ChatThread userId={userId} contextBanner={contextBanner} />
      </div>
    </div>
  )
}
