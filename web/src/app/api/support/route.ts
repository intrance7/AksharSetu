import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    const customArticles = await prisma.helpCustomArticle.findMany({
      where: { isPublished: true },
      orderBy: { updatedAt: "desc" },
    })

    if (!userId) {
      return NextResponse.json({
        tickets: [],
        customArticles,
      })
    }

    const myTickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    })

    let allTickets: unknown[] = []
    if (session?.user?.role === "ADMIN") {
      allTickets = await prisma.supportTicket.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, username: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    }

    return NextResponse.json({
      tickets: myTickets,
      allTickets,
      customArticles,
    })
  } catch (error) {
    console.error("Failed to fetch support data:", error)
    return NextResponse.json(
      { error: "Failed to load support data" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const action = body.action || "create_ticket"

    if (action === "create_ticket") {
      const category = String(body.category || "GENERAL").trim()
      const subject = String(body.subject || "").trim().slice(0, 160)
      const description = String(body.description || "").trim().slice(0, 4000)
      const contactEmail = String(
        body.contactEmail || session?.user?.email || ""
      )
        .trim()
        .slice(0, 160)
      const relatedUrl = body.relatedUrl
        ? String(body.relatedUrl).trim().slice(0, 300)
        : null
      const attachmentUrl = body.attachmentUrl
        ? String(body.attachmentUrl).trim().slice(0, 500)
        : null

      if (!subject || !description || !contactEmail) {
        return NextResponse.json(
          { error: "Subject, description, and contact email are required." },
          { status: 400 }
        )
      }

      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      const ticketNumber = `TKT-${randomCode}`

      const priority =
        category === "PAYMENT_ISSUE" ||
        category === "ACCOUNT_ACCESS" ||
        category === "COPYRIGHT_DMCA"
          ? "HIGH"
          : "NORMAL"

      const ticket = await prisma.supportTicket.create({
        data: {
          ticketNumber,
          userId: session?.user?.id || null,
          contactEmail,
          contactName: session?.user?.name || String(body.contactName || "").trim() || null,
          category,
          subject,
          description,
          relatedUrl,
          attachmentUrl,
          priority,
          status: "OPEN",
        },
      })

      if (session?.user?.id) {
        await prisma.notification
          .create({
            data: {
              userId: session.user.id,
              type: "SUPPORT_TICKET",
              message: `Support ticket ${ticket.ticketNumber} ("${ticket.subject}") has been received.`,
              link: `/support`,
            },
          })
          .catch(() => {})
      }

      return NextResponse.json({ ticket })
    }

    // Admin actions below require ADMIN role
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (action === "admin_update_ticket") {
      const { ticketId, status, adminResponse, priority } = body
      if (!ticketId) {
        return NextResponse.json({ error: "Missing ticketId" }, { status: 400 })
      }

      const updated = await prisma.supportTicket.update({
        where: { id: String(ticketId) },
        data: {
          ...(status ? { status: String(status) } : {}),
          ...(priority ? { priority: String(priority) } : {}),
          ...(adminResponse !== undefined
            ? {
                adminResponse: String(adminResponse).trim() || null,
                respondedById: session.user.id,
                respondedAt: new Date(),
              }
            : {}),
        },
      })

      if (updated.userId) {
        await prisma.notification
          .create({
            data: {
              userId: updated.userId,
              type: "SUPPORT_UPDATE",
              message: `Ticket ${updated.ticketNumber} status updated to ${updated.status}.`,
              link: `/support`,
            },
          })
          .catch(() => {})
      }

      return NextResponse.json({ ticket: updated })
    }

    if (action === "admin_save_article") {
      const slug = String(body.slug || "")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
      const title = String(body.title || "").trim()
      const categorySlug = String(body.categorySlug || "getting-started").trim()
      const summary = String(body.summary || "").trim()
      const contentMarkdown = String(body.contentMarkdown || "").trim()

      if (!slug || !title || !summary || !contentMarkdown) {
        return NextResponse.json(
          { error: "All article fields are required." },
          { status: 400 }
        )
      }

      const article = await prisma.helpCustomArticle.upsert({
        where: { slug },
        update: {
          title,
          categorySlug,
          summary,
          contentMarkdown,
          isPublished: body.isPublished !== false,
          updatedById: session.user.id,
        },
        create: {
          slug,
          title,
          categorySlug,
          summary,
          contentMarkdown,
          isPublished: body.isPublished !== false,
          updatedById: session.user.id,
        },
      })

      return NextResponse.json({ article })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Support POST error:", error)
    return NextResponse.json(
      { error: "Failed to process support request" },
      { status: 500 }
    )
  }
}
