import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

// GET /api/messages/attachments/[id] — serve attachment privately to conversation participants only
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const attachment = await prisma.messageAttachment.findUnique({
      where: { id },
    })

    if (!attachment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: attachment.conversationId,
          userId: session.user.id,
        },
      },
    })

    if (!participant && attachment.uploaderId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const disposition =
      attachment.kind === "IMAGE"
        ? `inline; filename="${attachment.fileName}"`
        : `attachment; filename="${attachment.fileName}"`

    return new Response(new Uint8Array(attachment.data), {
      status: 200,
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Length": String(attachment.size),
        "Content-Disposition": disposition,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600, immutable",
      },
    })
  } catch (error) {
    console.error("Serve attachment error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
