import { NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import sharp from "sharp"
import { auth } from "@/auth"

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB

function sanitizeFilename(raw: string): string {
  const base = path.basename(raw).replace(/[^a-zA-Z0-9._-]/g, "_")
  return base || `${Date.now()}-upload.jpg`
}

async function compressToWebpDataUrl(buffer: Buffer): Promise<string> {
  try {
    const optimized = await sharp(buffer)
      .rotate()
      .resize({ width: 900, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer()
    return `data:image/webp;base64,${optimized.toString("base64")}`
  } catch {
    return `data:image/jpeg;base64,${buffer.toString("base64")}`
  }
}

async function saveBufferToUploads(filename: string, buffer: Buffer): Promise<string> {
  if (buffer.byteLength === 0) {
    throw new Error("Empty file payload")
  }
  if (buffer.byteLength > MAX_BYTES) {
    throw new Error("Image exceeds 8MB size limit")
  }

  // On Vercel serverless (/var/task is read-only), compress to WebP data URL
  if (process.env.VERCEL) {
    return compressToWebpDataUrl(buffer)
  }

  try {
    const safeName = sanitizeFilename(filename)
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await fs.mkdir(uploadDir, { recursive: true })
    const destPath = path.join(uploadDir, safeName)
    await fs.writeFile(destPath, buffer)
    return `/uploads/${safeName}`
  } catch {
    // Fallback if filesystem is read-only in container/serverless
    return compressToWebpDataUrl(buffer)
  }
}

// PUT /api/upload/local?filename=... — drop-in match for S3 presigned PUT callers
export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const rawName = searchParams.get("filename") || `${Date.now()}-image.jpg`
    const arrayBuffer = await req.arrayBuffer()
    const publicUrl = await saveBufferToUploads(rawName, Buffer.from(arrayBuffer))

    return NextResponse.json({ publicUrl })
  } catch (error: any) {
    console.error("Local PUT upload error:", error)
    return NextResponse.json(
      { error: error?.message || "Upload failed" },
      { status: 400 }
    )
  }
}

// POST /api/upload/local — multipart/form-data convenience upload
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "Missing file field" }, { status: 400 })
    }

    const uniqueName = `${Date.now()}-${file.name}`
    const arrayBuffer = await file.arrayBuffer()
    const publicUrl = await saveBufferToUploads(uniqueName, Buffer.from(arrayBuffer))

    return NextResponse.json({ publicUrl })
  } catch (error: any) {
    console.error("Local POST upload error:", error)
    return NextResponse.json(
      { error: error?.message || "Upload failed" },
      { status: 400 }
    )
  }
}
