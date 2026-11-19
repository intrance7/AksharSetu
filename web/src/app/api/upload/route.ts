import { NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { auth } from "@/auth"

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
])

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const { filename, contentType } = body
    if (
      typeof filename !== "string" ||
      !filename.trim() ||
      typeof contentType !== "string" ||
      !contentType.trim()
    ) {
      return NextResponse.json({ error: "Missing filename or contentType" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(contentType.toLowerCase())) {
      return NextResponse.json(
        { error: "Unsupported image format. Use JPG, PNG, WebP, GIF, or AVIF." },
        { status: 400 }
      )
    }

    const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, "_")
    const uniqueFilename = `${Date.now()}-${cleanName}`

    const hasRealS3 =
      Boolean(process.env.AWS_ACCESS_KEY_ID) &&
      process.env.AWS_ACCESS_KEY_ID !== "mock-key" &&
      Boolean(process.env.AWS_SECRET_ACCESS_KEY) &&
      Boolean(process.env.AWS_BUCKET_NAME)

    if (!hasRealS3) {
      return NextResponse.json({
        uploadUrl: `/api/upload/local?filename=${encodeURIComponent(uniqueFilename)}`,
        publicUrl: `/uploads/${uniqueFilename}`,
      })
    }

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    const key = `books/${uniqueFilename}`
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 120 })
    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`

    return NextResponse.json({ uploadUrl, publicUrl })
  } catch (error) {
    console.error("Upload URL error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
