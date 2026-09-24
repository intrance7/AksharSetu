import { NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { auth } from "@/auth"

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "mock-key",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "mock-secret",
  },
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { filename, contentType } = await req.json()
    if (!filename || !contentType) {
      return NextResponse.json({ error: "Missing filename or contentType" }, { status: 400 })
    }

    // Mock mode if AWS credentials are not configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_BUCKET_NAME) {
      console.warn("AWS S3 credentials not found. Returning a mock presigned URL.")
      return NextResponse.json({
        uploadUrl: "mock",
        publicUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800", // Placeholder
      })
    }

    const key = `books/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "")}`
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 })
    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`

    return NextResponse.json({ uploadUrl, publicUrl })
  } catch (error) {
    console.error("Presigned URL error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
