import { NextResponse } from "next/server"
import crypto from "crypto"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

function mapTicketForClient(t: any) {
  const responses = Array.isArray(t.responses) ? t.responses : []
  const lastAdmin = responses[responses.length - 1]
  return {
    id: t.id,
    ticketNumber: t.ticketCode,
    ticketCode: t.ticketCode,
    category: t.category,
    subject: t.subject,
    description: t.description,
    contactEmail: t.email,
    status: t.status,
    priority:
      t.category === "PAYMENT_ISSUE" ||
      t.category === "ACCOUNT_ACCESS" ||
      t.category === "COPYRIGHT_DMCA"
        ? "HIGH"
        : "NORMAL",
    adminResponse: lastAdmin?.message || null,
    respondedAt: lastAdmin?.createdAt || null,
    createdAt: t.createdAt,
  }
}

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id

    const customArticles = await prisma.helpCustomArticle.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
    })

    if (!userId) {
      return NextResponse.json({
        tickets: [],
        customArticles,
      })
    }

    const myTicketsRaw = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    })

    let allTickets: unknown[] = []
    if ((session?.user as any)?.role === "ADMIN") {
      const rawAll = await prisma.supportTicket.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, username: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      allTickets = rawAll.map(mapTicketForClient)
    }

    return NextResponse.json({
      tickets: myTicketsRaw.map(mapTicketForClient),
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
    const session = await auth()
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
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

      if (!subject || !description || !contactEmail) {
        return NextResponse.json(
          { error: "Subject, description, and contact email are required." },
          { status: 400 }
        )
      }

      const randomCode = crypto.randomBytes(4).toString("hex").toUpperCase()
      const ticketCode = `TKT-${randomCode}`

      const ticket = await prisma.supportTicket.create({
        data: {
          ticketCode,
          userId: session?.user?.id || null,
          email: contactEmail,
          name:
            session?.user?.name ||
            String(body.contactName || "AksharSetu Reader").trim(),
          category,
          subject,
          description,
          referenceUrl: relatedUrl,
          status: "OPEN",
        },
      })

      if (session?.user?.id) {
        await prisma.notification
          .create({
            data: {
              userId: session.user.id,
              type: "SUPPORT_TICKET",
              message: `Support ticket ${ticket.ticketCode} ("${ticket.subject}") has been received.`,
              link: `/support`,
            },
          })
          .catch(() => {})
      }

      return NextResponse.json({ ticket: mapTicketForClient(ticket) })
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })
    if (dbUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (action === "admin_update_ticket") {
      const { ticketId, status, adminResponse } = body
      if (!ticketId) {
        return NextResponse.json({ error: "Missing ticketId" }, { status: 400 })
      }

      const existing = await prisma.supportTicket.findUnique({
        where: { id: String(ticketId) },
      })
      if (!existing) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
      }
      const prevResponses = Array.isArray(existing?.responses)
        ? (existing.responses as any[])
        : []
      const nextResponses =
        adminResponse && String(adminResponse).trim()
          ? [
              ...prevResponses,
              {
                senderName: session?.user?.name || "Support Admin",
                role: "ADMIN",
                message: String(adminResponse).trim(),
                createdAt: new Date().toISOString(),
              },
            ]
          : prevResponses

      const updated = await prisma.supportTicket.update({
        where: { id: String(ticketId) },
        data: {
          ...(status ? { status: String(status) } : {}),
          responses: nextResponses,
        },
      })

      if (updated.userId) {
        await prisma.notification
          .create({
            data: {
              userId: updated.userId,
              type: "SUPPORT_UPDATE",
              message: `Ticket ${updated.ticketCode} status updated to ${updated.status}.`,
              link: `/support`,
            },
          })
          .catch(() => {})
      }

      return NextResponse.json({ ticket: mapTicketForClient(updated) })
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
          category: categorySlug,
          summary,
          body: contentMarkdown,
          published: body.isPublished !== false,
        },
        create: {
          slug,
          title,
          category: categorySlug,
          summary,
          body: contentMarkdown,
          published: body.isPublished !== false,
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
