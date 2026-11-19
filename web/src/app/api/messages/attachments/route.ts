import { NextResponse } from "next/server"
import sharp from "sharp"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_FILE_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_FILE_UPLOAD_BYTES,
  IMAGE_MAX_DIMENSION,
  RATE_LIMITS,
} from "@/lib/messaging/constants"
import { MessagingError, errorResponse } from "@/lib/messaging/http"
import { requireConversationParticipant } from "@/lib/messaging/service"

const IMAGE_MIME_SET = new Set<string>(ACCEPTED_IMAGE_TYPES)

// POST /api/messages/attachments — upload a validated image or document attachment for a conversation
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const myId = session.user.id
    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      throw new MessagingError(400, "Invalid multipart upload payload.", "BAD_REQUEST")
    }
    const file = formData.get("file") as File | null
    const conversationId = formData.get("conversationId") as string | null

    if (!file || !conversationId) {
      throw new MessagingError(
        400,
        "Both file and conversationId are required.",
        "BAD_REQUEST"
      )
    }

    await requireConversationParticipant(conversationId, myId)

    // Rate limit uploads per hour
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentUploads = await prisma.messageAttachment.count({
      where: { uploaderId: myId, createdAt: { gte: hourAgo } },
    })
    if (recentUploads >= RATE_LIMITS.uploadsPerHour) {
      throw new MessagingError(
        429,
        "Upload limit reached. Please wait a little before uploading more files.",
        "RATE_LIMITED"
      )
    }

    const rawMime = (file.type || "").toLowerCase()
    const isImage = IMAGE_MIME_SET.has(rawMime)
    const isAllowedDoc = Boolean(ACCEPTED_FILE_TYPES[rawMime])

    if (!isImage && !isAllowedDoc) {
      throw new MessagingError(
        400,
        "Unsupported file type. Allowed: JPG, PNG, WebP, GIF, AVIF, PDF, TXT, or DOCX.",
        "INVALID_FILE_TYPE"
      )
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer())
    if (rawBuffer.byteLength === 0) {
      throw new MessagingError(400, "Uploaded file is empty.", "EMPTY_FILE")
    }

    const maxBytes = isImage ? MAX_IMAGE_UPLOAD_BYTES : MAX_FILE_UPLOAD_BYTES
    if (rawBuffer.byteLength > maxBytes) {
      throw new MessagingError(
        400,
        `File exceeds the ${Math.round(maxBytes / (1024 * 1024))}MB size limit.`,
        "FILE_TOO_LARGE"
      )
    }

    const safeFileName =
      file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "attachment"

    let finalBuffer: Buffer = rawBuffer
    let finalMime = rawMime
    let width: number | null = null
    let height: number | null = null

    if (isImage) {
      try {
        const image = sharp(rawBuffer).rotate()
        const metadata = await image.metadata()
        const processed = await image
          .resize({
            width: IMAGE_MAX_DIMENSION,
            height: IMAGE_MAX_DIMENSION,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 82 })
          .toBuffer({ resolveWithObject: true })

        finalBuffer = processed.data
        finalMime = "image/webp"
        width = processed.info.width || metadata.width || null
        height = processed.info.height || metadata.height || null
      } catch {
        throw new MessagingError(
          400,
          "Invalid or corrupted image file.",
          "INVALID_IMAGE"
        )
      }
    }

    const created = await prisma.messageAttachment.create({
      data: {
        conversationId,
        uploaderId: myId,
        kind: isImage ? "IMAGE" : "FILE",
        mimeType: finalMime,
        fileName: safeFileName,
        size: finalBuffer.byteLength,
        width,
        height,
        data: finalBuffer,
      },
      select: {
        id: true,
        kind: true,
        mimeType: true,
        fileName: true,
        size: true,
        width: true,
        height: true,
      },
    })

    return NextResponse.json(
      {
        ...created,
        url: `/api/messages/attachments/${created.id}`,
      },
      { status: 201 }
    )
  } catch (error) {
    return errorResponse(error)
  }
}
